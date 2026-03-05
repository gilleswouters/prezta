import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Need an admin key or valid user token to invoke edge function correctly
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReminder() {
    console.log("Fetching an overdue invoice...");

    // Find an invoice to test with
    const { data: invoices, error: dbError } = await supabase
        .from('invoices')
        .select('id, user_id')
        .limit(1);

    if (dbError || !invoices || invoices.length === 0) {
        console.error("Cannot find any invoices to test with:", dbError);
        return;
    }

    const invoice = invoices[0];
    console.log(`Testing with Invoice ID: ${invoice.id} belonging to User: ${invoice.user_id}`);

    // Create a JWT for this specific user so the edge function auth passes
    // We can simulate an auth token since we have the service role key, or we can just call it via supabase.functions.invoke using the anon key but we need a user session.

    // Actually, easiest way to test is to just hit the REST endpoint directly and see the error
    console.log("Invoking edge function via Supabase client...");

    try {
        // The edge function requires an Authorization header with a valid user token.
        // Since we don't have a user session here easily, we'll just send a bad request to see the error format.
        const { data, error } = await supabase.functions.invoke('send-invoice-reminder', {
            body: { invoice_id: invoice.id }
        });

        console.log("Edge Function Response Data:", data);
        if (error) {
            console.error("Edge Function Error Object:", error);
            if (error.context) {
                console.error("Error Context:", await error.context.text());
            }
        }
    } catch (e) {
        console.error("Caught Exception:", e);
    }
}

testReminder();
