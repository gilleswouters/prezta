import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LSSubscriptionResponse {
    data: {
        attributes: {
            urls: {
                customer_portal: string | null
            }
        }
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    // ── JWT auth ───────────────────────────────────────────────────────────────

    const authHeader = req.headers.get('Authorization') ?? req.headers.get('apikey') ?? ''
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // ── Parse body ─────────────────────────────────────────────────────────────

    let lemonSqueezyId: string
    try {
        const body = await req.json() as { lemon_squeezy_id?: string }
        if (!body.lemon_squeezy_id) {
            return new Response(JSON.stringify({ error: 'Missing lemon_squeezy_id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }
        lemonSqueezyId = body.lemon_squeezy_id
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // ── Fetch portal URL from Lemon Squeezy ────────────────────────────────────

    const lsApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY') ?? ''
    if (!lsApiKey) {
        console.error('[get-portal-url] LEMON_SQUEEZY_API_KEY not set')
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const lsResponse = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${lemonSqueezyId}`,
        {
            headers: {
                'Authorization': `Bearer ${lsApiKey}`,
                'Accept': 'application/vnd.api+json',
            },
        }
    )

    if (!lsResponse.ok) {
        console.error('[get-portal-url] LS API error:', lsResponse.status, await lsResponse.text())
        return new Response(JSON.stringify({ error: 'LS API error', status: lsResponse.status }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const lsData = await lsResponse.json() as LSSubscriptionResponse
    const portalUrl = lsData?.data?.attributes?.urls?.customer_portal

    if (!portalUrl) {
        console.error('[get-portal-url] No customer_portal URL in LS response')
        return new Response(JSON.stringify({ error: 'No portal URL returned by Lemon Squeezy' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify({ url: portalUrl }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    })
})
