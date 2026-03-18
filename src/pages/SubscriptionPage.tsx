import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, ExternalLink, AlertTriangle } from 'lucide-react'

const LS_STARTER_MONTHLY = 'https://prezta.lemonsqueezy.com/checkout/buy/962125e4-80f2-4181-966e-f53763aae63d'
const LS_PRO_MONTHLY     = 'https://prezta.lemonsqueezy.com/checkout/buy/912fdc98-0a1e-40de-95c8-ffde04fab2a1'
const LS_CUSTOMER_PORTAL = 'https://app.lemonsqueezy.com/my-orders'

function PlanBadge({ plan }: { plan: string }) {
    if (plan === 'pro')     return <span className="bg-brand-light text-brand text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Pro</span>
    if (plan === 'starter') return <span className="bg-surface2 text-text-secondary text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Starter</span>
    return <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Essai gratuit</span>
}

export default function SubscriptionPage() {
    const { user } = useAuth()
    const { data: subscription } = useSubscription()

    const plan = subscription?.plan ?? 'trial'
    const isPro     = plan === 'pro'
    const isStarter = plan === 'starter'
    const isTrial   = plan === 'trial'

    // Trial days remaining
    const trialDaysRemaining = user?.created_at
        ? Math.max(0, PLANS.trial.trialDays - Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
          ))
        : PLANS.trial.trialDays

    // Renewal date
    const renewalDate = subscription?.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : null

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Current plan */}
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-base font-bold text-text-primary">Plan actuel</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <PlanBadge plan={plan} />
                            {isTrial && trialDaysRemaining > 0 && (
                                <span className="text-sm text-amber-700 font-medium">
                                    — Essai gratuit · expire dans{' '}
                                    <strong>{trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''}</strong>
                                </span>
                            )}
                            {isTrial && trialDaysRemaining === 0 && (
                                <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Essai expiré
                                </span>
                            )}
                            {!isTrial && renewalDate && (
                                <span className="text-sm text-text-secondary">
                                    — Prochain renouvellement le <strong>{renewalDate}</strong>
                                </span>
                            )}
                            {!isTrial && !renewalDate && (
                                <span className="text-sm text-text-secondary">— Actif</span>
                            )}
                        </div>
                    </div>
                    {!isTrial && (
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-xs border-border"
                        >
                            <a href={LS_CUSTOMER_PORTAL} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Gérer mon abonnement
                            </a>
                        </Button>
                    )}
                </div>

                {/* Firma usage */}
                {(isStarter || isPro) && (
                    <div className="pt-3 border-t border-border/60 text-sm text-text-secondary">
                        Signatures FIRMA utilisées ce mois :{' '}
                        <strong className="text-text-primary">{subscription?.firmaUsed ?? 0}</strong>
                        {isStarter && ' / 3'}
                    </div>
                )}
            </div>

            {/* Upgrade section */}
            {isTrial && (
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-text-primary px-1">Passer à un plan payant</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Starter */}
                        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
                            <p className="text-xs font-bold uppercase tracking-wider text-brand mb-1">Starter</p>
                            <p className="text-2xl font-black text-text-primary mb-1">9€ <span className="text-sm font-normal text-text-muted">/mois</span></p>
                            <ul className="space-y-1.5 text-sm text-text-secondary flex-1 mb-4">
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />10 projets · 50 documents</li>
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />3 signatures FIRMA/mois</li>
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />2 Go de stockage</li>
                            </ul>
                            <Button asChild className="w-full bg-text-primary text-white hover:bg-text-primary/90">
                                <a href={LS_STARTER_MONTHLY} target="_blank" rel="noopener noreferrer">
                                    Choisir Starter
                                </a>
                            </Button>
                        </div>

                        {/* Pro */}
                        <div className="bg-white rounded-2xl border-2 border-brand p-5 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl uppercase tracking-widest">
                                Recommandé
                            </div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles className="h-3.5 w-3.5 text-brand" />
                                <p className="text-xs font-bold uppercase tracking-wider text-brand">Pro</p>
                            </div>
                            <p className="text-2xl font-black text-text-primary mb-1">19€ <span className="text-sm font-normal text-text-muted">/mois</span></p>
                            <ul className="space-y-1.5 text-sm text-text-secondary flex-1 mb-4">
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Illimité</li>
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Signatures FIRMA illimitées</li>
                                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand shrink-0" /><span className="font-semibold text-text-primary">IA complète</span></li>
                            </ul>
                            <Button asChild className="w-full bg-brand text-white hover:bg-brand-hover shadow-md shadow-blue-200">
                                <a href={LS_PRO_MONTHLY} target="_blank" rel="noopener noreferrer">
                                    Choisir Pro
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isStarter && (
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-text-primary px-1">Passer au Pro</h2>
                    <div className="bg-white rounded-2xl border-2 border-brand p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4 text-brand" />
                                <span className="font-bold text-text-primary">Plan Pro — 19€/mois</span>
                            </div>
                            <p className="text-sm text-text-secondary">
                                Projets illimités, signatures FIRMA illimitées, IA complète.
                            </p>
                        </div>
                        <Button asChild className="bg-brand text-white hover:bg-brand-hover shrink-0">
                            <a href={LS_PRO_MONTHLY} target="_blank" rel="noopener noreferrer">
                                Passer au Pro
                            </a>
                        </Button>
                    </div>
                </div>
            )}

            {/* Cancel / manage */}
            {!isTrial && (
                <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
                    <h2 className="text-base font-bold text-text-primary">Gérer votre abonnement</h2>
                    <p className="text-sm text-text-secondary">
                        Modifiez votre plan, mettez à jour votre moyen de paiement ou annulez votre abonnement depuis le portail Lemon Squeezy.
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
