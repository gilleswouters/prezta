import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
    brief: string
    metier?: string
}

interface QuoteLine {
    name: string
    description?: string
    quantity: number
    unitPrice: number
    tvaRate: number
    unit: 'heure' | 'forfait' | 'pièce' | 'jour'
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        const apiKeyHeader = req.headers.get('apikey')
        const token = authHeader?.replace('Bearer ', '') ?? apiKeyHeader

        if (!token) {
            return new Response(
                JSON.stringify({ error: 'Non autorisé' }),
                { status: 401, headers: corsHeaders },
            )
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: `Bearer ${token}` } } },
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Non autorisé' }),
                { status: 401, headers: corsHeaders },
            )
        }

        // ── Parse body ────────────────────────────────────────────────────────
        const body = await req.json() as RequestBody
        const { brief, metier = 'freelance' } = body

        if (!brief?.trim()) {
            return new Response(
                JSON.stringify({ error: 'brief est requis' }),
                { status: 400, headers: corsHeaders },
            )
        }

        // ── Gemini 2.0 Flash ──────────────────────────────────────────────────
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
        if (!geminiKey) {
            return new Response(
                JSON.stringify({ error: 'Clé Gemini manquante côté serveur' }),
                { status: 500, headers: corsHeaders },
            )
        }

        const prompt =
            `Tu es un expert en facturation pour freelances français (${metier}).\n` +
            `L'utilisateur te fournit un brief décrivant les prestations à facturer.\n` +
            `Réponds UNIQUEMENT avec un tableau JSON valide, sans texte ni balises markdown.\n\n` +
            `Format attendu (tableau d'objets) :\n` +
            `[\n` +
            `  {\n` +
            `    "name": "string (titre court de la prestation)",\n` +
            `    "description": "string (description détaillée)",\n` +
            `    "quantity": number,\n` +
            `    "unitPrice": number (prix HT logique pour ce type de prestation),\n` +
            `    "tvaRate": number (20 par défaut),\n` +
            `    "unit": "heure" | "forfait" | "pièce" | "jour"\n` +
            `  }\n` +
            `]\n\n` +
            `Brief : "${brief}"`

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
                }),
            },
        )

        const geminiData = await geminiRes.json() as {
            candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> }
            }>
        }

        const rawText  = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const jsonText = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()

        let lines: QuoteLine[]
        try {
            lines = JSON.parse(jsonText) as QuoteLine[]
        } catch {
            console.error('generate-quote-brief: JSON parse error —', rawText)
            return new Response(
                JSON.stringify({ error: 'Réponse IA invalide — veuillez réessayer.' }),
                { status: 502, headers: corsHeaders },
            )
        }

        if (!Array.isArray(lines)) {
            return new Response(
                JSON.stringify({ error: 'Réponse IA invalide — format inattendu.' }),
                { status: 502, headers: corsHeaders },
            )
        }

        return new Response(
            JSON.stringify({ lines }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )

    } catch (err: unknown) {
        console.error('generate-quote-brief error:', err)
        return new Response(
            JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
