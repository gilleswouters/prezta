/**
 * check-seasonality
 * -----------------
 * Monthly cron job (09:00 on the 1st of each month) — detects historically slow
 * upcoming months and notifies the freelancer by email.
 *
 * Schedule in Supabase dashboard → Edge Functions → Schedule:
 *   cron: '0 9 1 * *'
 *   function: check-seasonality
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileRow {
    id: string
    seasonality_enabled: boolean
    last_seasonality_alert_sent_at: string | null
}

interface InvoiceRow {
    amount: number
    status: string
    created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function getNextMonthIndex(now: Date): number {
    return (now.getMonth() + 1) % 12 // 0-based
}

function detectQuietMonths(
    invoices: InvoiceRow[],
    now: Date,
    threshold = 0.6,
): Set<number> {
    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthCA = new Array(12).fill(0)

    for (const inv of invoices) {
        if (inv.status !== 'payé') continue
        const d = new Date(inv.created_at)
        if (d < twelveMonthsAgo) continue
        monthCA[d.getMonth()] += Number(inv.amount)
    }

    const total = monthCA.reduce((a, b) => a + b, 0)
    const avg = total / 12
    if (avg === 0) return new Set()

    const quiet = new Set<number>()
    for (let i = 0; i < 12; i++) {
        if (monthCA[i] < avg * threshold) quiet.add(i)
    }
    return quiet
}

function hasSentThisMonth(lastSent: string | null, now: Date): boolean {
    if (!lastSent) return false
    const sent = new Date(lastSent)
    return sent.getFullYear() === now.getFullYear() && sent.getMonth() === now.getMonth()
}

async function sendEmail(
    apiKey: string,
    to: string,
    nextMonthName: string,
    avgMonthCA: number,
    nextMonthCA: number,
): Promise<void> {
    const subject = `Prezta · Votre mois de ${nextMonthName} est historiquement calme`

    const html = `
<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 0; font-weight: 700; color: #1d4ed8;">📅 Mois creux détecté : ${nextMonthName}</p>
  </div>

  <p>Bonjour,</p>
  <p>
    D'après vos données des 12 derniers mois, <strong>${nextMonthName}</strong> est généralement
    votre mois le plus creux
    (CA moyen ce mois : <strong>${Math.round(nextMonthCA)} €</strong> vs
    moyenne annuelle : <strong>${Math.round(avgMonthCA)} €</strong>).
  </p>
  <p>
    C'est le bon moment pour prospecter de nouveaux clients ou relancer
    vos contacts inactifs.
  </p>

  <div style="margin: 28px 0; text-align: center;">
    <a href="https://app.prezta.fr/revenus#analyse"
       style="background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px;
              text-decoration: none; font-weight: 600; display: inline-block;">
      Voir mon analyse d'activité
    </a>
  </div>

  <p style="color: #64748b; font-size: 13px;">
    Vous recevez cet email car les alertes de saisonnalité sont activées sur votre compte Prezta.
    Vous pouvez les désactiver dans vos paramètres de profil.
  </p>
  <p>Cordialement,<br>L'équipe Prezta</p>
</div>`

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

// ─── Handler ──────────────────────────────────────────────────────────────────

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
    const nextMonthIdx = getNextMonthIndex(now)
    const nextMonthName = MONTH_NAMES_FR[nextMonthIdx]

    // All users with seasonality enabled
    const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id, seasonality_enabled, last_seasonality_alert_sent_at')
        .eq('seasonality_enabled', true)

    if (profileErr) {
        return new Response(JSON.stringify({ error: profileErr.message }), { status: 500 })
    }

    let notified = 0
    let skipped  = 0

    for (const profile of (profiles ?? []) as ProfileRow[]) {
        // Guard: already sent this month
        if (hasSentThisMonth(profile.last_seasonality_alert_sent_at, now)) {
            skipped++
            continue
        }

        // Fetch 13 months of invoices (12m data + buffer)
        const from13mAgo = new Date(now)
        from13mAgo.setMonth(from13mAgo.getMonth() - 13)

        const { data: invoices } = await supabase
            .from('invoices')
            .select('amount, status, created_at')
            .eq('user_id', profile.id)
            .gte('created_at', from13mAgo.toISOString())

        const rows = (invoices ?? []) as InvoiceRow[]

        // Need 12+ months of data
        const months = new Set(rows.map(r => r.created_at.slice(0, 7)))
        if (months.size < 12) {
            skipped++
            continue
        }

        const quietMonths = detectQuietMonths(rows, now)
        if (!quietMonths.has(nextMonthIdx)) {
            skipped++
            continue
        }

        // Calculate avg and next-month CA for email body
        const monthCA = new Array(12).fill(0)
        const twelveMonthsAgo = new Date(now)
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
        for (const inv of rows) {
            if (inv.status !== 'payé') continue
            const d = new Date(inv.created_at)
            if (d < twelveMonthsAgo) continue
            monthCA[d.getMonth()] += Number(inv.amount)
        }
        const avg12 = monthCA.reduce((a, b) => a + b, 0) / 12
        const nextCA = monthCA[nextMonthIdx]

        // Get user email
        const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
        const userEmail = authData?.user?.email
        if (!userEmail) continue

        // Send email
        await sendEmail(resendKey, userEmail, nextMonthName, avg12, nextCA)

        // Mark as sent
        await supabase
            .from('profiles')
            .update({ last_seasonality_alert_sent_at: now.toISOString() })
            .eq('id', profile.id)

        notified++
    }

    console.log(`Seasonality check done — notified: ${notified}, skipped: ${skipped}`)
    return new Response(
        JSON.stringify({ ok: true, notified, skipped, checkedAt: now.toISOString(), nextMonth: nextMonthName }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 },
    )
    } catch (error: unknown) {
        console.error('[check-seasonality] fatal error:', error)
        return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
    }
})
