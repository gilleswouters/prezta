import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LSSubscriptionAttributes {
    status: string
    cancelled: boolean
}

interface LSSubscriptionResponse {
    data: {
        attributes: LSSubscriptionAttributes
    }
}

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
    try {
        const body = await req.json() as { lemon_squeezy_id?: string }
        if (!body.lemon_squeezy_id) return json({ error: 'Missing lemon_squeezy_id' }, 400)
        lemonSqueezyId = body.lemon_squeezy_id
    } catch {
        return json({ error: 'Invalid JSON body' }, 400)
    }

    // ── Call Lemon Squeezy DELETE ─────────────────────────────────────────────
    // Cancels at end of current billing period (not immediately).
    // LS fires subscription_updated with cancelled=true → existing webhook updates DB.

    const lsApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY') ?? ''
    if (!lsApiKey) return json({ error: 'Server configuration error' }, 500)

    const lsResponse = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${lemonSqueezyId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${lsApiKey}`,
                'Accept': 'application/vnd.api+json',
            },
        }
    )

    // LS returns 200 with cancelled subscription on DELETE (not 204)
    if (!lsResponse.ok) {
        const errBody = await lsResponse.text()
        console.error('[cancel-subscription] LS API error:', lsResponse.status, errBody)
        return json({ error: `LS API error ${lsResponse.status}`, detail: errBody }, 502)
    }

    // ── Verify LS confirms subscription is cancelled ───────────────────────────
    // Parse the DELETE response body to confirm cancelled === true before
    // updating the DB — prevents marking as cancelled if LS did not apply it.

    let cancelData: LSSubscriptionResponse
    try {
        cancelData = await lsResponse.json() as LSSubscriptionResponse
    } catch {
        console.error('[cancel-subscription] Failed to parse LS response body')
        return json({ error: 'La résiliation n\'a pas pu être vérifiée.' }, 502)
    }

    const confirmedCancelled = cancelData.data.attributes.cancelled
    if (!confirmedCancelled) {
        console.error('[cancel-subscription] LS did not confirm cancellation — cancelled:', confirmedCancelled)
        return json({ error: 'La résiliation n\'a pas été confirmée par Lemon Squeezy. Réessayez.' }, 502)
    }

    // ── Update DB directly ────────────────────────────────────────────────────

    const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const now = new Date().toISOString()
    const { error: dbError } = await db
        .from('subscriptions')
        .update({
            status:       'cancelled',
            cancelled_at: now,
            updated_at:   now,
        })
        .eq('user_id', user.id)

    if (dbError) {
        console.error('[cancel-subscription] DB update error:', dbError.message)
    } else {
        console.error('[cancel-subscription] DB updated to: cancelled')
    }

    console.error('[cancel-subscription] Success — user:', user.id, 'subscription:', lemonSqueezyId)
    return json({ success: true })
})
