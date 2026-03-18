import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const VALID_UNITS = ['heure', 'forfait', 'pièce', 'jour']

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
        const { metier, pays, count = 8 } = await req.json() as { metier: string; pays: string; count?: number }

        if (!metier || !pays) {
            return new Response(
                JSON.stringify({ error: 'metier et pays requis' }),
                { status: 400, headers: corsHeaders }
            )
        }

        // ── Call Gemini ─────────────────────────────────────────────────────
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const prompt =
            `Tu es un assistant pour freelances ${pays}. Génère exactement ${count} prestations typiques pour un freelance "${metier}" en ${pays} en 2026.\n` +
            `Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans markdown, sans backticks.\n` +
            `Format exact :\n` +
            `[{ "name": "string", "description": "string (max 80 chars)", "unit_price": number, "tva_rate": number, "unit": "heure" | "forfait" | "pièce" | "jour" }]\n` +
            `Les prix doivent être réalistes pour le marché ${pays}.\n` +
            `L'unité doit être exactement l'une de ces 4 chaînes : "heure" | "forfait" | "pièce" | "jour".`

        const result = await model.generateContent(prompt)
        const raw = result.response.text().trim()
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(clean)

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('Format inattendu de la réponse Gemini')
        }

        // Validate and sanitize on server side
        const prestations = parsed.map((item: Record<string, unknown>) => ({
            name: String(item.name || 'Prestation'),
            description: item.description ? String(item.description).substring(0, 80) : null,
            unit_price: Number(item.unit_price) || 0,
            tva_rate: Number(item.tva_rate) || 0,
            unit: VALID_UNITS.includes(String(item.unit)) ? String(item.unit) : 'forfait',
        }))

        return new Response(
            JSON.stringify({ prestations }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('generate-catalogue error:', message)
        return new Response(
            JSON.stringify({ error: 'Échec de la génération' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
