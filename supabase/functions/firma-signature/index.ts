import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
    // Always handle OPTIONS gracefully directly
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("1. Incoming request received", req.method);

        // Parse JSON defensively
        let payload: any = {}
        const bodyText = await req.text()
        console.log("2. Raw body size:", bodyText.length);

        if (bodyText) {
            try {
                payload = JSON.parse(bodyText)
            } catch (e) {
                console.error("JSON parse error:", e);
                throw new Error("Invalid JSON body received");
            }
        } else {
            throw new Error("Empty body received");
        }

        console.log("3. Payload parsed. Keys:", Object.keys(payload));

        const { pdfBase64, title, clientName, clientEmail } = payload

        if (!pdfBase64 || !title || !clientName || !clientEmail) {
            console.log("Error: Missing required fields");
            throw new Error('Missing required fields: pdfBase64, title, clientName, clientEmail')
        }

        console.log("4. Payload valid. Title:", title, "Client:", clientEmail);

        const FIRMA_API_KEY = Deno.env.get('FIRMA_API_KEY')
        if (!FIRMA_API_KEY) {
            console.log("Error: FIRMA_API_KEY is not set in environment");
            throw new Error('FIRMA_API_KEY is not set')
        }

        const assignedRecipientId = 'temp_1';

        // 1. Create the signing request
        const createRes = await fetch('https://api.firma.dev/functions/v1/signing-request-api/signing-requests', {
            method: 'POST',
            headers: {
                'Authorization': FIRMA_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: title,
                document: pdfBase64,
                settings: {
                    send_signing_email: true,
                    allow_download: true
                },
                recipients: [
                    {
                        id: assignedRecipientId,
                        first_name: clientName.split(' ')[0] || 'Client',
                        last_name: clientName.split(' ').slice(1).join(' ') || clientName,
                        email: clientEmail,
                        designation: 'Signer',
                        order: 1
                    }
                ],
                fields: [
                    {
                        type: 'signature',
                        page_number: 1,
                        recipient_id: assignedRecipientId,
                        position: {
                            x: 10,
                            y: 85,
                            width: 40,
                            height: 10
                        }
                    },
                    {
                        type: 'date',
                        page_number: 1,
                        recipient_id: assignedRecipientId,
                        position: {
                            x: 60,
                            y: 85,
                            width: 30,
                            height: 5
                        }
                    }
                ]
            })
        })

        console.log("6. Firma Create Response Status:", createRes.status);

        if (!createRes.ok) {
            const errorText = await createRes.text()
            console.error('Firma Error Body:', errorText)
            throw new Error(`Firma creation failed: ${createRes.status} ${errorText}`)
        }

        const firmaData = await createRes.json()
        const requestId = firmaData.id
        const recipientId = firmaData.recipients[0].id

        console.log("7. Envelope created successfully. ID:", requestId);

        // 2. Send the request (Ignorer l'erreur 500 de Firma.dev qui envoie quand même l'email)
        console.log("8. Sending envelope to recipient...");
        try {
            const sendRes = await fetch(`https://api.firma.dev/functions/v1/signing-request-api/signing-requests/${requestId}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': FIRMA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            console.log("9. Firma Send Response Status:", sendRes.status);
            if (!sendRes.ok) {
                console.error('Firma send warning (ignored):', await sendRes.text());
            }
        } catch (e: any) {
            console.error('Firma send warning (ignored network error):', e.message);
        }

        console.log("10. Everything succeeded. Returning URL...");
        return new Response(
            JSON.stringify({
                success: true,
                url: `https://app.firma.dev/signing/${recipientId}`,
                firmaId: requestId
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        console.error("Function fatal error:", error.message, error.stack)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
