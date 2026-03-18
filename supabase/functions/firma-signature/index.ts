import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface FirmaPayload {
    pdfBase64: string
    title: string
    clientName: string
    clientEmail: string
}

function extractPayload(raw: unknown): FirmaPayload | null {
    if (raw === null || typeof raw !== 'object') return null

    // supabase.functions.invoke wraps the body in { body: { ... } } in some client versions
    const rec = raw as Record<string, unknown>
    const candidate =
        typeof rec.body === 'object' && rec.body !== null
            ? (rec.body as Record<string, unknown>)
            : rec

    const { pdfBase64, title, clientName, clientEmail } = candidate
    if (
        typeof pdfBase64 !== 'string' || !pdfBase64 ||
        typeof title !== 'string' || !title ||
        typeof clientName !== 'string' || !clientName ||
        typeof clientEmail !== 'string' || !clientEmail
    ) {
        return null
    }

    return { pdfBase64, title, clientName, clientEmail }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        const apiKeyHeader = req.headers.get('apikey')
        const token = authHeader?.replace('Bearer ', '') ?? apiKeyHeader

        if (!token) {
            return new Response(
                JSON.stringify({ error: 'Non autorisé' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Non autorisé' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // ── Parse body ────────────────────────────────────────────────────────
        let raw: unknown
        try {
            raw = await req.json()
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const payload = extractPayload(raw)
        if (!payload) {
            console.error('firma-signature: missing/invalid fields. Received keys:', Object.keys(
                (raw !== null && typeof raw === 'object') ? raw as Record<string, unknown> : {}
            ))
            return new Response(
                JSON.stringify({ error: 'Missing required fields: pdfBase64, title, clientName, clientEmail' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const { pdfBase64, title, clientName, clientEmail } = payload

        const FIRMA_API_KEY = Deno.env.get('FIRMA_API_KEY')
        if (!FIRMA_API_KEY) {
            throw new Error('FIRMA_API_KEY is not set')
        }

        const assignedRecipientId = 'temp_1'

        // 1. Create the signing request
        const createRes = await fetch(
            'https://api.firma.dev/functions/v1/signing-request-api/signing-requests',
            {
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
                            position: { x: 10, y: 85, width: 40, height: 10 }
                        },
                        {
                            type: 'date',
                            page_number: 1,
                            recipient_id: assignedRecipientId,
                            position: { x: 60, y: 85, width: 30, height: 5 }
                        }
                    ]
                })
            }
        )

        if (!createRes.ok) {
            const errorText = await createRes.text()
            throw new Error(`Firma creation failed: ${createRes.status} ${errorText}`)
        }

        const firmaData = await createRes.json() as {
            id: string
            recipients: Array<{ id: string }>
        }
        const requestId = firmaData.id
        const recipientId = firmaData.recipients[0].id

        // 2. Send the request (Firma may return 500 but still sends the email)
        try {
            const sendRes = await fetch(
                `https://api.firma.dev/functions/v1/signing-request-api/signing-requests/${requestId}/send`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': FIRMA_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            )
            if (!sendRes.ok) {
                console.error('Firma send warning (ignored):', await sendRes.text())
            }
        } catch (e: unknown) {
            console.error('Firma send network warning (ignored):', e instanceof Error ? e.message : String(e))
        }

        return new Response(
            JSON.stringify({
                success: true,
                url: `https://app.firma.dev/signing/${recipientId}`,
                firmaId: requestId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: unknown) {
        console.error('firma-signature fatal error:', error)
        return new Response(
            JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
