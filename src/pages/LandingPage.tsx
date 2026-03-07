import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, FileText, FolderKanban, PenTool, Euro, Sparkles, Globe } from 'lucide-react';

export default function LandingPage() {
    const { session, loading } = useAuth();
    const navigate = useNavigate();

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
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4 tracking-tight">L'unique abonnement</h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">La solution complète pour les freelances qui veulent scaler, sans prise de tête.</p>
                    </div>

                    <div className="flex justify-center items-start">
                        {/* Pro */}
                        <div className="w-full max-w-md bg-white border-2 border-brand rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                                Membre Prezta
                            </div>
                            <h3 className="text-3xl font-bold mb-2 tracking-tight">Prezta Pro</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black">14€</span>
                                <span className="text-text-muted font-medium">/mois</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-text-secondary font-medium">
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand" /> Projets illimités</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand" /> E-signature Firma.dev incluse</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand" /> Assistant IA expert droit FR</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand" /> Recherche INSEE (API SIRENE)</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand" /> Support prioritaire</li>
                            </ul>
                            <Button className="w-full h-14 font-bold bg-brand text-white hover:bg-brand-hover text-lg shadow-md" onClick={() => navigate('/pricing')}>
                                Devenir Membre PRO
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
                    <div className="flex gap-6 text-sm font-semibold text-text-secondary">
                        <a href="#features" className="hover:text-brand">Fonctionnalités</a>
                        <a href="#pricing" className="hover:text-brand">Tarifs</a>
                        <span className="cursor-pointer hover:text-brand" onClick={() => navigate('/login')}>Connexion</span>
                        <span className="cursor-pointer hover:text-brand" onClick={() => navigate('/pricing')}>S'abonner</span>
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
