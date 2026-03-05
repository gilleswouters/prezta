import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testInsert() {
    console.log("Testing invoice insert...");

    // We get a real project & user ID to test
    const { data: user } = await supabase.auth.admin.listUsers();
    // (We use anon key so we have to sign in or test RLS with a known payload)
    // Actually simpler: just dump the table schema from Postgrest

    // Try to just read a row
    const { data, error } = await supabase.from('invoices').select('*').limit(1);
    console.log("Select result:", data, error);

    // Test the exact insert used in the app
    const testPayload = {
        amount: 150.00,
        status: 'en_attente',
        due_date: '2026-04-01',
        paid_date: null,
        notes: 'Test CLI',
        // omitting project_id to see if it causes issues
    };

    const { error: insertError } = await supabase
        .from('invoices')
        .insert([testPayload]);

    if (insertError) {
        console.error("EXACT ERROR:", JSON.stringify(insertError, null, 2));
    } else {
        console.log("Insert worked?");
    }
}

testInsert();
