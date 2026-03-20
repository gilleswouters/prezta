import type { VercelRequest, VercelResponse } from '@vercel/node';
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

async function getRawBody(req: VercelRequest): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

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

    console.error('[LS webhook] Step 3: resolving Supabase config');
    const supabaseUrl    = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('[LS webhook] Missing Supabase env vars — supabaseUrl present:', !!supabaseUrl, 'serviceRoleKey present:', !!serviceRoleKey);
        return;
    }

    console.error('[LS webhook] Step 3: supabaseUrl prefix:', supabaseUrl.substring(0, 30));
    console.error('[LS webhook] Step 3: serviceRoleKey prefix:', serviceRoleKey.substring(0, 10));

    // supabase-js v2+ accepts the new sb_secret_ key format as the service role key.
    // autoRefreshToken + persistSession must be false for server-side usage.
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession:   false,
        },
        global: {
            headers: { 'x-client-info': 'prezta-webhook' },
        },
    });

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

        console.error('[LS webhook] Step 4: about to call supabase.from(subscriptions).upsert');

        const { error } = await supabase.from('subscriptions').upsert({
            user_id:            userId,
            plan,
            status,
            lemon_squeezy_id:   payload.data.id,
            current_period_end: attrs.renews_at,
            updated_at:         new Date().toISOString(),
        }, { onConflict: 'user_id' });

        console.error('[LS webhook] Step 5: upsert returned, error:', error?.message ?? 'none');
        if (error) throw error;

    // ── subscription_cancelled ────────────────────────────────────────────────

    } else if (eventName === 'subscription_cancelled') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for subscription_cancelled');
            return;
        }

        console.error('[LS webhook] Step 4: starting update — subscription_cancelled');

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status:             'cancelled',
                current_period_end: attrs.ends_at ?? attrs.renews_at,
            })
            .eq('user_id', userId);

        if (error) {
            console.error('[LS webhook] update error:', error.message, error.code);
            throw error;
        }
        console.error('[LS webhook] Step 5: upsert complete — subscription_cancelled user:', userId);

    // ── order_created (one-time — à la carte signatures) ─────────────────────

    } else if (eventName === 'order_created') {
        if (!userId) {
            console.error('[LS webhook] Missing user_id for order_created');
            return;
        }

        console.error('[LS webhook] Step 4: starting fetch — order_created');

        const { data: row, error: fetchErr } = await supabase
            .from('subscriptions')
            .select('firma_signatures_used')
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchErr) {
            console.error('[LS webhook] fetch error:', fetchErr.message, fetchErr.code);
            throw fetchErr;
        }

        const current = (row as { firma_signatures_used: number | null } | null)
            ?.firma_signatures_used ?? 0;

        const { error: updateErr } = await supabase
            .from('subscriptions')
            .update({ firma_signatures_used: current + 1 })
            .eq('user_id', userId);

        if (updateErr) {
            console.error('[LS webhook] update error:', updateErr.message, updateErr.code);
            throw updateErr;
        }
        console.error('[LS webhook] Step 5: upsert complete — order_created firma_signatures_used →', current + 1, 'user:', userId);

    } else {
        console.error('[LS webhook] Unhandled event:', eventName);
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const secret  = getEnv('LEMON_SQUEEZY_WEBHOOK_SECRET');
    const rawBody = await getRawBody(req);
    const sig     = req.headers['x-signature'] as string ?? '';

    if (!secret) {
        console.error('[LS webhook] Missing LEMON_SQUEEZY_WEBHOOK_SECRET env var');
        res.status(200).send('OK');
        return;
    }

    const expected = await computeHmac(secret, rawBody);
    if (expected !== sig) {
        console.error('[LS webhook] Invalid signature — returning 200 silently');
        res.status(200).send('OK');
        return;
    }

    // Validate JSON before firing async work
    try {
        JSON.parse(rawBody);
    } catch {
        console.error('[LS webhook] Malformed JSON body');
        res.status(200).send('OK');
        return;
    }

    // Return 200 to LS immediately so it does not retry on slow DB operations
    res.status(200).send('OK');

    // Process async after response — guard with 30s log timeout (Vercel Node allows up to 60s)
    const processingTimeout = setTimeout(() => {
        console.error('[LS webhook] Processing timeout after 30s');
    }, 30_000);

    processWebhook(rawBody)
        .then(() => clearTimeout(processingTimeout))
        .catch(err => {
            clearTimeout(processingTimeout);
            console.error('[LS webhook] Processing error:', err instanceof Error ? err.message : String(err));
        });
}
