import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

const BASE_CHECKOUT_URL = "https://prezta.lemonsqueezy.com/checkout/buy/912fdc98-0a1e-40de-95c8-ffde04fab2a1";

export default function PricingPage() {
    const { user } = useAuth();
    const { data: subscription } = useSubscription();
    const isPro = subscription?.isPro;

    const checkoutUrl = user?.id
        ? `${BASE_CHECKOUT_URL}?checkout[custom][user_id]=${user.id}`
        : BASE_CHECKOUT_URL;

    const features = [
        { name: "Projets illimités", free: false, pro: true },
        { name: "Assistant IA (200 msg/jour)", free: false, pro: true },
        { name: "E-signature (Phase 2)", free: false, pro: true },
        { name: "Export PDF Personnalisé", free: true, pro: true },
        { name: "Gestion Clients & Catalogue", free: true, pro: true },
        { name: "Support Prioritaire", free: false, pro: true },
    ];

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl mb-4 text-balance">
                    Propulsez votre activité de Freelance
                </h2>
                <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                    Choisissez le plan qui correspond à vos ambitions. Passez au Pro pour débloquer toute la puissance de Prezta.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Plan Gratuit */}
                <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm relative overflow-hidden group hover:border-[var(--border-strong)] transition-all">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Gratuit</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-[var(--text-primary)]">0€</span>
                            <span className="text-[var(--text-muted)]">/mois</span>
                        </div>
                        <p className="mt-4 text-sm text-[var(--text-secondary)]">
                            L'essentiel pour débuter votre activité sereinement.
                        </p>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                                {f.free ? (
                                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border border-[var(--border)] shrink-0" />
                                )}
                                <span className={f.free ? "text-[var(--text-secondary)]" : "text-[var(--text-disabled)] line-through"}>
                                    {f.name}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <Button
                        variant="outline"
                        className="w-full rounded-xl py-6 border-[var(--border-strong)] text-[var(--text-primary)] font-bold cursor-default opacity-50"
                        disabled
                    >
                        Plan Actuel
                    </Button>
                </div>

                {/* Plan Pro */}
                <div className="bg-white rounded-3xl border-2 border-[var(--brand)] p-8 shadow-xl relative overflow-hidden group transform hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 right-0 bg-[var(--brand)] text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                        Recommandé
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-[var(--brand)] font-bold mb-2 uppercase text-xs tracking-wider">
                            <Sparkles className="h-4 w-4" />
                            Prezta Pro
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-[var(--text-primary)]">14€</span>
                            <span className="text-[var(--text-muted)]">/mois</span>
                        </div>
                        <p className="mt-4 text-sm text-[var(--text-secondary)] font-medium">
                            La solution complète pour les freelances qui veulent scaler.
                        </p>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                                <Check className="h-5 w-5 text-[var(--brand)] shrink-0" />
                                <span className="text-[var(--text-primary)] font-medium">
                                    {f.name}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {isPro ? (
                        <div className="bg-[var(--brand-light)] text-[var(--brand)] p-4 rounded-xl text-center font-bold text-sm">
                            Vous êtes déjà membre PRO 🎉
                        </div>
                    ) : (
                        <Button
                            asChild
                            className="w-full rounded-xl py-6 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold shadow-lg shadow-blue-200"
                        >
                            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                                Passer au Pro
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}

                    <p className="text-[10px] text-center text-[var(--text-muted)] mt-4">
                        Paiement sécurisé via Lemon Squeezy. Annulable à tout moment.
                    </p>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-20 flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="font-bold text-sm">Paiement Instantané</span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-bold text-sm">Données Sécurisées</span>
                </div>
                <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span className="font-bold text-sm">Sans Engagement</span>
                </div>
            </div>
        </div>
    );
}
