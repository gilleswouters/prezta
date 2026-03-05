import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
    // Handling CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json();
        console.log("1. Webhook received payload:", JSON.stringify(payload, null, 2));

        // Attempting to locate the Firma Request ID in the payload.
        const firmaId = payload?.data?.signing_request?.id || payload?.data?.id || payload?.id || payload?.request_id;

        if (!firmaId) {
            console.log("Warning: No Firma ID found in the payload, ignoring.");
            return new Response(JSON.stringify({ success: true, message: 'No ID found, ignored' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
            });
        }

        console.log("2. Found Firma ID:", firmaId);

        // Optional: Check if the event is a "completion" event.
        const isCompleted = payload?.type === 'signing_request.certificate.generated' ||
            payload?.type === 'signing_request.completed' ||
            payload?.type === 'signing_request.finished';

        if (!isCompleted) {
            console.log("3. Event does not look like a completion event, ignoring. Type:", payload?.type);
            return new Response(JSON.stringify({ success: true, message: 'Not a completion event, ignored' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
            });
        }

        console.log("3. Completion event detected. Connecting to Database...");

        // Setup Supabase Client
        // Note: Using Service Role Key to bypass RLS policies and allow the webhook to modify data
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase environment variables missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log("4. Updating project_contracts for signature_id:", firmaId);

        // Update the contract matching the Firma ID
        const { data, error } = await supabase
            .from('project_contracts')
            .update({
                status: 'signed',
                signed_at: new Date().toISOString()
            })
            .eq('signature_id', firmaId)
            .select();

        if (error) {
            console.error("Supabase Database Error:", error);
            throw error;
        }

        if (data && data.length > 0) {
            console.log("5. SUCCESS! Contract heavily marked as SIGNED:", data[0].id);
        } else {
            console.log("5. Warning: No contract found matching this Firma ID in the database.");
        }

        return new Response(JSON.stringify({ success: true, updated: data?.length || 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        console.error("Webhook Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
