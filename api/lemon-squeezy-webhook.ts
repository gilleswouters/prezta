import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

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

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? '';
    const body   = await req.text();
    const sig    = req.headers.get('x-signature') ?? '';

    // Always 200 on config errors or bad sig — prevents LS retry loops and info leakage
    if (!secret) {
        console.error('[LS Webhook] Missing LEMON_SQUEEZY_WEBHOOK_SECRET env var');
        return new Response('OK', { status: 200 });
    }

    const expected = await computeHmac(secret, body);
    if (expected !== sig) {
        console.warn('[LS Webhook] Invalid signature — returning 200 silently');
        return new Response('OK', { status: 200 });
    }

    // ── Parse payload ─────────────────────────────────────────────────────────

    let payload: LSPayload;
    try {
        payload = JSON.parse(body) as LSPayload;
    } catch {
        console.error('[LS Webhook] Malformed JSON body');
        return new Response('OK', { status: 200 });
    }

    const eventName  = payload.meta.event_name;
    const userId     = payload.meta.custom_data?.user_id;
    const attrs      = payload.data.attributes;

    // ── Supabase client (service role — full access) ──────────────────────────

    const supabaseUrl      = process.env.VITE_SUPABASE_URL ?? '';
    const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('[LS Webhook] Missing Supabase env vars');
        return new Response('OK', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {

        // ── subscription_created / subscription_updated ───────────────────────

        if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
            if (!userId) {
                // Log full payload so missing user_id can be diagnosed in Vercel logs
                console.error('[LS Webhook] Missing user_id in meta.custom_data for', eventName,
                    '— full payload:', JSON.stringify(payload));
                return new Response('OK', { status: 200 });
            }

            // Determine plan from variant_name, fallback to product_name
            const nameToCheck = (
                (attrs.variant_name ?? '') || (attrs.product_name ?? '')
            ).toLowerCase();
            const plan: 'starter' | 'pro' = nameToCheck.includes('starter') ? 'starter' : 'pro';

            // On creation we force 'active' — Prezta manages its own trial period and
            // does not configure LS trial periods, so the LS status is always 'active'
            // for a newly paid subscription. On update, use the real LS status.
            const status = eventName === 'subscription_created' ? 'active' : attrs.status;

            const { error } = await supabase.from('subscriptions').upsert({
                user_id:             userId,
                plan,
                status,
                lemon_squeezy_id:    payload.data.id,
                current_period_end:  attrs.renews_at,
                updated_at:          new Date().toISOString(),
            }, { onConflict: 'user_id' });

            if (error) throw error;
            console.log(`[LS Webhook] ${eventName} — user ${userId} → plan=${plan} status=${status}`);

        // ── subscription_cancelled ────────────────────────────────────────────

        } else if (eventName === 'subscription_cancelled') {
            if (!userId) {
                console.error('[LS Webhook] Missing user_id for subscription_cancelled');
                return new Response('OK', { status: 200 });
            }

            const { error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    // ends_at = last day of access; renews_at is null when cancelled
                    current_period_end: attrs.ends_at ?? attrs.renews_at,
                })
                .eq('user_id', userId);

            if (error) throw error;
            console.log(`[LS Webhook] subscription_cancelled — user ${userId}`);

        // ── order_created (one-time — à la carte signatures) ─────────────────

        } else if (eventName === 'order_created') {
            if (!userId) {
                console.error('[LS Webhook] Missing user_id for order_created');
                return new Response('OK', { status: 200 });
            }

            const { data: row, error: fetchErr } = await supabase
                .from('subscriptions')
                .select('firma_signatures_used')
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            const current = (row as { firma_signatures_used: number | null } | null)
                ?.firma_signatures_used ?? 0;

            const { error: updateErr } = await supabase
                .from('subscriptions')
                .update({ firma_signatures_used: current + 1 })
                .eq('user_id', userId);

            if (updateErr) throw updateErr;
            console.log(`[LS Webhook] order_created — firma_signatures_used → ${current + 1} for user ${userId}`);

        } else {
            console.log(`[LS Webhook] Unhandled event: ${eventName}`);
        }

        return new Response(JSON.stringify({ ok: true, event: eventName }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[LS Webhook] Processing error:', message);
        // Always return 200 — LS would retry on 5xx which we don't want
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
