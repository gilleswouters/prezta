import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { ProjectWithClient } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectKanban } from '@/components/tasks/ProjectKanban';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LayoutDashboard, FileText, FileSignature, Share2, Pencil, Calendar, FolderKanban, Briefcase, User, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProjectDashboardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectWithClient | null;
    onEdit: () => void;
    onOpenContracts: () => void;
    defaultTab?: "overview" | "tasks" | "documents";
}

export function ProjectDashboardModal({ open, onOpenChange, project, onEdit, onOpenContracts, defaultTab = "overview" }: ProjectDashboardModalProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState<string>(defaultTab);

    React.useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    if (!project) return null;

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case ProjectStatus.COMPLETED: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Terminé</span>;
            case ProjectStatus.IN_PROGRESS: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">En cours</span>;
            case ProjectStatus.CANCELLED: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Annulé</span>;
            default: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Brouillon</span>;
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/portal/${project.portal_link}`;
        navigator.clipboard.writeText(url);
        toast.success("Lien client copié !", { description: "Le lien du portail sécurisé est prêt à être envoyé." });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-[1200px] w-[1200px] h-[90vh] bg-surface flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-2xl border-border">

                {/* Header Section */}
                <div className="px-6 py-4 pr-14 border-b border-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center border border-[var(--brand)]/20 shrink-0">
                            <Briefcase className="h-6 w-6 text-[var(--brand)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-xl font-bold text-text-primary">
                                    {project.name}
                                </DialogTitle>
                                <StatusBadge status={project.status} />
                            </div>
                            <DialogDescription className="text-text-muted mt-1 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {project.clients?.name || 'Client Inconnu'}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleShare} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                            <Share2 className="h-4 w-4 mr-2" />
                            Portail Client
                        </Button>
                        <Button variant="outline" size="sm" onClick={onEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                        </Button>
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2 border-b border-border bg-gray-50/30">
                        <TabsList className="bg-transparent h-auto p-0 space-x-6 border-b-0">
                            <TabsTrigger
                                value="overview"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1"
                            >
                                <LayoutDashboard className="h-4 w-4 mr-2" /> Vue d'ensemble
                            </TabsTrigger>
                            <TabsTrigger
                                value="tasks"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1"
                            >
                                <FolderKanban className="h-4 w-4 mr-2" /> Pipeline des Tâches
                            </TabsTrigger>
                            <TabsTrigger
                                value="documents"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1"
                            >
                                <FileText className="h-4 w-4 mr-2" /> Commercial & Légal
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab Contents */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">

                        <TabsContent value="overview" className="m-0 focus-visible:outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Project Details Card */}
                                <div className="bg-white rounded-xl border border-border p-6 shadow-sm lg:col-span-2">
                                    <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                                        Détails du Projet
                                        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-text-muted">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-sm text-text-primary whitespace-pre-wrap">
                                                {project.description || <span className="italic opacity-50">Aucune description fournie.</span>}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Créé le</p>
                                                <p className="text-sm font-medium flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                                                    {format(new Date(project.created_at), 'd MMMM yyyy', { locale: fr })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Lien Sécurisé</p>
                                                <a href={`/portal/${project.portal_link}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm font-medium flex items-center gap-1.5">
                                                    <LinkIcon className="h-3.5 w-3.5" /> Ouvrir le portail
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions Card */}
                                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4">Actions Rapides</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="h-16 justify-start px-4 hover:border-[var(--brand)] hover:bg-[var(--brand)]/5 group"
                                            onClick={() => navigate(`/projets/${project.id}/devis`)}
                                        >
                                            <div className="bg-[var(--brand)]/10 p-2 rounded-lg mr-3 group-hover:bg-[var(--brand)]/20 transition-colors">
                                                <FileText className="h-5 w-5 text-[var(--brand)]" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-sm">Devis & Factures</div>
                                                <div className="text-[10px] text-text-muted">Gérer la facturation</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="h-16 justify-start px-4 hover:border-blue-500 hover:bg-blue-50 group border-border"
                                            onClick={onOpenContracts}
                                        >
                                            <div className="bg-blue-100 p-2 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                                                <FileSignature className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-sm">Contrats Légaux</div>
                                                <div className="text-[10px] text-text-muted">Générer & Signer</div>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="tasks" className="m-0 focus-visible:outline-none h-full">
                            <div className="bg-white rounded-xl border border-border shadow-sm h-[calc(100%-1rem)] min-h-[500px] overflow-hidden">
                                <ProjectKanban projectId={project.id} />
                            </div>
                        </TabsContent>

                        <TabsContent value="documents" className="m-0 focus-visible:outline-none h-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl border border-[var(--brand)]/10 shadow-sm p-8 pb-10 text-center hover:shadow-md transition-shadow hover:border-[var(--brand)]/30">
                                    <div className="h-20 w-20 bg-[var(--brand)]/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[var(--brand)]/10">
                                        <FileText className="h-10 w-10 text-[var(--brand)]" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Cycle de Facturation</h3>
                                    <p className="text-text-muted text-sm mb-6">
                                        Créez des devis, transformez-les en factures en un clic et suivez les paiements.
                                    </p>
                                    <Button onClick={() => navigate(`/projets/${project.id}/devis`)} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] w-full sm:w-auto">
                                        Accéder à l'éditeur financier
                                    </Button>
                                </div>

                                <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-8 pb-10 text-center hover:shadow-md transition-shadow hover:border-blue-300">
                                    <div className="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
                                        <FileSignature className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Documents Légaux</h3>
                                    <p className="text-text-muted text-sm mb-6">
                                        Générez des contrats personnalisés et envoyez-les pour signature électronique via Firma.dev.
                                    </p>
                                    <Button onClick={onOpenContracts} className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto h-11 px-8 rounded-lg shadow-sm">
                                        Gérer les contrats
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
