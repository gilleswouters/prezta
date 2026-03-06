import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const BASE_CHECKOUT_URL = "https://prezta.lemonsqueezy.com/checkout/buy/912fdc98-0a1e-40de-95c8-ffde04fab2a1";

export default function PricingPage() {
    const { data: subscription } = useSubscription();
    const isPro = subscription?.isPro;

    const checkoutUrl = BASE_CHECKOUT_URL;

    const features = [
        { name: "Projets illimités" },
        { name: "Assistant IA (200 msg/jour)" },
        { name: "E-signature Firma.dev incluse" },
        { name: "Export PDF Personnalisé" },
        { name: "Gestion Clients & Catalogue" },
        { name: "Support Prioritaire" },
    ];

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl mb-4 text-balance">
                    Propulsez votre activité de Freelance
                </h2>
                <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                    Abonnez-vous pour débloquer toute la puissance de Prezta et gérer vos projets sans limite.
                </p>
            </div>

            <div className="flex justify-center items-start">
                {/* Plan Unique */}
                <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[var(--brand)] p-8 shadow-xl relative overflow-hidden group transform hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 right-0 bg-[var(--brand)] text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                        L'unique abonnement
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-[var(--brand)] font-bold mb-2 uppercase text-xs tracking-wider">
                            <Sparkles className="h-4 w-4" />
                            Membre Prezta
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
                            Vous êtes déjà membre PREZTA 🎉
                        </div>
                    ) : (
                        <Button
                            asChild
                            className="w-full rounded-xl py-6 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold shadow-lg shadow-blue-200"
                        >
                            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                                S'abonner
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
