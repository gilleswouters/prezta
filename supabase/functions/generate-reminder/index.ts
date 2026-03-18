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
        const { base_email, doc_title, amount, days_overdue } = await req.json() as {
            base_email: string
            doc_title: string
            amount: string
            days_overdue: number
        }

        if (!base_email) {
            return new Response(
                JSON.stringify({ error: 'base_email requis' }),
                { status: 400, headers: corsHeaders }
            )
        }

        // ── Call Gemini ─────────────────────────────────────────────────────
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const prompt =
            `Tu es un assistant pour freelances français. Améliore cet email de relance de paiement ` +
            `en gardant exactement le même ton et la même structure. ` +
            `Facture : ${doc_title}, montant : ${amount}€, retard : ${days_overdue} jours. ` +
            `Email de base :\n${base_email}\n` +
            `Réponds uniquement avec l'email amélioré, sans explication.`

        const result = await model.generateContent(prompt)
        const improved_email = result.response.text().trim()

        return new Response(
            JSON.stringify({ improved_email }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (err: unknown) {
        console.error('generate-reminder error:', err)
        return new Response(
            JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
