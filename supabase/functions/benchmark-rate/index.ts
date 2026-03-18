import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
    productName: string
    unit: string
    priceHT: number
    userMetier: string
}

interface BenchmarkResult {
    verdict: 'sous_marche' | 'dans_la_norme' | 'premium'
    marketMin: number
    marketMax: number
    marketMedian: number
    advice: string
    confidence: 'faible' | 'moyenne' | 'élevée'
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── Authenticate ─────────────────────────────────────────────────────
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

        // ── Read userMetier from profiles table ──────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, legal_status')
            .eq('id', user.id)
            .maybeSingle()

        const userMetierFromProfile =
            (profile?.company_name as string | null) ??
            (profile?.legal_status as string | null) ??
            'freelance'

        // ── Parse body ───────────────────────────────────────────────────────
        const body = await req.json() as RequestBody
        const { productName, unit, priceHT } = body

        // Allow frontend userMetier as override, fallback to profile
        const userMetier = body.userMetier || userMetierFromProfile

        if (!productName || priceHT === undefined || priceHT === null) {
            return new Response(
                JSON.stringify({ error: 'productName et priceHT sont requis' }),
                { status: 400, headers: corsHeaders },
            )
        }

        // ── Gemini 2.0 Flash ─────────────────────────────────────────────────
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
        if (!geminiKey) {
            return new Response(
                JSON.stringify({ error: 'Clé Gemini manquante' }),
                { status: 500, headers: corsHeaders },
            )
        }

        const prompt =
            `Tu es un expert des tarifs freelances en France en 2026.\n` +
            `Un freelance de type '${userMetier}' facture '${productName}' à ${priceHT}€ HT / ${unit}.\n` +
            `Compare ce tarif au marché français 2026 pour ce type de prestation.\n` +
            `Réponds UNIQUEMENT en JSON valide :\n` +
            `{\n` +
            `  "verdict": "sous_marche" | "dans_la_norme" | "premium",\n` +
            `  "marketMin": number,\n` +
            `  "marketMax": number,\n` +
            `  "marketMedian": number,\n` +
            `  "advice": "une phrase actionnable en français",\n` +
            `  "confidence": "faible" | "moyenne" | "élevée"\n` +
            `}\n` +
            `Aucun texte avant ou après le JSON.`

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
                }),
            },
        )

        const geminiData = await geminiRes.json() as {
            candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> }
            }>
        }

        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        // Strip markdown fences if Gemini adds them despite the instruction
        const jsonText = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()

        let parsed: BenchmarkResult
        try {
            parsed = JSON.parse(jsonText) as BenchmarkResult
        } catch {
            console.error('benchmark-rate: JSON parse error —', rawText)
            return new Response(
                JSON.stringify({ error: 'Réponse Gemini invalide — réessayez.' }),
                { status: 502, headers: corsHeaders },
            )
        }

        // Validate required fields
        const VALID_VERDICTS = new Set(['sous_marche', 'dans_la_norme', 'premium'])
        const VALID_CONFIDENCE = new Set(['faible', 'moyenne', 'élevée'])
        if (
            !VALID_VERDICTS.has(parsed.verdict) ||
            typeof parsed.marketMin !== 'number' ||
            typeof parsed.marketMax !== 'number' ||
            typeof parsed.marketMedian !== 'number' ||
            !parsed.advice ||
            !VALID_CONFIDENCE.has(parsed.confidence)
        ) {
            return new Response(
                JSON.stringify({ error: 'Réponse Gemini incomplète — réessayez.' }),
                { status: 502, headers: corsHeaders },
            )
        }

        return new Response(
            JSON.stringify(parsed),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )

    } catch (err: unknown) {
        console.error('benchmark-rate error:', err)
        return new Response(
            JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
