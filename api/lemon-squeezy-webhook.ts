import { createClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LSAttributes {
    status: string;
    renews_at: string | null;
    ends_at: string | null;
    variant_name?: string;
    product_name?: string;
}

interface LSPayload {
    meta: {
        event_name: string;
        custom_data?: Record<string, string>;
    };
    data: {
        id: string;
        attributes: LSAttributes;
    };
}

// ─── Env accessor ─────────────────────────────────────────────────────────────

const getEnv = (key: string) => process.env[key] ?? '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function computeHmac(secret: string, body: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const buf = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Supabase timeout after ${ms}ms: ${label}`)), ms)
    );
    return Promise.race([promise, timeout]);
}

// ─── Async processor (runs after 200 is returned to LS) ───────────────────────

async function processWebhook(body: string): Promise<void> {
    console.error('[LS webhook] Step 1: parsing payload');
    const payload = JSON.parse(body) as LSPayload;

    const eventName = payload.meta.event_name;
    // LS puts custom_data in meta.custom_data; some events nest it under attributes
    const userId = payload.meta.custom_data?.user_id
        ?? (payload.data.attributes as unknown as Record<string, unknown> & { custom_data?: Record<string, string> })
            .custom_data?.user_id;
    const attrs = payload.data.attributes;

    console.error('[LS webhook] Step 2: extracted userId:', userId, 'event:', eventName);

    console.error('[LS webhook] Step 3: creating Supabase client');
    const supabaseUrl    = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('[LS webhook] Missing Supabase env vars — supabaseUrl present:', !!supabaseUrl, 'serviceRoleKey present:', !!serviceRoleKey);
        return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── subscription_created / subscription_updated ───────────────────────────

    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for', eventName, '— full payload:', JSON.stringify(payload));
            return;
        }

        const nameToCheck = (
            (attrs.variant_name ?? '') || (attrs.product_name ?? '')
        ).toLowerCase();
        const plan: 'starter' | 'pro' = nameToCheck.includes('starter') ? 'starter' : 'pro';
        const status = eventName === 'subscription_created' ? 'active' : attrs.status;

        console.error('[LS webhook] Step 4: starting upsert — plan:', plan, 'status:', status);

        const { error } = await withTimeout(
            supabase.from('subscriptions').upsert({
                user_id:            userId,
                plan,
                status,
                lemon_squeezy_id:   payload.data.id,
                current_period_end: attrs.renews_at,
                updated_at:         new Date().toISOString(),
            }, { onConflict: 'user_id' }),
            10_000,
            'subscription upsert'
        );

        if (error) throw error;
        console.error('[LS webhook] Step 5: upsert complete —', eventName, 'user:', userId, 'plan:', plan, 'status:', status);

    // ── subscription_cancelled ────────────────────────────────────────────────

    } else if (eventName === 'subscription_cancelled') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_cancelled');
            return;
        }

        console.error('[LS webhook] Step 4: starting update — subscription_cancelled');

        const { error } = await withTimeout(
            supabase
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    current_period_end: attrs.ends_at ?? attrs.renews_at,
                })
                .eq('user_id', userId),
            10_000,
            'subscription_cancelled update'
        );

        if (error) throw error;
        console.error('[LS webhook] Step 5: upsert complete — subscription_cancelled user:', userId);

    // ── order_created (one-time — à la carte signatures) ─────────────────────

    } else if (eventName === 'order_created') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for order_created');
            return;
        }

        console.error('[LS webhook] Step 4: starting fetch — order_created');

        const { data: row, error: fetchErr } = await withTimeout(
            supabase
                .from('subscriptions')
                .select('firma_signatures_used')
                .eq('user_id', userId)
                .maybeSingle(),
            10_000,
            'order_created fetch'
        );

        if (fetchErr) throw fetchErr;

        const current = (row as { firma_signatures_used: number | null } | null)
            ?.firma_signatures_used ?? 0;

        const { error: updateErr } = await withTimeout(
            supabase
                .from('subscriptions')
                .update({ firma_signatures_used: current + 1 })
                .eq('user_id', userId),
            10_000,
            'order_created update'
        );

        if (updateErr) throw updateErr;
        console.error('[LS webhook] Step 5: upsert complete — order_created firma_signatures_used →', current + 1, 'user:', userId);

    } else {
        console.error('[LS webhook] Unhandled event:', eventName);
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const secret = getEnv('LEMON_SQUEEZY_WEBHOOK_SECRET');
    const body   = await req.text();
    const sig    = req.headers.get('x-signature') ?? '';

    if (!secret) {
        console.error('[LS webhook] Missing LEMON_SQUEEZY_WEBHOOK_SECRET env var');
        return new Response('OK', { status: 200 });
    }

    const expected = await computeHmac(secret, body);
    if (expected !== sig) {
        console.error('[LS webhook] Invalid signature — returning 200 silently');
        return new Response('OK', { status: 200 });
    }

    // Validate JSON before firing async work
    try {
        JSON.parse(body);
    } catch {
        console.error('[LS webhook] Malformed JSON body');
        return new Response('OK', { status: 200 });
    }

    // Return 200 to LS immediately so it does not retry on slow DB operations
    const response = new Response('OK', { status: 200 });

    // Process async without blocking the response
    processWebhook(body).catch(err =>
        console.error('[LS webhook] async processing error:', err instanceof Error ? err.message : String(err))
    );

    return response;
}
