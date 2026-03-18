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
        const { description } = await req.json() as { description: string }

        if (!description) {
            return new Response(
                JSON.stringify({ error: 'description requise' }),
                { status: 400, headers: corsHeaders }
            )
        }

        // ── Call Gemini ─────────────────────────────────────────────────────
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const prompt =
            `Tu es un expert juridique en droit français des contrats B2B freelance. ` +
            `Génère une clause professionnelle et concise en français basée sur : "${description}"\n\n` +
            `Retourne UNIQUEMENT un objet JSON avec exactement 2 champs, sans bloc markdown ni autre texte :\n` +
            `{\n  "title": "Titre court de la clause (sans numéro d'article, max 5 mots)",\n  "body": "Contenu complet de la clause (2 à 6 phrases, ton formel et neutre)."\n}`

        const result = await model.generateContent(prompt)
        const raw = result.response.text().trim()
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(clean) as { title: string; body: string }

        if (!parsed.title || !parsed.body) {
            throw new Error('Format inattendu de la réponse Gemini')
        }

        return new Response(
            JSON.stringify({ clause: parsed }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (err: unknown) {
        console.error('generate-clause error:', err)
        return new Response(
            JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
