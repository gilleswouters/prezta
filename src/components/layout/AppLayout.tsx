import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FolderKanban, Users, BookOpen, Receipt, User, Sparkles, Plus, LogOut, Clock, FileText } from 'lucide-react';
import { useState } from 'react';
import { ChatAssistant } from '@/components/ai/ChatAssistant';

export default function AppLayout() {
    const { user, signOut } = useAuth();
    const { data: subscription } = useSubscription();
    const navigate = useNavigate();
    const location = useLocation();
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Map route to title
    const getPageTitle = (pathname: string) => {
        if (pathname === '/dashboard') return 'Tableau de bord';
        if (pathname === '/templates') return 'Modèles de contrats';
        if (pathname.includes('/projets')) return 'Projets';
        if (pathname.includes('/clients')) return 'Clients';
        if (pathname.includes('/catalogue')) return 'Catalogue';
        if (pathname.includes('/registre')) return 'Registre';
        if (pathname.includes('/profil')) return 'Profil';
        return 'Prezta';
    };

    const navItems = [
        {
            group: 'Principal',
            items: [
                { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
                { label: 'Calendrier', path: '/calendrier', icon: <Clock className="h-4 w-4" /> },
                { label: 'Projets', path: '/projets', icon: <FolderKanban className="h-4 w-4" /> },
                { label: 'Clients', path: '/clients', icon: <Users className="h-4 w-4" /> },
            ]
        },
        {
            group: 'Documents',
            items: [
                { label: 'Catalogue', path: '/catalogue', icon: <BookOpen className="h-4 w-4" /> },
                { label: 'Registre', path: '/registre', icon: <Receipt className="h-4 w-4" /> },
                { label: 'Modèles', path: '/templates', icon: <FileText className="h-4 w-4" /> },
            ]
        },
        {
            group: 'Compte',
            items: [
                { label: 'Profil', path: '/profil', icon: <User className="h-4 w-4" /> },
            ]
        }
    ];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-surface text-text-primary">
            {/* Sidebar Fixe */}
            <aside className="w-[240px] flex-shrink-0 flex flex-col justify-between bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-sm">
                <div>
                    {/* Brand */}
                    <div className="px-6 py-6 border-b border-[var(--sidebar-border)] mb-4 shrink-0 flex items-center justify-between">
                        <span className="font-extrabold text-[var(--brand)] text-lg tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
                            Prezta
                        </span>
                        {subscription?.isPro && (
                            <span className="bg-brand-light text-brand text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                PRO
                            </span>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="px-4 space-y-6 flex-1 overflow-y-auto w-full">
                        {navItems.map((group) => (
                            <div key={group.group}>
                                <div className="px-2 mb-2 text-[10px] uppercase tracking-wider text-[var(--text-text-muted)] font-semibold font-mono">
                                    {group.group}
                                </div>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${isActive
                                                    ? 'bg-brand-light text-brand'
                                                    : 'text-text-secondary hover:bg-surface-hover'
                                                }`
                                            }
                                        >
                                            {item.icon}
                                            {item.label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Footer User */}
                <div className="p-4 border-t border-[var(--sidebar-border)] w-full flex items-center justify-between gap-3 shrink-0">
                    <div className="flex-1 flex flex-col overflow-hidden leading-tight">
                        <span className="font-semibold text-[13px] text-[var(--text-primary)] truncate">
                            {user?.email?.split('@')[0] || 'Utilisateur'}
                        </span>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-[10px] font-medium text-[var(--text-muted)] truncate">
                                Membre Prezta
                            </span>
                            {subscription?.isPro && (
                                <span className="bg-[var(--brand-light)] text-[var(--brand)] text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                    PRO
                                </span>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-text-muted)] hover:text-danger hover:bg-[var(--danger-light)] shrink-0" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <main className="flex-1 flex flex-col h-full overflow-hidden w-full bg-[var(--surface)] relative">

                {/* Topbar */}
                <header className="h-[60px] min-h-[60px] bg-white border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0">
                    <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                        {getPageTitle(location.pathname)}
                    </h1>
                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            variant="outline"
                            className="bg-white border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs h-9 font-semibold"
                            onClick={() => setIsChatOpen(true)}
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-2 text-[var(--brand)]" />
                            ✦ Assistant IA
                        </Button>
                        <Button
                            className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] border-none text-xs h-9 font-semibold"
                            onClick={() => navigate('/projets/nouveau')}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Nouveau projet
                        </Button>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 w-full max-w-full relative isolate z-0">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Chat Assistant Overlay */}
            <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
}
