import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { ProjectDashboardModal } from '@/components/projects/ProjectDashboardModal';
import { ProjectEditModal } from '@/components/projects/ProjectEditModal';
import { ProjectContractsModal } from '@/components/contracts/ProjectContractsModal';
import type { ProjectWithClient } from '@/types/project';
import {
    AlertCircle,
    FolderKanban,
    FileSignature,
    AlertTriangle,
    Clock,
    ArrowRight,
    CheckCircle2,
    X,
    UserCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data, isLoading } = useDashboard();
    const { data: allProjects } = useProjects();
    const { data: profile, isLoading: profileLoading } = useProfile();

    const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectWithClient | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [contractsModalOpen, setContractsModalOpen] = useState(false);
    const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);

    const openProjectModal = (projectId: string) => {
        const found = allProjects?.find(p => p.id === projectId) ?? null;
        if (found) {
            setSelectedProject(found);
            setDashboardModalOpen(true);
        }
    };

    // First name: full_name first word → email prefix → fallback
    const firstName =
        profile?.full_name?.trim().split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'Freelance';

    // Show profile nudge when profile is loaded but incomplete
    const showProfileNudge =
        !profileLoading &&
        !profileBannerDismissed &&
        (!profile?.full_name || !profile?.legal_status);

    if (isLoading || !data) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-gray-100 rounded-xl"></div>
                    <div className="h-80 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    const { kpi, overdueInvoices, unsignedContracts, urgentTasks, overdueTasks, recentProjects, staleSignedDocs, viewedQuotes, expiringContracts } = data;

    // Build the "Actions Requises" list from hook data
    type ActionItem = {
        id: string;
        title: string;
        desc: string;
        badge: string;
        variant: 'danger' | 'warning' | 'info';
        onClick: () => void;
    };

    const goToProject = (projectId: string | null) =>
        navigate(projectId ? `/projets?open=${projectId}` : '/projets');

    const requiredActions: ActionItem[] = [
        ...overdueInvoices.map(inv => ({
            id: inv.id,
            title: `Facture impayée : ${inv.projectName || 'Client'}`,
            desc: `${Number(inv.amount).toLocaleString('fr-FR')} € — Éch. ${format(parseISO(inv.due_date), 'dd MMM', { locale: fr })}`,
            badge: 'Relancer',
            variant: 'danger' as const,
            onClick: () => navigate('/registre'),
        })),
        ...staleSignedDocs.map(doc => ({
            id: doc.id,
            title: `En attente de signature : ${doc.title}`,
            desc: `Envoyé il y a ${doc.daysSinceSent} jour${doc.daysSinceSent > 1 ? 's' : ''} — ${doc.projectName || 'Sans projet'}`,
            badge: 'Relancer',
            variant: 'warning' as const,
            onClick: () => goToProject(doc.projectId),
        })),
        ...unsignedContracts
            .filter(c => !staleSignedDocs.find(s => s.id === c.id))
            .map(c => ({
                id: c.id,
                title: `Contrat en attente : ${c.projectName || c.title}`,
                desc: `Envoyé le ${format(parseISO(c.created_at), 'dd MMM', { locale: fr })}`,
                badge: 'À signer',
                variant: 'warning' as const,
                onClick: () => goToProject(c.projectId),
            })),
        ...urgentTasks.map(t => ({
            id: t.id,
            title: t.title,
            desc: `Priorité haute — Éch. ${format(parseISO(t.due_date), 'dd MMM', { locale: fr })}`,
            badge: 'Urgent',
            variant: 'info' as const,
            onClick: () => goToProject(t.projectId),
        })),
        ...overdueTasks
            .filter(t => !urgentTasks.find(u => u.id === t.id))
            .map(t => ({
                id: `overdue-task-${t.id}`,
                title: `Tâche en retard : ${t.title}`,
                desc: `Projet : ${t.projectName || 'Sans projet'} — Éch. ${format(parseISO(t.due_date), 'dd MMM', { locale: fr })}`,
                badge: 'En retard',
                variant: 'danger' as const,
                onClick: () => goToProject(t.projectId),
            })),
        ...expiringContracts.filter(c => c.daysUntilExpiry <= 7).map(c => ({
            id: `expiry-urgent-${c.id}`,
            title: `⚠ Contrat expire dans ${c.daysUntilExpiry}j : ${c.title}`,
            desc: `Projet : ${c.projectName || 'Sans projet'} — Renouvelez ou archivez`,
            badge: 'Urgent',
            variant: 'danger' as const,
            onClick: () => goToProject(c.projectId),
        })),
        ...expiringContracts.filter(c => c.daysUntilExpiry > 7).map(c => ({
            id: `expiry-${c.id}`,
            title: `Contrat expire bientôt : ${c.title}`,
            desc: `Expire dans ${c.daysUntilExpiry} jours — ${c.projectName || 'Sans projet'}`,
            badge: 'J-30',
            variant: 'warning' as const,
            onClick: () => goToProject(c.projectId),
        })),
        ...viewedQuotes.map(q => ({
            id: `viewed-${q.id}`,
            title: `Devis consulté : ${q.projectName || q.title}`,
            desc: `Vu il y a ${q.hoursAgo < 1 ? '< 1h' : `${q.hoursAgo}h`} — Relancez maintenant`,
            badge: 'Relancer',
            variant: 'info' as const,
            onClick: () => goToProject(q.projectId),
        })),
    ].slice(0, 5);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    Bonjour, <span className="capitalize">{firstName}</span> 👋
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-1">
                    Voici votre résumé d'activité pour {format(new Date(), 'MMMM yyyy', { locale: fr })}.
                </p>
            </div>

            {/* Profile completion nudge */}
            {showProfileNudge && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    <UserCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="flex-1">
                        Complétez votre profil pour accéder à toutes les fonctionnalités.{' '}
                        <button
                            onClick={() => navigate('/profil')}
                            className="font-bold underline hover:text-amber-900"
                        >
                            Compléter mon profil →
                        </button>
                    </span>
                    <button
                        onClick={() => setProfileBannerDismissed(true)}
                        className="shrink-0 p-0.5 hover:bg-amber-100 rounded"
                        aria-label="Fermer"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* KPI Grid — 4 operational cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    label="PROJETS ACTIFS"
                    value={kpi.activeProjectsCount}
                    sub={<span className="text-[var(--text-muted)]">En cours de réalisation</span>}
                    icon={<FolderKanban className="h-5 w-5 text-blue-500" />}
                    gradient="from-blue-500/10 to-transparent"
                />
                <StatCard
                    label="DOCS À SIGNER"
                    value={kpi.docsASignerCount}
                    sub={<span className="text-[var(--text-muted)]">Attente signature client</span>}
                    icon={<FileSignature className="h-5 w-5 text-amber-500" />}
                    gradient="from-amber-500/10 to-transparent"
                />
                <StatCard
                    label="TÂCHES EN RETARD"
                    value={overdueTasks.length}
                    sub={<span className="text-[var(--text-muted)]">À traiter en priorité</span>}
                    icon={<Clock className="h-5 w-5 text-red-500" />}
                    valueColor={overdueTasks.length > 0 ? 'text-red-600' : undefined}
                    gradient="from-red-500/10 to-transparent"
                />
                <StatCard
                    label="FACTURES EN RETARD"
                    value={kpi.overdueInvoicesCount}
                    sub={<span className="text-[var(--text-muted)]">Non réglées à échéance</span>}
                    icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
                    valueColor={kpi.overdueInvoicesCount > 0 ? 'text-orange-600' : undefined}
                    gradient="from-orange-500/10 to-transparent"
                />
            </div>

            {/* Actions + Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Actions Requises */}
                <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-400"></div>
                    <div className="px-6 py-5 border-b border-[var(--border)]">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            Actions Requises
                        </h2>
                    </div>
                    <div className="divide-y divide-[var(--border)] bg-gray-50/30">
                        {requiredActions.length > 0 ? (
                            requiredActions.map((action) => (
                                <div
                                    key={action.id}
                                    onClick={action.onClick}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                                >
                                    <div className="pr-4">
                                        <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--brand)] transition-colors">{action.title}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">{action.desc}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={action.variant === 'danger' ? 'destructive' : 'outline'}
                                        className="text-[10px] h-7 px-2 shrink-0"
                                    >
                                        {action.badge}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                Tout est à jour !
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Projects */}
                <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Projets récents
                        </h2>
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-[var(--brand)] hover:text-[var(--brand-hover)]" onClick={() => navigate('/projets')}>
                            Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                        {recentProjects.length > 0 ? (
                            recentProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="px-6 py-3 bg-white hover:bg-[var(--surface)] transition-colors cursor-pointer group"
                                    onClick={() => openProjectModal(project.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate pr-2">{project.name}</p>
                                        <StatusBadge status={project.status} />
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{project.clientName || 'Sans client'}</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                                Aucun projet récent.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Project modals */}
            <ProjectDashboardModal
                open={dashboardModalOpen}
                onOpenChange={setDashboardModalOpen}
                project={selectedProject}
                onEdit={() => {
                    setDashboardModalOpen(false);
                    setEditModalOpen(true);
                }}
                onOpenContracts={() => {
                    setDashboardModalOpen(false);
                    setContractsModalOpen(true);
                }}
            />
            <ProjectEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                project={selectedProject}
            />
            <ProjectContractsModal
                open={contractsModalOpen}
                onOpenChange={setContractsModalOpen}
                project={selectedProject}
            />
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
    label, value, sub, icon,
    valueColor = 'text-[var(--text-primary)]',
    gradient,
}: {
    label: string;
    value: string | number;
    sub: React.ReactNode;
    icon: React.ReactNode;
    valueColor?: string;
    gradient?: string;
}) {
    return (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
            {gradient && (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none transition-opacity group-hover:opacity-100`}></div>
            )}
            <div className="relative z-10 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">{label}</div>
            <div className="relative z-10 flex items-center justify-between mb-2">
                <div className={`text-3xl font-extrabold tracking-tight ${valueColor}`}>{value}</div>
                <div className="h-12 w-12 bg-white/50 backdrop-blur-sm shadow-sm rounded-xl border border-white/20 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <div className="relative z-10 text-[11px] font-medium leading-none">{sub}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        draft: 'bg-amber-50 text-amber-600 border-amber-100',
        cancelled: 'bg-red-50 text-red-600 border-red-100',
        archived: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    const labels: Record<string, string> = {
        in_progress: 'En cours',
        completed: 'Terminé',
        draft: 'Brouillon',
        cancelled: 'Annulé',
        archived: 'Archivé',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${variants[status] || variants.draft}`}>
            {labels[status] || status}
        </span>
    );
}
