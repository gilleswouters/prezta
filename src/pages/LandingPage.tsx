import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, FileText, FolderKanban, PenTool, Euro, Sparkles, Globe, Check, X } from 'lucide-react';

export default function LandingPage() {
    const { session, loading } = useAuth();
    const navigate = useNavigate();
    const [annual, setAnnual] = useState(false);

    if (loading) return null;

    // Redirect if logged in
    if (session) {
        return <Navigate to="/dashboard" replace />;
    }

    const features = [
        {
            icon: <FolderKanban className="h-6 w-6 text-brand" />,
            title: "Projets organisés",
            description: "Wizard en 3 étapes, documents suggérés automatiquement selon votre métier",
        },
        {
            icon: <FileText className="h-6 w-6 text-brand" />,
            title: "Documents légaux",
            description: "Devis, contrats, NDA en français. Mentions légales correctes pour BE, FR et CH",
        },
        {
            icon: <PenTool className="h-6 w-6 text-brand" />,
            title: "E-signature",
            description: "Envoyez pour signature électronique, suivez le statut en temps réel. Valeur légale eIDAS.",
        },
        {
            icon: <Euro className="h-6 w-6 text-brand" />,
            title: "Facturation simple",
            description: "Registre de paiements, relances automatiques, export ZIP pour votre comptable",
        },
        {
            icon: <Sparkles className="h-6 w-6 text-brand" />,
            title: "Assistant IA",
            description: "Générez un devis depuis un brief client. Posez vos questions à votre assistant qui connaît vos données.",
        },
        {
            icon: <Globe className="h-6 w-6 text-brand" />,
            title: "100% Français 🇫🇷",
            description: "Mention CGI art. 293B, RCS, pénalités de retard : vos documents sont toujours légalement irréprochables en France.",
        }
    ];

    return (
        <div className="min-h-screen bg-white text-text-primary selection:bg-brand-light font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-brand text-xl tracking-tight">Prezta</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                        <a href="#features" className="hover:text-brand transition-colors">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-brand transition-colors">Tarifs</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="text-sm font-medium hover:bg-surface-hover" onClick={() => navigate('/login')}>
                            Connexion
                        </Button>
                        <Button className="bg-brand text-white hover:bg-brand-hover text-sm font-semibold" onClick={() => navigate('/pricing')}>
                            S'abonner
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand text-xs font-bold uppercase tracking-wider mb-8">
                    Conçu pour les freelances en France 🇫🇷
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
                    Gérez vos projets, documents et clients en un seul endroit
                </h1>

                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                    Devis, contrats, e-signature, facturation et assistant IA — simple, rapide, légal.
                    Spécialement conçu pour respecter la législation française.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Button size="lg" className="bg-brand text-white hover:bg-brand-hover w-full sm:w-auto h-12 px-8 text-base font-bold shadow-lg shadow-brand/20" onClick={() => navigate('/pricing')}>
                        Tester Prezta dès aujourd'hui
                    </Button>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-border bg-white text-text-secondary hover:bg-surface-hover hover:text-text-primary" onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>
                        Voir les fonctionnalités
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-sm font-bold text-text-muted">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 1 200+ freelances</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 18 000 documents générés</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 4.8/5 satisfaction</div>
                </div>
            </section>

            {/* Features Info */}
            <section id="features" className="py-24 bg-surface px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4 tracking-tight">Tout ce dont vous avez besoin</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-lg">Vos documents structurés sans le désordre habituel des dossiers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 bg-brand-light rounded-lg flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-text-primary tracking-tight">{feature.title}</h3>
                                <p className="text-text-secondary leading-relaxed font-medium">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 bg-white px-6 border-b border-border">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4 tracking-tight">Opérationnel en 5 minutes</h2>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mt-16 max-w-4xl mx-auto">
                        <div className="flex-1 flex flex-col items-center">
                            <div className="h-14 w-14 rounded-full bg-brand text-white flex items-center justify-center text-xl font-black mb-4 shadow-lg shadow-brand/20">1</div>
                            <h4 className="text-lg font-bold mb-2">Créez votre profil</h4>
                            <p className="text-text-secondary text-sm font-medium">vos infos légales, une seule fois</p>
                        </div>
                        <ChevronRight className="hidden md:block h-8 w-8 text-border-strong" />
                        <div className="flex-1 flex flex-col items-center">
                            <div className="h-14 w-14 rounded-full bg-brand text-white flex items-center justify-center text-xl font-black mb-4 shadow-lg shadow-brand/20">2</div>
                            <h4 className="text-lg font-bold mb-2">Ajoutez vos projets</h4>
                            <p className="text-text-secondary text-sm font-medium">clients, documents, catalogue</p>
                        </div>
                        <ChevronRight className="hidden md:block h-8 w-8 text-border-strong" />
                        <div className="flex-1 flex flex-col items-center">
                            <div className="h-14 w-14 rounded-full bg-brand text-white flex items-center justify-center text-xl font-black mb-4 shadow-lg shadow-brand/20">3</div>
                            <h4 className="text-lg font-bold mb-2">Travaillez sereinement</h4>
                            <p className="text-text-secondary text-sm font-medium">tout est organisé, rien n'est oublié</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-24 bg-surface px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4 tracking-tight">Tarifs transparents</h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">Commencez gratuitement, évoluez quand vous êtes prêt.</p>
                    </div>

                    {/* Annual toggle */}
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <span className={`text-sm font-semibold ${!annual ? 'text-text-primary' : 'text-text-muted'}`}>Mensuel</span>
                        <button
                            onClick={() => setAnnual(v => !v)}
                            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${annual ? 'bg-brand' : 'bg-border'}`}
                            aria-label="Basculer annuel / mensuel"
                        >
                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-semibold ${annual ? 'text-text-primary' : 'text-text-muted'}`}>
                            Annuel <span className="text-emerald-600 text-xs font-bold ml-1">−20%</span>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Gratuit */}
                        <div className="rounded-2xl border border-border bg-white p-6 flex flex-col">
                            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Gratuit</p>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-black text-text-primary">0€</span>
                            </div>
                            <p className="text-xs text-text-muted mb-6">14 jours d&apos;essai · sans carte bancaire</p>
                            <ul className="space-y-2 flex-1 mb-8 text-sm">
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />3 projets</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />15 documents actifs</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />500 Mo de stockage</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Devis + factures + contrats PDF</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Templates contrats FR</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Gestion clients + SIRENE</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Tâches + planning</li>
                                <li className="flex items-center gap-2 text-text-muted"><X className="h-4 w-4 shrink-0" />Signatures FIRMA</li>
                                <li className="flex items-center gap-2 text-text-muted"><X className="h-4 w-4 shrink-0" />Fonctionnalités IA</li>
                            </ul>
                            <Button className="w-full bg-text-primary text-white hover:bg-text-primary/90 font-semibold" onClick={() => navigate('/signup')}>
                                Commencer gratuitement
                            </Button>
                        </div>

                        {/* Starter */}
                        <div className="rounded-2xl border border-border bg-white p-6 flex flex-col">
                            <p className="text-xs font-bold uppercase tracking-wider text-brand mb-1">Starter</p>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-black text-text-primary">
                                    {annual ? '7,20€' : '9€'}
                                </span>
                                <span className="text-text-muted text-sm">/mois</span>
                            </div>
                            <p className="text-xs text-text-muted mb-6">
                                {annual ? 'Facturé 86,40€/an' : 'Ou 7,20€/mois · facturé 86,40€/an'}
                            </p>
                            <ul className="space-y-2 flex-1 mb-8 text-sm">
                                <li className="flex items-center gap-2 text-text-muted font-medium"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Tout Gratuit, plus :</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />10 projets</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />50 documents actifs</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />2 Go de stockage</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />3 signatures FIRMA/mois</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Signatures supplémentaires 1€/unité</li>
                                <li className="flex items-center gap-2 text-text-muted"><X className="h-4 w-4 shrink-0" />Fonctionnalités IA</li>
                            </ul>
                            <Button className="w-full bg-text-primary text-white hover:bg-text-primary/90 font-semibold" onClick={() => navigate('/pricing')}>
                                Choisir Starter
                            </Button>
                        </div>

                        {/* Pro */}
                        <div className="rounded-2xl border-2 border-brand bg-white p-6 flex flex-col relative overflow-hidden shadow-lg shadow-blue-100">
                            <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                Recommandé
                            </div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles className="h-3.5 w-3.5 text-brand" />
                                <p className="text-xs font-bold uppercase tracking-wider text-brand">Pro</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-black text-text-primary">
                                    {annual ? '15,20€' : '19€'}
                                </span>
                                <span className="text-text-muted text-sm">/mois</span>
                            </div>
                            <p className="text-xs text-text-muted mb-6">
                                {annual ? 'Facturé 182,40€/an' : 'Ou 15,20€/mois · facturé 182,40€/an'}
                            </p>
                            <ul className="space-y-2 flex-1 mb-8 text-sm">
                                <li className="flex items-center gap-2 text-text-muted font-medium"><Check className="h-4 w-4 text-emerald-500 shrink-0" />Tout Starter, plus :</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" />Projets illimités</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" />Documents illimités</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" />10 Go de stockage</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" />Signatures FIRMA illimitées</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" /><span className="font-semibold">IA complète</span> — clauses, relances, trajets</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" />Portail client · Export comptable ZIP</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" />Alertes expiration · Tracking devis</li>
                                <li className="flex items-center gap-2 text-text-primary"><Check className="h-4 w-4 text-brand shrink-0" />Dashboard revenus · Support prioritaire</li>
                            </ul>
                            <Button className="w-full bg-brand text-white hover:bg-brand-hover font-bold shadow-md shadow-blue-200" onClick={() => navigate('/pricing')}>
                                Choisir Pro
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-border py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="font-extrabold text-brand text-xl tracking-tight mb-2">Prezta</div>
                        <p className="text-sm text-text-muted font-medium">Le workspace pour freelances francophones</p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-text-secondary">
                        <a href="#features" className="hover:text-brand">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-brand">Tarifs</a>
                        <span className="cursor-pointer hover:text-brand" onClick={() => navigate('/login')}>Connexion</span>
                        <a href="mailto:support@prezta.eu" className="hover:text-brand">Support</a>
                        <span className="cursor-pointer hover:text-brand" onClick={() => navigate('/mentions-legales')}>Mentions légales</span>
                        <span className="cursor-pointer hover:text-brand" onClick={() => navigate('/confidentialite')}>Confidentialité</span>
                        <span className="cursor-pointer hover:text-brand" onClick={() => navigate('/cgv')}>CGV</span>
                    </div>
                    <div className="text-xs text-text-muted font-medium text-right">
                        Made in France 🇫🇷 · Données hébergées en Europe<br />
                        © 2026 Prezta
                    </div>
                </div>
            </footer>
        </div>
    );
}
