import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LSAttributes {
    status: string
    renews_at: string | null
    ends_at: string | null
    variant_id?: number | string
    variant_name?: string
    product_name?: string
    custom_data?: Record<string, string>
    trial_ends_at?: string | null
    cancelled?: boolean
    pause?: { resumes_at?: string | null }
}

interface LSPayload {
    meta: {
        event_name: string
        custom_data?: Record<string, string>
    }
    data: {
        id: string
        attributes: LSAttributes
    }
}

// ─── Plan / billing helpers ───────────────────────────────────────────────────

function getPlanFromVariant(variantId: string, productName: string, variantName: string): string {
    const starterMonthly = Deno.env.get('LS_STARTER_MONTHLY_VARIANT_ID') ?? ''
    const starterAnnual  = Deno.env.get('LS_STARTER_ANNUAL_VARIANT_ID')  ?? ''
    const proMonthly     = Deno.env.get('LS_PRO_MONTHLY_VARIANT_ID')     ?? ''
    const proAnnual      = Deno.env.get('LS_PRO_ANNUAL_VARIANT_ID')      ?? ''

    if (variantId && (variantId === starterMonthly || variantId === starterAnnual)) return 'starter'
    if (variantId && (variantId === proMonthly     || variantId === proAnnual))     return 'pro'

    const name = `${productName} ${variantName}`.toLowerCase()
    if (name.includes('starter')) return 'starter'
    if (name.includes('pro'))     return 'pro'
    return 'starter' // safe default — less harmful than wrongly granting pro
}

function getBillingCycle(variantId: string): string {
    const annualIds = [
        Deno.env.get('LS_STARTER_ANNUAL_VARIANT_ID') ?? '',
        Deno.env.get('LS_PRO_ANNUAL_VARIANT_ID')     ?? '',
    ]
    return (variantId && annualIds.includes(variantId)) ? 'annual' : 'monthly'
}

// ─── HMAC validation ──────────────────────────────────────────────────────────

async function verifySignature(secret: string, rawBody: string, signature: string): Promise<boolean> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const expected = Array.from(new Uint8Array(mac))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    // Accept both plain hex and sha256=hex (LS sends plain hex)
    return signature === expected || signature === `sha256=${expected}`
}

// ─── Async processor ──────────────────────────────────────────────────────────

async function processWebhook(payload: LSPayload): Promise<void> {
    const eventName = payload.meta.event_name
    // LS puts user_id in meta.custom_data; some event shapes nest it under attributes
    const userId = payload.meta.custom_data?.user_id
        ?? payload.data.attributes.custom_data?.user_id
    const attrs = payload.data.attributes

    console.error('[LS webhook] Step 2: extracted userId:', userId, 'event:', eventName)

    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.error('[LS webhook] Step 3: supabaseUrl prefix:', supabaseUrl.substring(0, 30))
    console.error('[LS webhook] Step 3: serviceRoleKey prefix:', serviceRoleKey.substring(0, 10))

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    const now = new Date().toISOString()

    // ── subscription_created ──────────────────────────────────────────────────

    if (eventName === 'subscription_created') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_created — payload:', JSON.stringify(payload))
            return
        }
        const variantId    = String(attrs.variant_id ?? '')
        const plan         = getPlanFromVariant(variantId, attrs.product_name ?? '', attrs.variant_name ?? '')
        const billingCycle = getBillingCycle(variantId)

        console.error('[LS webhook] variant_id:', variantId, 'variant_name:', attrs.variant_name, 'product_name:', attrs.product_name)
        console.error('[LS webhook] Step 4: upsert subscription_created — plan:', plan, 'billing_cycle:', billingCycle)

        const { error } = await supabase.from('subscriptions').upsert({
            user_id:            userId,
            plan,
            status:             'active',
            billing_cycle:      billingCycle,
            lemon_squeezy_id:   payload.data.id,
            variant_id:         variantId,
            current_period_end: attrs.renews_at,
            trial_ends_at:      attrs.trial_ends_at ?? null,
            updated_at:         now,
        }, { onConflict: 'user_id' })

        console.error('[LS webhook] Step 5: upsert returned, error:', error?.message ?? 'none')
        if (error) throw error

    // ── subscription_updated ──────────────────────────────────────────────────

    } else if (eventName === 'subscription_updated') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_updated — payload:', JSON.stringify(payload))
            return
        }
        const variantId    = String(attrs.variant_id ?? '')
        const plan         = getPlanFromVariant(variantId, attrs.product_name ?? '', attrs.variant_name ?? '')
        const billingCycle = getBillingCycle(variantId)

        console.error('[LS webhook] variant_id:', variantId, 'variant_name:', attrs.variant_name, 'product_name:', attrs.product_name)

        // Map LS status + cancelled flag to Prezta status
        let status = attrs.status
        let cancelledAt: string | null = null
        let pauseResumesAt: string | null = null

        if (attrs.cancelled === true && attrs.status === 'active') {
            // Cancelled but billing period still active — keep access until period end
            status     = 'cancelled'
            cancelledAt = now
        } else if (attrs.status === 'cancelled') {
            status      = 'cancelled'
            cancelledAt = attrs.ends_at ?? now
        } else if (attrs.status === 'paused') {
            status         = 'paused'
            pauseResumesAt = attrs.pause?.resumes_at ?? null
        }

        console.error('[LS webhook] Step 4: upsert subscription_updated — plan:', plan, 'status:', status)

        const { error } = await supabase.from('subscriptions').upsert({
            user_id:            userId,
            plan,
            status,
            billing_cycle:      billingCycle,
            lemon_squeezy_id:   payload.data.id,
            variant_id:         variantId,
            current_period_end: attrs.renews_at,
            cancelled_at:       cancelledAt,
            pause_resumes_at:   pauseResumesAt,
            updated_at:         now,
        }, { onConflict: 'user_id' })

        console.error('[LS webhook] Step 5: upsert returned, error:', error?.message ?? 'none')
        if (error) throw error

    // ── subscription_cancelled ────────────────────────────────────────────────

    } else if (eventName === 'subscription_cancelled') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_cancelled')
            return
        }
        console.error('[LS webhook] Step 4: update subscription_cancelled — user:', userId)

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status:             'cancelled',
                cancelled_at:       now,
                // Keep access until end of billing period — do NOT change plan
                current_period_end: attrs.ends_at ?? attrs.renews_at,
                updated_at:         now,
            })
            .eq('user_id', userId)

        if (error) { console.error('[LS webhook] update error:', error.message); throw error }
        console.error('[LS webhook] Step 5: complete — subscription_cancelled user:', userId)

    // ── subscription_expired ──────────────────────────────────────────────────

    } else if (eventName === 'subscription_expired') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_expired')
            return
        }
        console.error('[LS webhook] Step 4: update subscription_expired — user:', userId)

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status:             'expired',
                plan:               'free',
                current_period_end: now,
                updated_at:         now,
            })
            .eq('user_id', userId)

        if (error) { console.error('[LS webhook] update error:', error.message); throw error }
        console.error('[LS webhook] Step 5: complete — subscription_expired user:', userId)

    // ── subscription_paused ───────────────────────────────────────────────────

    } else if (eventName === 'subscription_paused') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_paused')
            return
        }
        const pauseResumesAt = attrs.pause?.resumes_at ?? null
        console.error('[LS webhook] Step 4: update subscription_paused — user:', userId, 'resumes_at:', pauseResumesAt)

        const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'paused', pause_resumes_at: pauseResumesAt, updated_at: now })
            .eq('user_id', userId)

        if (error) { console.error('[LS webhook] update error:', error.message); throw error }
        console.error('[LS webhook] Step 5: complete — subscription_paused user:', userId)

    // ── subscription_unpaused / subscription_resumed ──────────────────────────

    } else if (eventName === 'subscription_unpaused' || eventName === 'subscription_resumed') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for', eventName)
            return
        }
        console.error('[LS webhook] Step 4: update', eventName, '— user:', userId)

        const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'active', pause_resumes_at: null, updated_at: now })
            .eq('user_id', userId)

        if (error) { console.error('[LS webhook] update error:', error.message); throw error }
        console.error('[LS webhook] Step 5: complete —', eventName, 'user:', userId)

    // ── subscription_payment_failed ───────────────────────────────────────────

    } else if (eventName === 'subscription_payment_failed') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_payment_failed')
            return
        }
        console.error('[LS webhook] Payment failed for user:', userId)

        const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: now })
            .eq('user_id', userId)

        if (error) { console.error('[LS webhook] update error:', error.message); throw error }
        console.error('[LS webhook] Step 5: complete — subscription_payment_failed user:', userId)

    // ── subscription_payment_recovered ────────────────────────────────────────

    } else if (eventName === 'subscription_payment_recovered') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_payment_recovered')
            return
        }
        console.error('[LS webhook] Step 4: update subscription_payment_recovered — user:', userId)

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status:             'active',
                current_period_end: attrs.renews_at,
                updated_at:         now,
            })
            .eq('user_id', userId)

        if (error) { console.error('[LS webhook] update error:', error.message); throw error }
        console.error('[LS webhook] Step 5: complete — subscription_payment_recovered user:', userId)

    // ── order_created (one-time — à la carte signatures) ─────────────────────

    } else if (eventName === 'order_created') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for order_created')
            return
        }
        console.error('[LS webhook] Step 4: starting fetch — order_created')

        const { data: row, error: fetchErr } = await supabase
            .from('subscriptions')
            .select('firma_signatures_used')
            .eq('user_id', userId)
            .maybeSingle()

        if (fetchErr) {
            console.error('[LS webhook] fetch error:', fetchErr.message, fetchErr.code)
            throw fetchErr
        }

        const current = (row as { firma_signatures_used: number | null } | null)
            ?.firma_signatures_used ?? 0

        const { error: updateErr } = await supabase
            .from('subscriptions')
            .update({ firma_signatures_used: current + 1, updated_at: now })
            .eq('user_id', userId)

        if (updateErr) {
            console.error('[LS webhook] update error:', updateErr.message, updateErr.code)
            throw updateErr
        }
        console.error('[LS webhook] Step 5: complete — order_created firma_signatures_used →', current + 1, 'user:', userId)

    } else {
        console.error('[LS webhook] Unhandled event:', eventName)
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    const rawBody = await req.text()
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET') ?? ''

    // HMAC signature validation
    if (webhookSecret) {
        const signature = req.headers.get('x-signature') ?? ''
        const valid = await verifySignature(webhookSecret, rawBody, signature)
        if (!valid) {
            console.error('[LS webhook] Signature mismatch — returning 200 silently to prevent retries')
            return new Response('OK', { status: 200 })
        }
    } else {
        console.error('[LS webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not set — validation disabled')
    }

    let payload: LSPayload
    try {
        payload = JSON.parse(rawBody) as LSPayload
    } catch {
        console.error('[LS webhook] Malformed JSON body')
        return new Response('OK', { status: 200 })
    }

    console.error('[LS webhook] Step 1: received event:', payload.meta.event_name)

    // Return 200 to LS immediately then process DB write asynchronously
    const processing = processWebhook(payload).catch(err =>
        console.error('[LS webhook] async processing error:', err instanceof Error ? err.message : String(err))
    )

    // EdgeRuntime.waitUntil keeps the function alive until processing completes
    // deno-lint-ignore no-explicit-any
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
        // deno-lint-ignore no-explicit-any
        ;(globalThis as any).EdgeRuntime.waitUntil(processing)
    }

    return new Response('OK', { status: 200 })
})
