import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const LE_SQUEEZY_SECRET = Deno.env.get("LEMON_SQUEEZY_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
        const userEmail = data.user_email;
        const userName = data.user_name || "Freelancer";

        if (!userEmail) {
            console.error("No user_email found in webhook data");
            return new Response("Missing user_email in data", { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        console.log(`Processing event: ${eventName} for email: ${userEmail}`);

        if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
            // 1. Resolve User ID (Find or Create)
            let userId = null;
            let isNewUser = false;
            let magicLink = null;

            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', userEmail)
                .single();

            if (existingProfile) {
                userId = existingProfile.id;
            } else {
                console.log(`Creating new user for: ${userEmail}`);
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email: userEmail,
                    email_confirm: true,
                    user_metadata: { full_name: userName }
                });

                if (createError) throw createError;
                userId = newUser.user.id;
                isNewUser = true;

                // Generate Magic Link
                const { data: linkData } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: userEmail
                });

                magicLink = linkData?.properties?.action_link;
            }

            // 2. Update the Subscription Table
            const { data: existingSub } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('user_id', userId)
                .single();

            let subError;
            if (existingSub) {
                const { error } = await supabase.from('subscriptions').update({
                    plan: 'pro',
                    status: data.status,
                    lemon_squeezy_id: payload.data.id,
                    variant_id: data.variant_id.toString(),
                    current_period_end: data.renews_at
                }).eq('user_id', userId);
                subError = error;
            } else {
                const { error } = await supabase.from('subscriptions').insert({
                    user_id: userId,
                    plan: 'pro',
                    status: data.status,
                    lemon_squeezy_id: payload.data.id,
                    variant_id: data.variant_id.toString(),
                    current_period_end: data.renews_at
                });
                subError = error;
            }

            if (subError) throw subError;

            // 3. Send Welcome Email via Resend if New User
            if (isNewUser && magicLink && RESEND_API_KEY) {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Prezta <hello@prezta.eu>',
                        to: userEmail,
                        subject: 'Bienvenue sur Prezta Pro 🚀',
                        html: `
                            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                                <h1>Bienvenue dans Prezta, ${userName} !</h1>
                                <p>Merci pour votre abonnement. Votre compte Pro a été créé automatiquement avec succès.</p>
                                <p>Pour vous connecter immédiatement sans mot de passe, cliquez sur le lien magique ci-dessous :</p>
                                <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                                    Accéder à mon Dashboard
                                </a>
                                <p>Pour vos prochaines connexions, vous pourrez utiliser ce même email sur l'écran de connexion.</p>
                                <p>L'équipe Prezta</p>
                            </div>
                        `
                    })
                });

                if (!res.ok) {
                    console.error("Resend Email Error:", await res.text());
                } else {
                    console.log("Welcome email sent successfully!");
                }
            }

        } else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
            // Find user id from email to cancel
            const { data: profile } = await supabase.from('profiles').select('id').eq('email', userEmail).single();
            if (profile) {
                const { error } = await supabase
                    .from('subscriptions')
                    .update({ status: data.status })
                    .eq('user_id', profile.id);
                if (error) throw error;
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
