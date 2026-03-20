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
        auth: {
            autoRefreshToken: false,
            persistSession:   false,
        },
    })

    // ── subscription_created / subscription_updated ───────────────────────────

    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for', eventName, '— full payload:', JSON.stringify(payload))
            return
        }

        // Log raw LS identifiers to diagnose plan mapping issues
        const variantId = String(attrs.variant_id ?? '')
        console.error('[LS webhook] variant_id:', variantId)
        console.error('[LS webhook] variant_name:', attrs.variant_name)
        console.error('[LS webhook] product_name:', attrs.product_name)

        // Primary: match by variant_id against Supabase secrets (reliable, not locale-dependent)
        // Fallback: string match on product_name / variant_name
        // Default: 'starter' — safer than defaulting to 'pro' on unknown variants
        const starterVariantId = Deno.env.get('LS_STARTER_MONTHLY_VARIANT_ID') ?? ''
        const proVariantId     = Deno.env.get('LS_PRO_MONTHLY_VARIANT_ID') ?? ''
        const productLower     = (attrs.product_name ?? '').toLowerCase()
        const variantLower     = (attrs.variant_name ?? '').toLowerCase()

        const plan =
            (starterVariantId && variantId === starterVariantId) ? 'starter' :
            (proVariantId     && variantId === proVariantId)     ? 'pro'     :
            productLower.includes('starter') || variantLower.includes('starter') ? 'starter' :
            productLower.includes('pro')     || variantLower.includes('pro')     ? 'pro'     :
            'starter' // default to starter — less harmful than wrongly granting pro

        // On creation force 'active' — Prezta manages its own trial, LS trial periods unused
        const status = eventName === 'subscription_created' ? 'active' : attrs.status

        console.error('[LS webhook] Step 4: about to call supabase.from(subscriptions).upsert — plan:', plan, 'status:', status)

        const { error } = await supabase.from('subscriptions').upsert({
            user_id:            userId,
            plan,
            status,
            lemon_squeezy_id:   payload.data.id,
            current_period_end: attrs.renews_at,
            updated_at:         new Date().toISOString(),
        }, { onConflict: 'user_id' })

        console.error('[LS webhook] Step 5: upsert returned, error:', error?.message ?? 'none')
        if (error) throw error

    // ── subscription_cancelled ────────────────────────────────────────────────

    } else if (eventName === 'subscription_cancelled') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_cancelled')
            return
        }

        console.error('[LS webhook] Step 4: starting update — subscription_cancelled')

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status:             'cancelled',
                current_period_end: attrs.ends_at ?? attrs.renews_at,
            })
            .eq('user_id', userId)

        if (error) {
            console.error('[LS webhook] update error:', error.message, error.code)
            throw error
        }
        console.error('[LS webhook] Step 5: complete — subscription_cancelled user:', userId)

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
            .update({ firma_signatures_used: current + 1 })
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
