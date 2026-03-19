import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react'

// ─── Lemon Squeezy URLs ──────────────────────────────────────────────────────
const LS_STARTER_MONTHLY = 'https://prezta.lemonsqueezy.com/checkout/buy/962125e4-80f2-4181-966e-f53763aae63d'
const LS_PRO_MONTHLY     = 'https://prezta.lemonsqueezy.com/checkout/buy/912fdc98-0a1e-40de-95c8-ffde04fab2a1'
const LS_CUSTOMER_PORTAL = 'https://app.lemonsqueezy.com/my-orders'
const POLL_INTERVAL_MS   = 3_000
const POLL_TIMEOUT_MS    = 15 * 60 * 1_000 // 15 minutes

// ─── Sub-components ──────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
    if (plan === 'pro')
        return <span className="bg-brand-light text-brand text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Pro</span>
    if (plan === 'starter')
        return <span className="bg-surface2 text-text-secondary text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Starter</span>
    return <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Essai gratuit</span>
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
    const { user } = useAuth()
    const navigate  = useNavigate()
    const queryClient = useQueryClient()
    const { data: subscription } = useSubscription()

    const plan      = subscription?.plan ?? 'trial'
    const isPro     = plan === 'pro'
    const isStarter = plan === 'starter'
    const isTrial   = plan === 'trial'

    // Polling state
    const [waitingFor, setWaitingFor]   = useState<'starter' | 'pro' | null>(null)
    const pollIntervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)
    const pollTimeoutRef                = useRef<ReturnType<typeof setTimeout> | null>(null)
    const previousPlanRef               = useRef<string>(plan)

    // Trial countdown
    const trialDaysRemaining = user?.created_at
        ? Math.max(0, PLANS.trial.trialDays - Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
          ))
        : PLANS.trial.trialDays
    const trialProgress = Math.round(((PLANS.trial.trialDays - trialDaysRemaining) / PLANS.trial.trialDays) * 100)

    // Renewal date
    const renewalDate = subscription?.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
          })
        : null

    // Detect plan upgrade while polling
    useEffect(() => {
        if (!waitingFor) return
        const upgraded = (waitingFor === 'starter' && isStarter) || (waitingFor === 'pro' && isPro)
        if (upgraded) {
            stopPolling()
            toast.success(`🎉 Bienvenue sur le plan ${waitingFor === 'pro' ? 'Pro' : 'Starter'} !`)
            navigate('/dashboard')
        }
    }, [plan, waitingFor]) // eslint-disable-line react-hooks/exhaustive-deps

    // Keep ref in sync so polling callback can compare
    useEffect(() => {
        previousPlanRef.current = plan
    }, [plan])

    function startPolling(target: 'starter' | 'pro') {
        setWaitingFor(target)

        pollIntervalRef.current = setInterval(async () => {
            await queryClient.refetchQueries({ queryKey: ['subscription'] })
        }, POLL_INTERVAL_MS)

        pollTimeoutRef.current = setTimeout(() => {
            stopPolling()
        }, POLL_TIMEOUT_MS)
    }

    function stopPolling() {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        if (pollTimeoutRef.current)  clearTimeout(pollTimeoutRef.current)
        pollIntervalRef.current = null
        pollTimeoutRef.current  = null
        setWaitingFor(null)
    }

    // Cleanup on unmount
    useEffect(() => () => stopPolling(), []) // eslint-disable-line react-hooks/exhaustive-deps

    // Open LS overlay or fallback to new tab
    function openCheckout(url: string, target: 'starter' | 'pro') {
        if (typeof window.createLemonSqueezy === 'function') {
            window.createLemonSqueezy()
            window.LemonSqueezy?.Setup({
                eventHandler: (event) => {
                    if (event.event === 'Checkout.Success') {
                        window.LemonSqueezy?.Url.Close()
                        stopPolling()
                        toast.success(`🎉 Bienvenue sur le plan ${target === 'pro' ? 'Pro' : 'Starter'} !`)
                        void queryClient.refetchQueries({ queryKey: ['subscription'] })
                        navigate('/dashboard')
                    }
                },
            })
            window.LemonSqueezy?.Url.Open(`${url}?embed=1`)
        } else {
            window.open(url, '_blank')
        }
        // Always start polling as a safety net
        startPolling(target)
    }

    // ── Waiting screen ────────────────────────────────────────────────────────
    if (waitingFor) {
        return (
            <div className="max-w-md mx-auto mt-20 flex flex-col items-center gap-6 text-center">
                <Loader2 className="h-10 w-10 text-brand animate-spin" />
                <div>
                    <p className="text-lg font-bold text-text-primary">
                        En attente de la confirmation de paiement…
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                        Complétez le paiement dans la fenêtre ouverte. Cette page se mettra à jour automatiquement.
                    </p>
                </div>
                <Button variant="ghost" className="text-text-muted text-sm" onClick={stopPolling}>
                    Annuler
                </Button>
            </div>
        )
    }

    // ── Main layout ───────────────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto space-y-8">

            {/* ── Current plan card ── */}
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <h2 className="text-base font-bold text-text-primary">Plan actuel</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <PlanBadge plan={plan} />
                            {isTrial && trialDaysRemaining > 0 && (
                                <span className="text-sm text-amber-700 font-medium">
                                    Essai gratuit · expire dans{' '}
                                    <strong>{trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''}</strong>
                                </span>
                            )}
                            {isTrial && trialDaysRemaining === 0 && (
                                <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Essai expiré
                                </span>
                            )}
                            {!isTrial && (
                                <span className="text-sm text-text-secondary flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                                    Actif
                                    {renewalDate && (
                                        <> · Renouvellement le <strong>{renewalDate}</strong></>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    {!isTrial && (
                        <Button asChild variant="outline" size="sm" className="shrink-0 text-xs border-border">
                            <a href={LS_CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Gérer mon abonnement
                            </a>
                        </Button>
                    )}
                </div>

                {/* Trial progress bar */}
                {isTrial && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-text-muted">
                            <span>Jour {PLANS.trial.trialDays - trialDaysRemaining} / {PLANS.trial.trialDays}</span>
                            <span>{trialDaysRemaining} jour{trialDaysRemaining !== 1 ? 's' : ''} restant{trialDaysRemaining !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${trialProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Firma usage */}
                {(isStarter || isPro) && (
                    <div className="pt-3 border-t border-border/60 text-sm text-text-secondary">
                        Signatures FIRMA utilisées ce mois :{' '}
                        <strong className="text-text-primary">{subscription?.firmaUsed ?? 0}</strong>
                        {isStarter && ' / 3'}
                    </div>
                )}
            </div>

            {/* ── Upgrade options ── */}
            <div className="space-y-4">
                <h2 className="text-base font-bold text-text-primary px-1">
                    {isTrial ? 'Choisir un plan' : isPro ? 'Votre plan' : 'Passer au Pro'}
                </h2>

                <div className={`grid gap-4 ${isTrial ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>

                    {/* Starter — shown to Trial; greyed for Starter; hidden for Pro */}
                    {!isPro && (
                        <div className={`bg-white rounded-2xl border p-5 flex flex-col transition-opacity ${
                            isStarter ? 'border-brand-light opacity-70' : 'border-border'
                        }`}>
                            <p className="text-xs font-bold uppercase tracking-wider text-brand mb-1">Starter</p>
                            <p className="text-2xl font-black text-text-primary mb-1">
                                9€ <span className="text-sm font-normal text-text-muted">/mois</span>
                            </p>
                            <ul className="space-y-1.5 text-sm text-text-secondary flex-1 mb-4">
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />10 projets · 50 documents</li>
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />3 signatures FIRMA/mois</li>
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />2 Go de stockage</li>
                            </ul>
                            {isStarter ? (
                                <div className="rounded-lg bg-surface2 text-center py-2 text-sm font-bold text-text-muted cursor-default">
                                    Plan actuel
                                </div>
                            ) : (
                                <Button
                                    className="w-full bg-text-primary text-white hover:bg-text-primary/90"
                                    onClick={() => openCheckout(LS_STARTER_MONTHLY, 'starter')}
                                >
                                    Choisir Starter
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Pro — shown to Trial and Starter; greyed for Pro */}
                    <div className={`bg-white rounded-2xl border-2 p-5 flex flex-col relative overflow-hidden ${
                        isPro ? 'border-brand opacity-70' : 'border-brand shadow-lg shadow-blue-50'
                    }`}>
                        {!isPro && (
                            <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-widest">
                                Recommandé
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="h-3.5 w-3.5 text-brand" />
                            <p className="text-xs font-bold uppercase tracking-wider text-brand">Pro</p>
                        </div>
                        <p className="text-2xl font-black text-text-primary mb-1">
                            19€ <span className="text-sm font-normal text-text-muted">/mois</span>
                        </p>
                        <ul className="space-y-1.5 text-sm text-text-secondary flex-1 mb-4">
                            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Projets et documents illimités</li>
                            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Signatures FIRMA illimitées</li>
                            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand shrink-0" /><span className="font-semibold text-text-primary">IA complète</span> — clauses, relances, optimisation</li>
                            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />10 Go de stockage</li>
                        </ul>
                        {isPro ? (
                            <div className="rounded-lg bg-brand-light text-center py-2 text-sm font-bold text-brand cursor-default">
                                Plan actuel
                            </div>
                        ) : (
                            <Button
                                className="w-full bg-brand text-white hover:bg-brand-hover shadow-md shadow-blue-200"
                                onClick={() => openCheckout(LS_PRO_MONTHLY, 'pro')}
                            >
                                Passer au Pro
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Manage / cancel ── */}
            {!isTrial && (
                <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
                    <h2 className="text-base font-bold text-text-primary">Gérer votre abonnement</h2>
                    <p className="text-sm text-text-secondary">
                        Modifiez votre plan, mettez à jour votre moyen de paiement ou annulez depuis le portail Lemon Squeezy.
                    </p>
                    <Button asChild variant="outline" className="border-border text-text-secondary">
                        <a href={LS_CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                            Accéder au portail de facturation
                        </a>
                    </Button>
                </div>
            )}
        </div>
    )
}
