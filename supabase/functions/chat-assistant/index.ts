import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { createClient } from "jsr:@supabase/supabase-js@2"

interface ChatMessage {
    role: string
    content: string
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate the user from the JWT token
        const authHeader = req.headers.get('Authorization')
        const apiKeyHeader = req.headers.get('apikey')
        const token = authHeader?.replace('Bearer ', '') ?? apiKeyHeader

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing or invalid Auth header' }), { status: 401, headers: corsHeaders })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: corsHeaders })
        }

        const { messages } = await req.json()
        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400, headers: corsHeaders })
        }

        // 2. Fetch time tracking data server-side (last 30 days)
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

        const { data: timeEntries } = await supabase
            .from('time_entries')
            .select('project_id, duration_seconds, projects(id, name)')
            .eq('user_id', user.id)
            .eq('is_running', false)
            .gte('started_at', since)

        // Aggregate by project
        const projectSeconds = new Map<string, { name: string; seconds: number }>()
        for (const entry of (timeEntries ?? [])) {
            const pid = entry.project_id ?? '__none__'
            const pname = (entry.projects as { name: string } | null)?.name ?? 'Sans projet'
            const cur = projectSeconds.get(pid) ?? { name: pname, seconds: 0 }
            cur.seconds += entry.duration_seconds ?? 0
            projectSeconds.set(pid, cur)
        }

        // Fetch paid invoices for the same 30-day window to compute revenue per project
        const { data: invoices } = await supabase
            .from('invoices')
            .select('project_id, amount, status')
            .eq('user_id', user.id)
            .in('status', ['payé', 'paid'])
            .gte('created_at', since)

        const projectRevenue = new Map<string, number>()
        for (const inv of (invoices ?? [])) {
            const pid = inv.project_id ?? '__none__'
            projectRevenue.set(pid, (projectRevenue.get(pid) ?? 0) + (inv.amount ?? 0))
        }

        // Build TIME_TRACKING context block
        let timeContext = "\n\n=== SUIVI DU TEMPS (30 derniers jours) ===\n"
        const rows = Array.from(projectSeconds.entries())
            .sort((a, b) => b[1].seconds - a[1].seconds)
            .slice(0, 10)

        if (rows.length === 0) {
            timeContext += "Aucune entrée de temps enregistrée sur les 30 derniers jours.\n"
        } else {
            let totalHours = 0
            let totalRevenue = 0
            for (const [pid, { name, seconds }] of rows) {
                const hours = (seconds / 3600).toFixed(1)
                const revenue = projectRevenue.get(pid) ?? 0
                const rateStr = seconds > 0 && revenue > 0
                    ? ` | Taux horaire effectif: ${(revenue / (seconds / 3600)).toFixed(0)} €/h`
                    : ''
                const revenueStr = revenue > 0 ? ` | Facturé: ${revenue.toFixed(2)} €` : ''
                timeContext += `- ${name}: ${hours}h${revenueStr}${rateStr}\n`
                totalHours += seconds / 3600
                totalRevenue += revenue
            }
            timeContext += `Total: ${totalHours.toFixed(1)}h travaillées`
            if (totalRevenue > 0) {
                const avgRate = totalHours > 0 ? (totalRevenue / totalHours).toFixed(0) : '0'
                timeContext += ` | Revenu total: ${totalRevenue.toFixed(2)} € | Taux moyen: ${avgRate} €/h`
            }
            timeContext += "\n"
        }
        timeContext += "=========================================\n"

        // 3. Build dynamic system instruction with time context
        const baseInstruction = "Tu es l'assistant IA de Prezta, une application de facturation et devis pour les freelances français. Tu as été conçu pour les aider à rédiger des communications pro (relances, devis, emails) et pour répondre à leurs questions. Ton ton doit être professionnel, encourageant, précis et concis.\n\nPour les questions de rentabilité, compare les heures travaillées et les revenus encaissés par projet. Le taux horaire effectif = revenu facturé ÷ heures travaillées. Un projet peu rentable = beaucoup d'heures, peu de revenus."

        const systemInstruction = baseInstruction + timeContext

        // 4. Prepare Gemini Model with dynamic system instruction
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
        })

        // Format history for Gemini API (user / model)
        const formattedHistory = messages.slice(0, -1).map((msg: ChatMessage) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))

        // Gemini requires the history to start with a 'user' message.
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift()
        }

        const currentMessage = messages[messages.length - 1].content

        // Count prompt tokens
        const promptTokensReq = await model.countTokens({
            contents: [...formattedHistory, { role: 'user', parts: [{ text: currentMessage }] }],
        })
        const promptTokens = promptTokensReq.totalTokens

        const chat = model.startChat({
            history: formattedHistory,
        })

        const result = await chat.sendMessageStream(currentMessage)

        let fullResponse = ""

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text()
                        fullResponse += chunkText
                        controller.enqueue(new TextEncoder().encode(chunkText))
                    }

                    // Usage tracking
                    const completionTokensReq = await model.countTokens(fullResponse)
                    const completionTokens = completionTokensReq.totalTokens
                    const totalTokens = promptTokens + completionTokens

                    supabase.from('ai_usage_logs').insert({
                        user_id: user.id,
                        prompt_tokens: promptTokens,
                        completion_tokens: completionTokens,
                        total_tokens: totalTokens,
                        action: 'chat'
                    }).then(({ error }) => {
                        if (error) console.error('Failed to log AI usage:', error)
                    })

                    controller.close()
                } catch (e: unknown) {
                    controller.error(e)
                }
            }
        })

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/plain; charset=utf-8',
            }
        })

    } catch (error: unknown) {
        console.error('Edge Function Error:', error)
        return new Response(JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }), { status: 500, headers: corsHeaders })
    }
})
