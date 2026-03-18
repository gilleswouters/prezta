/**
 * check-document-expiry
 * ---------------------
 * Daily cron job (08:00 UTC) — scans project_contracts for upcoming expirations
 * and sends Resend email notifications to the freelancer.
 *
 * Setup in Supabase dashboard → Edge Functions → Schedule:
 *   cron: '0 8 * * *'
 *   function: check-document-expiry
 *
 * Env vars required (set in Supabase Edge Function secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (_req) => {
    try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendKey   = Deno.env.get('RESEND_API_KEY') ?? ''

    if (!supabaseUrl || !serviceKey) {
        return new Response(JSON.stringify({ error: 'Env vars missing' }), { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const now = new Date()
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Fetch all contracts expiring in the next 30 days
    type ContractRow = {
        id: string
        title: string
        expires_at: string
        expiry_notified_30d: boolean
        expiry_notified_7d: boolean
        user_id: string
        projects: { name: string; clients: { name: string } | null } | null
    }

    const { data: contracts, error } = await supabase
        .from('project_contracts')
        .select('id, title, expires_at, expiry_notified_30d, expiry_notified_7d, user_id, projects(name, clients(name))')
        .not('expires_at', 'is', null)
        .gt('expires_at', now.toISOString())
        .lte('expires_at', in30d.toISOString())

    if (error) {
        console.error('DB error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    let sent30 = 0
    let sent7  = 0

    for (const contract of (contracts ?? []) as ContractRow[]) {
        const expiresAt  = new Date(contract.expires_at)
        const msLeft     = expiresAt.getTime() - now.getTime()
        const daysLeft   = Math.round(msLeft / (1000 * 60 * 60 * 24))

        // Fetch user email via admin API
        const { data: authData } = await supabase.auth.admin.getUserById(contract.user_id)
        const userEmail = authData?.user?.email
        if (!userEmail) continue

        const projectName = contract.projects?.name ?? 'Sans projet'
        const clientName  = contract.projects?.clients?.name ?? 'Client'

        // ── J-7 alert (most urgent, check first) ─────────────────────────
        if (daysLeft <= 7 && !contract.expiry_notified_7d) {
            await sendEmail(
                resendKey,
                userEmail,
                `⚠ Contrat "${contract.title}" expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
                buildHtml(contract.title, projectName, clientName, daysLeft, true),
            )
            await supabase
                .from('project_contracts')
                .update({ expiry_notified_7d: true })
                .eq('id', contract.id)
            sent7++
        }
        // ── J-30 alert ────────────────────────────────────────────────────
        else if (daysLeft <= 30 && !contract.expiry_notified_30d) {
            await sendEmail(
                resendKey,
                userEmail,
                `Votre contrat "${contract.title}" expire dans ${daysLeft} jours`,
                buildHtml(contract.title, projectName, clientName, daysLeft, false),
            )
            await supabase
                .from('project_contracts')
                .update({ expiry_notified_30d: true })
                .eq('id', contract.id)
            sent30++
        }
    }

    console.log(`Expiry check done — 30d: ${sent30}, 7d: ${sent7}`)
    return new Response(
        JSON.stringify({ ok: true, sent30, sent7, checkedAt: now.toISOString() }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 },
    )
    } catch (error: unknown) {
        console.error('[check-document-expiry] fatal error:', error)
        return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
    }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sendEmail(
    apiKey: string,
    to: string,
    subject: string,
    html: string,
): Promise<void> {
    if (!apiKey) {
        console.log(`[MOCK] To: ${to} | Subject: ${subject}`)
        return
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Prezta <hello@updates.prezta.app>',
            to,
            subject,
            html,
        }),
    })
    if (!res.ok) {
        console.error('Resend error:', await res.text())
    }
}

function buildHtml(
    title: string,
    projectName: string,
    clientName: string,
    daysLeft: number,
    urgent: boolean,
): string {
    const warning = urgent ? '⚠ ' : ''
    const action = urgent
        ? 'Renouvelez ou archivez ce contrat dès que possible pour éviter tout litige.'
        : 'Pensez à contacter votre client pour planifier le renouvellement.'

    return `
<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <div style="background: ${urgent ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${urgent ? '#ef4444' : '#f59e0b'}; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 0; font-weight: 700; color: ${urgent ? '#b91c1c' : '#92400e'};">
      ${warning}Contrat expirant dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}
    </p>
  </div>
  <p>Bonjour,</p>
  <p>
    Votre contrat <strong>${title}</strong>
    (projet : <em>${projectName}</em>, client : <em>${clientName}</em>)
    <strong>expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong>.
  </p>
  <p>${action}</p>
  <div style="margin: 28px 0; text-align: center;">
    <a href="https://app.prezta.fr/projets"
       style="background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px;
              text-decoration: none; font-weight: 600; display: inline-block;">
      Gérer mes contrats
    </a>
  </div>
  <p style="color: #64748b; font-size: 13px;">
    Vous recevez cet email car vous avez activé les alertes d'expiration sur Prezta.
  </p>
  <p>Cordialement,<br>L'équipe Prezta</p>
</div>
`
}
