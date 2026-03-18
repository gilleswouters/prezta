import { useState, useEffect } from 'react';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProjectAlerts } from '@/hooks/useProjectAlerts';
import type { ProjectWithClient } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { ProjectEditModal } from '@/components/projects/ProjectEditModal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { ProjectContractsModal } from '@/components/contracts/ProjectContractsModal';
import { ProjectDashboardModal } from '@/components/projects/ProjectDashboardModal';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Trash2, FolderPlus, CheckCircle2, Clock, FileText, Share2, LayoutDashboard, Pencil, FolderKanban, FileSignature } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectsPage() {
    const { data: projects, isLoading } = useProjects();
    const deleteProject = useDeleteProject();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: projectAlerts } = useProjectAlerts();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectWithClient | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{ id: string, name: string } | null>(null);
    const [contractsModalOpen, setContractsModalOpen] = useState(false);
    const [selectedProjectForContracts, setSelectedProjectForContracts] = useState<ProjectWithClient | null>(null);
    const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
    const [selectedProjectForDashboard, setSelectedProjectForDashboard] = useState<ProjectWithClient | null>(null);
    const [dashboardDefaultTab, setDashboardDefaultTab] = useState<"overview" | "tasks" | "documents">("overview");

    const openDashboard = (project: ProjectWithClient, tab: "overview" | "tasks" | "documents" = "overview") => {
        setSelectedProjectForDashboard(project);
        setDashboardDefaultTab(tab);
        setDashboardModalOpen(true);
    };

    // Deep link: /projets?open=[project_id] → auto-open modal
    const openProjectId = searchParams.get('open');
    useEffect(() => {
        if (!openProjectId || !projects) return;
        const found = projects.find(p => p.id === openProjectId);
        if (found) openDashboard(found);
        // Clean URL param whether or not the project was found
        setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openProjectId, projects]);

    const handleDeleteClick = (id: string, name: string) => {
        setProjectToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (projectToDelete) {
            await deleteProject.mutateAsync(projectToDelete.id);
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case ProjectStatus.COMPLETED: return <CheckCircle2 className="h-4 w-4 text-p1" />;
            case ProjectStatus.IN_PROGRESS: return <Clock className="h-4 w-4 text-p2" />;
            default: return <FileText className="h-4 w-4 text-text-muted" />;
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case ProjectStatus.COMPLETED: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-p1/10 text-p1 border border-p1/20">Terminé</span>;
            case ProjectStatus.IN_PROGRESS: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-p2/10 text-p2 border border-p2/20">En cours</span>;
            case ProjectStatus.CANCELLED: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20">Annulé</span>;
            default: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-surface2 text-text-muted border border-border">Brouillon</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
            </div>
        );
    }

    const isEmpty = projects?.length === 0;

    return (
        <div className="space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-text w-full max-w-sm">Projets</h1>
                    <p className="text-text-muted mt-1">Suivez l'avancement de vos missions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate('/projets/nouveau')} className="bg-p3 text-bg hover:opacity-90">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Projet
                    </Button>
                </div>
            </div>

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-border rounded-lg bg-surface">
                    <div className="bg-surface2 p-4 rounded-full mb-4 ring-1 ring-border shadow-sm">
                        <FolderPlus className="h-10 w-10 text-text-muted" />
                    </div>
                    <h2 className="text-xl font-serif text-text mb-2">Aucun projet en cours</h2>
                    <p className="text-text-muted max-w-md mb-8">
                        Créez votre premier projet via le Wizard pour structurer une mission client, de sa conception à sa facturation.
                    </p>
                    <Button onClick={() => navigate('/projets/nouveau')} className="bg-p3 text-bg hover:opacity-90 h-12">
                        <Plus className="mr-2 h-5 w-5" />
                        Démarrer un projet
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border border-border bg-surface overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="text-text-muted">Nom du projet</TableHead>
                                <TableHead className="text-text-muted hidden md:table-cell">Client</TableHead>
                                <TableHead className="text-text-muted">Statut</TableHead>
                                <TableHead className="text-text-muted hidden sm:table-cell">Documents</TableHead>
                                <TableHead className="text-right text-text-muted">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects?.map((project) => {
                                const docsCount = project.expected_documents?.length || 0;
                                const docsCompleted = project.expected_documents?.filter(d => d.is_completed).length || 0;
                                const alert = projectAlerts?.get(project.id);

                                return (
                                    <TableRow key={project.id} className="border-border hover:bg-surface2/50 transition-colors">
                                        <TableCell>
                                            <StatusIcon status={project.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {alert && (
                                                    <span
                                                        title={`${alert.count} action${alert.count > 1 ? 's' : ''} requise${alert.count > 1 ? 's' : ''}`}
                                                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                                            alert.severity === 'danger'
                                                                ? 'bg-red-500'
                                                                : alert.severity === 'warning'
                                                                ? 'bg-amber-400'
                                                                : 'bg-blue-400'
                                                        }`}
                                                    />
                                                )}
                                                <button
                                                    onClick={() => openDashboard(project)}
                                                    className="font-medium text-text hover:text-[var(--brand)] hover:underline truncate max-w-[180px] sm:max-w-[280px] text-left appearance-none bg-transparent border-none p-0 cursor-pointer"
                                                    title={`Ouvrir ${project.name}`}
                                                >
                                                    {project.name}
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-text-muted">
                                            {project.clients?.name || <span className="italic opacity-50">Inconnu</span>}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={project.status} />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-text-muted text-sm">
                                            {docsCount > 0 ? (
                                                <span className={docsCompleted === docsCount ? "text-p1" : ""}>
                                                    {docsCompleted} / {docsCount}
                                                </span>
                                            ) : (
                                                <span className="opacity-50">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingProject(project); setEditModalOpen(true); }} className="h-8 w-8 text-text-muted hover:text-[var(--brand)] hover:bg-[var(--brand)]/10" title="Modifier">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDashboard(project, "tasks")} className="h-8 w-8 text-text-muted hover:text-[var(--brand)] hover:bg-[var(--brand)]/10 hidden sm:inline-flex" title="Tâches">
                                                    <FolderKanban className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDashboard(project, "documents")} className="h-8 w-8 text-text-muted hover:text-blue-600 hover:bg-blue-50 hidden md:inline-flex" title="Contrats & Devis">
                                                    <FileSignature className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/portal/${project.portal_link}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success("Lien client copié !", { description: "Le lien magique est prêt à être envoyé à votre client." });
                                                    }}
                                                    className="h-8 w-8 text-text-muted hover:text-indigo-600 hover:bg-indigo-50 hidden lg:inline-flex"
                                                    title="Partager le lien client"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openDashboard(project)}
                                                    className="h-8 w-8 text-[var(--brand)] hover:text-white hover:bg-[var(--brand)] transition-colors"
                                                    title="Ouvrir le dossier complet"
                                                >
                                                    <LayoutDashboard className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(project.id, project.name)} className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger-light" title="Supprimer">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ProjectEditModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                project={editingProject}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title="Supprimer le projet"
                description={`Êtes-vous sûr de vouloir supprimer "${projectToDelete?.name}" ? Cette action est irréversible.`}
                isDeleting={deleteProject.isPending}
            />

            <ProjectContractsModal
                open={contractsModalOpen}
                onOpenChange={setContractsModalOpen}
                project={selectedProjectForContracts}
            />

            <ProjectDashboardModal
                open={dashboardModalOpen}
                onOpenChange={setDashboardModalOpen}
                project={selectedProjectForDashboard}
                defaultTab={dashboardDefaultTab}
                onEdit={() => {
                    if (selectedProjectForDashboard) {
                        setEditingProject(selectedProjectForDashboard);
                        setEditModalOpen(true);
                    }
                }}
                onOpenContracts={() => {
                    if (selectedProjectForDashboard) {
                        setSelectedProjectForContracts(selectedProjectForDashboard);
                        setContractsModalOpen(true);
                    }
                }}
            />
        </div>
    );
}
