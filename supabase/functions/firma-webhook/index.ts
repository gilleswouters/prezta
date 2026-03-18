import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── Signature validation ─────────────────────────────────────────────
        const firmaSecret = Deno.env.get('FIRMA_WEBHOOK_SECRET')
        let payload: Record<string, unknown>

        if (firmaSecret) {
            const rawBody = await req.text()
            const signature =
                req.headers.get('X-Firma-Signature') ??
                req.headers.get('X-Webhook-Signature') ??
                req.headers.get('X-Signature')

            if (!signature) {
                return new Response(
                    JSON.stringify({ error: 'Signature manquante' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
                )
            }

            const encoder = new TextEncoder()
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(firmaSecret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            )
            const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
            const expected = Array.from(new Uint8Array(mac))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')

            if (signature !== expected && signature !== `sha256=${expected}`) {
                return new Response(
                    JSON.stringify({ error: 'Signature invalide' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
                )
            }

            payload = JSON.parse(rawBody) as Record<string, unknown>
        } else {
            console.warn('FIRMA_WEBHOOK_SECRET not set — webhook signature validation disabled')
            payload = await req.json() as Record<string, unknown>
        }

        console.log("1. Webhook received. Type:", payload?.type, "— full payload keys:", Object.keys(payload));

        // Locate the Firma signing request ID in various payload shapes
        const firmaId =
            payload?.data?.signing_request?.id ||
            payload?.data?.id ||
            payload?.id ||
            payload?.request_id;

        if (!firmaId) {
            console.log("Warning: No Firma ID found in the payload, ignoring.");
            return new Response(
                JSON.stringify({ success: true, message: 'No ID found, ignored' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        console.log("2. Found Firma ID:", firmaId);

        // Classify the event type
        const eventType = payload?.type as string | undefined;

        const isViewed =
            eventType === 'signing_request.recipient.viewed' ||
            eventType === 'recipient.viewed' ||
            eventType === 'signing_request.viewed';

        const isCompleted =
            eventType === 'signing_request.certificate.generated' ||
            eventType === 'signing_request.completed' ||
            eventType === 'signing_request.finished';

        if (!isViewed && !isCompleted) {
            console.log("3. Unhandled event type, ignoring:", eventType);
            return new Response(
                JSON.stringify({ success: true, message: `Event ${eventType} not handled, ignored` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const newStatus = isViewed ? 'lu' : 'signed';
        console.log("3. Event type:", eventType, "→ new status:", newStatus);

        // Setup Supabase client with service role to bypass RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase environment variables missing');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch current status_history to append to it
        const { data: existing, error: fetchError } = await supabase
            .from('project_contracts')
            .select('id, status_history')
            .eq('signature_id', firmaId)
            .maybeSingle();

        if (fetchError) {
            console.error("Supabase fetch error:", fetchError);
            throw fetchError;
        }

        if (!existing) {
            // ── Fallback: check quotes table ──────────────────────────────
            console.log("4. No contract found, checking quotes table for Firma ID:", firmaId);

            const { data: existingQuote, error: quoteFetchError } = await supabase
                .from('quotes')
                .select('id, status_history')
                .eq('signature_id', firmaId)
                .maybeSingle();

            if (quoteFetchError) {
                console.error("Supabase fetch error (quotes):", quoteFetchError);
                throw quoteFetchError;
            }

            if (!existingQuote) {
                console.log("4. Warning: No document found (contract or quote) matching Firma ID:", firmaId);
                return new Response(
                    JSON.stringify({ success: true, message: 'No matching document found' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                );
            }

            console.log("4. Found quote:", existingQuote.id, "— appending status:", newStatus);

            const quoteNow = new Date().toISOString();
            const quoteHistory: Array<{ status: string; at: string }> =
                Array.isArray(existingQuote.status_history) ? existingQuote.status_history : [];
            const quoteUpdatedHistory = [...quoteHistory, { status: newStatus, at: quoteNow }];

            const { data: updatedQuote, error: quoteUpdateError } = await supabase
                .from('quotes')
                .update({ status: newStatus, status_history: quoteUpdatedHistory })
                .eq('id', existingQuote.id)
                .select('id, status');

            if (quoteUpdateError) {
                console.error("Supabase update error (quotes):", quoteUpdateError);
                throw quoteUpdateError;
            }

            console.log("5. SUCCESS — quote updated:", updatedQuote?.[0]?.id, "status →", newStatus);

            return new Response(
                JSON.stringify({ success: true, updated: updatedQuote?.length ?? 0, newStatus }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        console.log("4. Found contract:", existing.id, "— appending status:", newStatus);

        const now = new Date().toISOString();
        const currentHistory: Array<{ status: string; at: string }> =
            Array.isArray(existing.status_history) ? existing.status_history : [];
        const updatedHistory = [...currentHistory, { status: newStatus, at: now }];

        const updates: Record<string, unknown> = {
            status: newStatus,
            status_history: updatedHistory,
        };

        if (isCompleted) {
            updates.signed_at = now;
        }

        const { data: updated, error: updateError } = await supabase
            .from('project_contracts')
            .update(updates)
            .eq('id', existing.id)
            .select('id, status');

        if (updateError) {
            console.error("Supabase update error:", updateError);
            throw updateError;
        }

        console.log("5. SUCCESS — contract updated:", updated?.[0]?.id, "status →", newStatus);

        return new Response(
            JSON.stringify({ success: true, updated: updated?.length ?? 0, newStatus }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Webhook fatal error:", message);
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
