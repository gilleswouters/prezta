import { useState, useEffect } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectDashboardModal } from '@/components/projects/ProjectDashboardModal';
import { ProjectEditModal } from '@/components/projects/ProjectEditModal';
import { ProjectContractsModal } from '@/components/contracts/ProjectContractsModal';
import type { ProjectWithClient } from '@/types/project';
import {
    AlertCircle,
    FolderKanban,
    AlertTriangle,
    ArrowRight,
    X,
    UserCircle,
    Euro,
    TrendingUp,
} from 'lucide-react';
import { KanbanBoard } from '@/components/planning/KanbanBoard';
import { BanniereDemarrage } from '@/components/onboarding/BanniereDemarrage';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { PageHeader } from '@/components/layout/PageHeader';
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
    useEffect(() => { document.title = 'Tableau de bord · Prezta'; }, []);

    const firstName =
        profile?.full_name?.trim().split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'Freelance';

    // Show profile nudge when profile is loaded but onboarding not completed, or key fields missing
    const onboardingIncomplete = profile?.onboarding_completed === false
    const showProfileNudge =
        !profileLoading &&
        !profileBannerDismissed &&
        (onboardingIncomplete || !profile?.full_name || !profile?.legal_status);

    const kpi                = data?.kpi;
    const overdueInvoices    = data?.overdueInvoices    ?? [];
    const unsignedContracts  = data?.unsignedContracts  ?? [];
    const urgentTasks        = data?.urgentTasks        ?? [];
    const overdueTasks       = data?.overdueTasks       ?? [];
    const recentProjects     = data?.recentProjects     ?? [];
    const staleSignedDocs    = data?.staleSignedDocs    ?? [];
    const viewedQuotes       = data?.viewedQuotes       ?? [];
    const expiringContracts  = data?.expiringContracts  ?? [];

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
                title: `Document en attente : ${c.projectName || c.title}`,
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
            title: `⚠ Document expire dans ${c.daysUntilExpiry}j : ${c.title}`,
            desc: `Projet : ${c.projectName || 'Sans projet'} — Renouvelez ou archivez`,
            badge: 'Urgent',
            variant: 'danger' as const,
            onClick: () => goToProject(c.projectId),
        })),
        ...expiringContracts.filter(c => c.daysUntilExpiry > 7).map(c => ({
            id: `expiry-${c.id}`,
            title: `Document expire bientôt : ${c.title}`,
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
        <div>
            <PageHeader
                title="Tableau de bord"
                color="violet"
                subtitle={`Bonjour ${firstName} — ${format(new Date(), 'MMMM yyyy', { locale: fr })}`}
            />

            <div className="space-y-8">

            {/* Onboarding checklist — disparaît quand tout est coché ou ignoré */}
            <OnboardingChecklist />

            {/* Profile completion nudge */}
            {showProfileNudge && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    <UserCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="flex-1">
                        Complétez votre profil pour accéder à toutes les fonctionnalités.{' '}
                        <button
                            onClick={() => navigate(onboardingIncomplete ? '/onboarding' : '/profil')}
                            className="font-bold underline hover:text-amber-900"
                        >
                            {onboardingIncomplete ? 'Compléter la configuration →' : 'Compléter mon profil →'}
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

            {/* Onboarding — guide le flux catalogue → devis → facture */}
            <BanniereDemarrage />

            {/* MetricCards × 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="metric-card metric-neutral space-y-3">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-7 w-20" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))
                ) : (<>
                <StatCard
                    label="À ENCAISSER"
                    value={`${(kpi?.pendingAmount ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                    sub="Factures en attente de paiement"
                    icon={<Euro className="h-4 w-4 text-[var(--color-amber-accent)]" />}
                    metricColor="amber"
                />
                <StatCard
                    label="FACTURES EN RETARD"
                    value={kpi?.overdueInvoicesCount ?? 0}
                    sub={(kpi?.overdueInvoicesCount ?? 0) === 0 ? 'Aucune facture en retard' : 'Non réglées à échéance'}
                    icon={<AlertTriangle className="h-4 w-4" style={{ color: (kpi?.overdueInvoicesCount ?? 0) > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }} />}
                    metricColor={(kpi?.overdueInvoicesCount ?? 0) > 0 ? 'danger' : 'success'}
                    valueColor={(kpi?.overdueInvoicesCount ?? 0) > 0 ? 'text-[var(--color-danger-text)]' : undefined}
                />
                <StatCard
                    label="PROJETS ACTIFS"
                    value={kpi?.activeProjectsCount ?? 0}
                    sub="Missions en cours de réalisation"
                    icon={<FolderKanban className="h-4 w-4 text-[var(--color-text-3)]" />}
                    metricColor="neutral"
                />
                <StatCard
                    label="RECOUVREMENT"
                    value={`${kpi?.recoveryRate ?? 100} %`}
                    sub="Factures payées vs émises"
                    icon={<TrendingUp className="h-4 w-4 text-[var(--color-teal-accent)]" />}
                    metricColor="teal"
                />
                </>)}
            </div>

            {/* Actions Requises — visible only when there are items */}
            {!isLoading && requiredActions.length > 0 && (
                <div className="bg-white border border-[var(--color-border-1)] rounded-xl overflow-hidden" style={{ borderLeft: '3px solid var(--color-danger-text)' }}>
                    <div className="px-5 py-3 border-b border-[var(--color-border-1)] flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-[var(--color-danger-text)] shrink-0" />
                        <span className="section-label" style={{ marginBottom: 0 }}>
                            {requiredActions.length} action{requiredActions.length > 1 ? 's' : ''} requise{requiredActions.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="divide-y divide-[var(--color-border-1)]">
                        {requiredActions.map((action) => (
                            <div
                                key={action.id}
                                onClick={action.onClick}
                                className="px-5 py-3 flex items-center justify-between hover:bg-[var(--color-bg-2)] transition-colors cursor-pointer group"
                            >
                                <div className="pr-4 min-w-0">
                                    <p className="text-xs font-semibold text-[var(--color-text-1)] leading-tight truncate">{action.title}</p>
                                    <p className="text-[11px] text-[var(--color-text-3)] mt-0.5 truncate">{action.desc}</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={action.variant === 'danger' ? 'destructive' : 'outline'}
                                    className="text-[11px] h-7 px-2 shrink-0"
                                >
                                    {action.badge}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Kanban Planning */}
            <div className="bg-white border border-[var(--color-border-1)] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--color-border-1)] flex items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 text-[var(--color-text-3)] shrink-0" />
                    <span className="section-label" style={{ marginBottom: 0 }}>Planning</span>
                </div>
                <div className="p-4">
                    <KanbanBoard />
                </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-white border border-[var(--color-border-1)] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--color-border-1)] flex items-center justify-between">
                    <span className="section-label" style={{ marginBottom: 0 }}>Projets récents</span>
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-[var(--color-text-2)] hover:text-[var(--color-text-1)]" onClick={() => navigate('/projets')}>
                        Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
                <div className="divide-y divide-[var(--color-border-1)]">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="px-2 py-1 space-y-1.5">
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            ))}
                        </div>
                    ) : recentProjects.length > 0 ? (
                        recentProjects.map((project) => (
                            <div
                                key={project.id}
                                className="px-5 py-3 bg-white hover:bg-[var(--color-bg-2)] transition-colors cursor-pointer group"
                                onClick={() => openProjectModal(project.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-[var(--color-text-1)] group-hover:text-[var(--color-text-1)] truncate pr-2">{project.name}</p>
                                    <StatusBadge status={project.status} />
                                </div>
                                <p className="text-[11px] text-[var(--color-text-3)] mt-0.5">{project.clientName || 'Sans client'}</p>
                            </div>
                        ))
                    ) : (
                        <div className="px-5 py-6 text-center text-[var(--color-text-3)] text-xs">
                            Aucun projet récent.
                        </div>
                    )}
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
            </div>{/* end space-y-8 */}
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
    label, value, sub, icon,
    valueColor = 'text-[var(--color-text-1)]',
    metricColor,
}: {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
    valueColor?: string;
    metricColor?: 'amber' | 'blue' | 'teal' | 'rose' | 'neutral' | 'danger' | 'success';
}) {
    return (
        <div className={`metric-card ${metricColor ? `metric-${metricColor}` : 'metric-neutral'}`}>
            <div className="flex items-start justify-between mb-3">
                <span className="section-label" style={{ marginBottom: 0 }}>{label}</span>
                <div className="h-7 w-7 bg-[var(--color-bg-2)] rounded-[var(--radius-sm)] flex items-center justify-center shrink-0">
                    {icon}
                </div>
            </div>
            <div className={`font-[var(--font-heavy)] tracking-tight leading-none mb-1.5 ${valueColor}`} style={{ fontSize: 'var(--text-22)' }}>{value}</div>
            <div className="text-[var(--color-text-3)]" style={{ fontSize: 'var(--text-11)' }}>{sub}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        in_progress: 'bg-[var(--color-bg-2)] text-[var(--color-text-2)] border-[var(--color-border-1)]',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        draft: 'bg-gray-100 text-gray-500 border-gray-200',
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
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${variants[status] || variants.draft}`}>
            {labels[status] || status}
        </span>
    );
}
