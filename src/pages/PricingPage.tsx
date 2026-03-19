import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Zap, Shield, Plus, Minus } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/plans';

// Lemon Squeezy checkout URLs — variant IDs confirmed in LS dashboard
// Dashboard → Store → Products → (plan) → Variants → Share link
// Variant ID confirmed in LS dashboard
const LS_STARTER_MONTHLY = "https://prezta.lemonsqueezy.com/checkout/buy/962125e4-80f2-4181-966e-f53763aae63d";
// Variant ID confirmed in LS dashboard
const LS_STARTER_ANNUAL  = "https://prezta.lemonsqueezy.com/checkout/buy/34c989b7-e983-49e4-bdee-cfbd31e90efa";
// Variant ID confirmed in LS dashboard
const LS_PRO_MONTHLY     = "https://prezta.lemonsqueezy.com/checkout/buy/912fdc98-0a1e-40de-95c8-ffde04fab2a1";
// Variant ID confirmed in LS dashboard
const LS_PRO_ANNUAL      = "https://prezta.lemonsqueezy.com/checkout/buy/c69d44bb-396c-454f-bb54-a1f99a0aca9d";
// Variant ID confirmed in LS dashboard
const LS_EXTRA_SIG       = "https://prezta.lemonsqueezy.com/checkout/buy/d91dbbf4-1274-44bd-baf4-6bd878e50224";

interface FeatureRow {
    label: string;
    trial: string | boolean;
    starter: string | boolean;
    pro: string | boolean;
}

const FEATURE_ROWS: FeatureRow[] = [
    { label: 'Projets',                  trial: '3',           starter: '10',           pro: 'Illimité' },
    { label: 'Documents actifs',         trial: '15',          starter: '50',           pro: 'Illimité' },
    { label: 'Stockage',                 trial: '500 Mo',      starter: '2 Go',         pro: '10 Go' },
    { label: 'Signatures FIRMA/mois',    trial: false,         starter: '3 + 1€/extra', pro: 'Illimité' },
    { label: 'Devis & Factures PDF',     trial: true,          starter: true,           pro: true },
    { label: 'Gestion clients',          trial: true,          starter: true,           pro: true },
    { label: 'Portail client',           trial: true,          starter: true,           pro: true },
    { label: 'Modèles de contrats',      trial: true,          starter: true,           pro: true },
    { label: 'Export comptable',         trial: true,          starter: true,           pro: true },
    { label: 'IA — clauses contrat',     trial: false,         starter: false,          pro: true },
    { label: 'IA — relances email',      trial: false,         starter: false,          pro: true },
    { label: 'IA — optimisation route',  trial: false,         starter: false,          pro: true },
    { label: 'Support prioritaire',      trial: false,         starter: false,          pro: true },
];

function FeatureCell({ value }: { value: string | boolean }) {
    if (value === true)  return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
    if (value === false) return <X className="h-4 w-4 text-text-muted mx-auto" />;
    return <span className="text-xs font-semibold text-text-primary">{value}</span>;
}

export default function PricingPage() {
    const { data: subscription } = useSubscription();
    const navigate = useNavigate();
    const [annual, setAnnual] = useState(false);
    const [extraQty, setExtraQty] = useState(1);

    const currentPlan = subscription?.plan ?? 'trial';
    const isPro     = currentPlan === 'pro';
    const isStarter = currentPlan === 'starter';
    const isTrial   = currentPlan === 'trial' || currentPlan === 'free';

    const starterPrice  = annual ? PLANS.starter.price.annual  : PLANS.starter.price.monthly;
    const proPrice      = annual ? PLANS.pro.price.annual      : PLANS.pro.price.monthly;
    const starterUrl    = annual ? LS_STARTER_ANNUAL : LS_STARTER_MONTHLY;
    const proUrl        = annual ? LS_PRO_ANNUAL     : LS_PRO_MONTHLY;

    return (
        <div className="max-w-5xl mx-auto py-12 px-6 space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-black text-text-primary tracking-tight">
                    Choisissez votre plan
                </h1>
                <p className="text-text-secondary max-w-xl mx-auto">
                    Commencez gratuitement pendant 14 jours, passez au Starter ou au Pro quand vous êtes prêt.
                </p>

                {/* Annual toggle */}
                <div className="flex items-center justify-center gap-3 mt-4">
                    <span className={`text-sm font-semibold ${!annual ? 'text-text-primary' : 'text-text-muted'}`}>Mensuel</span>
                    <button
                        onClick={() => setAnnual(v => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-brand' : 'bg-border'}`}
                        aria-label="Basculer annuel"
                    >
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-semibold ${annual ? 'text-text-primary' : 'text-text-muted'}`}>
                        Annuel <span className="text-emerald-600 text-xs font-bold ml-1">−20%</span>
                    </span>
                </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Gratuit / Trial */}
                <div className="rounded-2xl border border-border bg-white p-6 flex flex-col">
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Gratuit</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-text-primary">0€</span>
                            <span className="text-text-muted text-sm">/14 jours</span>
                        </div>
                        <p className="text-xs text-text-muted mt-2">Essai sans carte bancaire</p>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />3 projets</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />15 documents actifs</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />500 Mo de stockage</li>
                        <li className="flex items-center gap-2 text-sm text-text-muted"><X className="h-4 w-4 shrink-0" />Signatures FIRMA</li>
                        <li className="flex items-center gap-2 text-sm text-text-muted"><X className="h-4 w-4 shrink-0" />Fonctionnalités IA</li>
                    </ul>
                    {isTrial ? (
                        <div className="rounded-lg bg-surface2 text-center py-2 text-sm font-bold text-text-muted">
                            Votre plan actuel
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full border-border text-text-secondary" disabled>
                            Essai terminé
                        </Button>
                    )}
                </div>

                {/* Starter */}
                <div className="rounded-2xl border border-border bg-white p-6 flex flex-col">
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand mb-1">Starter</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-text-primary">{starterPrice.toFixed(2).replace('.', ',')}€</span>
                            <span className="text-text-muted text-sm">/mois</span>
                        </div>
                        {annual && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1">
                                Facturé 86,40€/an
                            </p>
                        )}
                        <p className="text-xs text-text-muted mt-2">Pour les freelances qui démarrent</p>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />10 projets</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />50 documents actifs</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />2 Go de stockage</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />3 signatures FIRMA/mois + 1€/extra</li>
                        <li className="flex items-center gap-2 text-sm text-text-muted"><X className="h-4 w-4 shrink-0" />Fonctionnalités IA</li>
                    </ul>
                    {isStarter ? (
                        <div className="rounded-lg bg-brand-light text-center py-2 text-sm font-bold text-brand">
                            Votre plan actuel
                        </div>
                    ) : (
                        <Button asChild className="w-full bg-text-primary text-white hover:bg-text-primary/90">
                            <a href={starterUrl} target="_blank" rel="noopener noreferrer">
                                Choisir Starter
                            </a>
                        </Button>
                    )}
                </div>

                {/* Pro */}
                <div className="rounded-2xl border-2 border-brand bg-white p-6 flex flex-col relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                        Recommandé
                    </div>
                    <div className="mb-6">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="h-3.5 w-3.5 text-brand" />
                            <p className="text-xs font-bold uppercase tracking-wider text-brand">Pro</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-text-primary">{proPrice.toFixed(2).replace('.', ',')}€</span>
                            <span className="text-text-muted text-sm">/mois</span>
                        </div>
                        {annual && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1">
                                Facturé 182,40€/an
                            </p>
                        )}
                        <p className="text-xs text-text-muted mt-2">Tout illimité + IA complète</p>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Projets illimités</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Documents illimités</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />10 Go de stockage</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Signatures FIRMA illimitées</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" /><span className="font-semibold">IA complète</span> — clauses, relances, optimisation route</li>
                        <li className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Support prioritaire</li>
                    </ul>
                    {isPro ? (
                        <div className="rounded-lg bg-brand-light text-center py-2 text-sm font-bold text-brand">
                            Vous êtes Pro 🎉
                        </div>
                    ) : (
                        <Button asChild className="w-full bg-brand text-white hover:bg-brand-hover shadow-md shadow-blue-200">
                            <a href={proUrl} target="_blank" rel="noopener noreferrer">
                                Choisir Pro
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Feature comparison table */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="grid grid-cols-4 text-xs font-bold uppercase tracking-wider text-text-muted bg-surface2 px-4 py-3 border-b border-border">
                    <div>Fonctionnalité</div>
                    <div className="text-center">Gratuit</div>
                    <div className="text-center">Starter</div>
                    <div className="text-center">Pro</div>
                </div>
                {FEATURE_ROWS.map((row) => (
                    <div key={row.label} className="grid grid-cols-4 px-4 py-3 border-b border-border/50 hover:bg-surface2/40 transition-colors items-center">
                        <div className="text-sm text-text-primary">{row.label}</div>
                        <div className="text-center"><FeatureCell value={row.trial} /></div>
                        <div className="text-center"><FeatureCell value={row.starter} /></div>
                        <div className="text-center"><FeatureCell value={row.pro} /></div>
                    </div>
                ))}
            </div>

            {/* À la carte signatures — Starter users */}
            {(isTrial || isStarter) && (
                <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                    <div>
                        <h2 className="text-base font-bold text-text-primary">Signatures supplémentaires</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Vous avez consommé vos 3 signatures FIRMA ce mois-ci ? Achetez des signatures à l&apos;unité, sans changer de plan.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setExtraQty(q => Math.max(1, q - 1))}
                                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:bg-surface2 transition-colors"
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold text-text-primary">{extraQty}</span>
                            <button
                                onClick={() => setExtraQty(q => Math.min(20, q + 1))}
                                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:bg-surface2 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <span className="text-sm text-text-secondary">
                            signature{extraQty > 1 ? 's' : ''} × 1€ ={' '}
                            <strong className="text-text-primary">{extraQty}€</strong>
                        </span>
                        <Button asChild className="bg-brand text-white hover:bg-brand-hover ml-auto">
                            <a
                                href={`${LS_EXTRA_SIG}?quantity=${extraQty}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Acheter
                            </a>
                        </Button>
                    </div>
                </div>
            )}

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="font-bold text-sm">Paiement instantané</span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-bold text-sm">Données sécurisées</span>
                </div>
                <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span className="font-bold text-sm">Sans engagement</span>
                </div>
            </div>

            <p className="text-center text-xs text-text-muted">
                Paiement sécurisé via Lemon Squeezy. Facturation mensuelle ou annuelle. Annulable à tout moment.{' '}
                <button onClick={() => navigate(-1)} className="underline">Retour</button>
            </p>
        </div>
    );
}
