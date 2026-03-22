import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
}

function resolveVariantId(targetPlan: string, billingCycle: string): string | null {
    if (targetPlan === 'pro') {
        return billingCycle === 'annual'
            ? (Deno.env.get('LS_PRO_ANNUAL_VARIANT_ID') ?? null)
            : (Deno.env.get('LS_PRO_MONTHLY_VARIANT_ID') ?? null)
    }
    if (targetPlan === 'starter') {
        return billingCycle === 'annual'
            ? (Deno.env.get('LS_STARTER_ANNUAL_VARIANT_ID') ?? null)
            : (Deno.env.get('LS_STARTER_MONTHLY_VARIANT_ID') ?? null)
    }
    return null
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    // ── JWT auth ───────────────────────────────────────────────────────────────

    const authHeader = req.headers.get('Authorization') ?? req.headers.get('apikey') ?? ''
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // ── Parse body ─────────────────────────────────────────────────────────────

    let lemonSqueezyId: string
    let targetPlan: string
    let billingCycle: string
    try {
        const body = await req.json() as { lemon_squeezy_id?: string; target_plan?: string; billing_cycle?: string }
        if (!body.lemon_squeezy_id || !body.target_plan) return json({ error: 'Missing lemon_squeezy_id or target_plan' }, 400)
        lemonSqueezyId = body.lemon_squeezy_id
        targetPlan     = body.target_plan
        billingCycle   = body.billing_cycle ?? 'monthly'
    } catch {
        return json({ error: 'Invalid JSON body' }, 400)
    }

    // ── Resolve variant ID server-side ────────────────────────────────────────

    const variantId = resolveVariantId(targetPlan, billingCycle)
    if (!variantId) {
        console.error('[upgrade-subscription] No variant ID configured for:', targetPlan, billingCycle)
        return json({ error: `No variant configured for plan=${targetPlan} cycle=${billingCycle}` }, 500)
    }

    // ── Call Lemon Squeezy PATCH ───────────────────────────────────────────────

    const lsApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY') ?? ''
    if (!lsApiKey) return json({ error: 'Server configuration error' }, 500)

    const lsResponse = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${lemonSqueezyId}`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${lsApiKey}`,
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
            },
            body: JSON.stringify({
                data: {
                    type: 'subscriptions',
                    id: String(lemonSqueezyId),
                    attributes: { variant_id: Number(variantId) },
                },
            }),
        }
    )

    if (!lsResponse.ok) {
        const errBody = await lsResponse.text()
        console.error('[upgrade-subscription] LS API error:', lsResponse.status, errBody)
        return json({ error: `LS API error ${lsResponse.status}`, detail: errBody }, 502)
    }

    // ── Update DB directly (webhook not fired for API-initiated plan changes) ──

    const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const now = new Date().toISOString()
    const { error: dbError } = await db
        .from('subscriptions')
        .update({
            plan:       targetPlan,
            variant_id: String(variantId),
            updated_at: now,
        })
        .eq('user_id', user.id)

    if (dbError) {
        console.error('[upgrade-subscription] DB update error:', dbError.message)
    } else {
        console.error('[upgrade-subscription] DB updated to:', targetPlan)
    }

    return json({ success: true, plan: targetPlan })
})
