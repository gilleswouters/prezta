import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const LE_SQUEEZY_SECRET = Deno.env.get("LEMON_SQUEEZY_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
    try {
        if (req.method !== 'POST') {
            return new Response("Method not allowed", { status: 405 });
        }

        const signature = req.headers.get("x-signature");
        if (!signature || !LE_SQUEEZY_SECRET) {
            return new Response("Missing signature or secret", { status: 401 });
        }

        const body = await req.text();

        // Verify webhook signature (HMAC SHA-256)
        const encoder = new TextEncoder();
        const keyData = encoder.encode(LE_SQUEEZY_SECRET);
        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );
        const signatureBytes = hexToBytes(signature);
        const isVerified = await crypto.subtle.verify(
            "HMAC",
            key,
            signatureBytes,
            encoder.encode(body)
        );

        if (!isVerified) {
            return new Response("Invalid signature", { status: 401 });
        }

        const payload = JSON.parse(body);
        const eventName = payload.meta.event_name;
        const data = payload.data.attributes;
        const userId = payload.meta.custom_data?.user_id;

        if (!userId) {
            console.error("No user_id found in webhook custom_data");
            return new Response("Missing user_id in custom_data", { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        console.log(`Processing event: ${eventName} for user: ${userId}`);

        if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan: 'pro',
                    status: data.status,
                    lemon_squeezy_id: payload.data.id,
                    variant_id: data.variant_id.toString(),
                    current_period_end: data.renews_at
                }, { onConflict: 'user_id' });

            if (error) {
                console.error("Upsert Error:", error);
                throw error;
            }
        } else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
            const { error } = await supabase
                .from('subscriptions')
                .update({ status: data.status }) // usually 'cancelled' or 'expired'
                .eq('user_id', userId);

            if (error) {
                console.error("Update Error:", error);
                throw error;
            }
        }

        return new Response(JSON.stringify({ status: "ok" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});

// Helper function to decode hex string to Uint8Array safely in Edge environment
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
