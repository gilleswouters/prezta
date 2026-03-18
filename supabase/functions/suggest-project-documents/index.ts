import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── Authenticate ────────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        const apiKeyHeader = req.headers.get('apikey')
        const token = authHeader?.replace('Bearer ', '') ?? apiKeyHeader

        if (!token) {
            return new Response(
                JSON.stringify({ error: 'Non autorisé' }),
                { status: 401, headers: corsHeaders }
            )
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Non autorisé' }),
                { status: 401, headers: corsHeaders }
            )
        }

        // ── Parse body ──────────────────────────────────────────────────────
        const { projectName, description } = await req.json() as { projectName: string; description: string }

        if (!projectName && !description) {
            return new Response(
                JSON.stringify({ error: 'projectName ou description requis' }),
                { status: 400, headers: corsHeaders }
            )
        }

        // ── Call Gemini ─────────────────────────────────────────────────────
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const prompt =
            `Tu es un chef de projet pour un profil freelance. Génère une checklist de 5 à 8 documents obligatoires, attendus ou livrables pour le projet nommé "${projectName}".\n` +
            `Description du brief du projet : "${description}".\n` +
            `Réponds UNIQUEMENT avec un tableau JSON valide.\n` +
            `Format exact :\n` +
            `[{ "name": "string (max 60 chars)" }]\n` +
            `Exemples: "Acompte 30% payé", "Brief créatif validé", "Identifiants FTP reçus", "Maquette V1 validée".\n` +
            `Reste concis.`

        const result = await model.generateContent(prompt)
        const raw = result.response.text().trim()
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(clean)

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('Format inattendu de la réponse Gemini')
        }

        // Validate and sanitize on server side
        const suggestions = parsed.map((item: Record<string, unknown>) => ({
            name: String(item.name || 'Document').substring(0, 60),
        }))

        return new Response(
            JSON.stringify({ suggestions }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('suggest-project-documents error:', message)
        return new Response(
            JSON.stringify({ error: 'Échec de la génération' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
