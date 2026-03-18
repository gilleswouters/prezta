import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const resendApiKey = Deno.env.get('RESEND_API_KEY')

        if (!supabaseUrl || !supabaseKey) {
            console.error('[send-invoice-reminder] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Verifier auth utilisateur
        const authHeader = req.headers.get('Authorization')
        const apiKeyHeader = req.headers.get('apikey')
        const token = authHeader?.replace('Bearer ', '') ?? apiKeyHeader

        if (!token) {
            return new Response(JSON.stringify({ error: 'Non autorisé' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Non autorisé' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { invoice_id } = await req.json()
        if (!invoice_id) throw new Error('invoice_id requis')

        // Fetch invoice with project and client info
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
                *,
                projects (
                    name,
                    portal_link,
                    clients (
                        name,
                        email,
                        contact_name
                    )
                )
            `)
            .eq('id', invoice_id)
            .single()

        if (invoiceError || !invoice) throw new Error('Facture introuvable')

        // Ensure user owns this invoice
        if (invoice.user_id !== user.id) throw new Error('Non autorisé pour cette facture')

        const project = invoice.projects;
        const client = project?.clients;

        if (!client?.email) {
            throw new Error('Le client associé à ce projet n\'a pas d\'adresse email renseignée')
        }

        // Fetch user profile for sender details
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', user.id)
            .single()

        const senderName = profile?.company_name || profile?.full_name || 'Votre Partenaire';
        const clientName = client.contact_name || client.name || 'Client';
        const portalUrl = `https://prezta.app/portal/${project.portal_link}`;

        const amount = Number(invoice.amount).toFixed(2);
        const invoiceRef = invoice.invoice_number ? `Facture N°${invoice.invoice_number}` : (invoice.title || "Votre Facture");

        // Format email HTML
        const html = `
            <div style="font-family: sans-serif; max-w-xl; color: #333; line-height: 1.5;">
                <p>Bonjour ${clientName},</p>
                <p>Sauf erreur ou omission de notre part, il semble que le paiement de la <strong>${invoiceRef}</strong> (Montant : <strong>${amount} €</strong>) relative au projet <em>${project.name}</em> n'a pas encore été reçu.</p>
                <p>Vous pouvez consulter, télécharger et régler cette facture directement depuis votre espace client sécurisé en cliquant sur le lien ci-dessous :</p>
                
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${portalUrl}" style="background-color: #9333EA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Accéder à mon espace sécurisé
                    </a>
                </div>

                <p>Si vous avez déjà procédé au règlement entre-temps, veuillez ignorer ce message.</p>
                <p>Restant à votre disposition pour toute question,</p>
                <p>Cordialement,<br><strong>${senderName}</strong></p>
            </div>
        `;

        if (!resendApiKey) {
            console.log("Mock Mode - No RESEND_API_KEY configured. Sending would be:", html);
        } else {
            console.log("Sending reminder to", client.email, "via Resend");
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Prezta <hello@updates.prezta.app>', // To be replaced with verified domain
                    to: client.email,
                    subject: `Rappel : ${invoiceRef} en attente de paiement`,
                    html: html
                })
            })

            if (!res.ok) {
                const resText = await res.text()
                console.error("Resend API Erreur:", resText)
                throw new Error("Erreur de l'API d'envoi d'email")
            }
        }

        // Update last_reminder_date and status if needed
        const updates: { last_reminder_date: string; status?: string } = { last_reminder_date: new Date().toISOString() };
        if (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status === 'en_attente') {
            updates.status = 'en_retard';
        }

        await supabase.from('invoices').update(updates).eq('id', invoice_id);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: unknown) {
        console.error('[send-invoice-reminder] error:', error)
        return new Response(JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
