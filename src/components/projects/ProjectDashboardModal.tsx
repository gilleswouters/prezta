import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { ProjectWithClient } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectKanban } from '@/components/tasks/ProjectKanban';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LayoutDashboard, FileText, FileSignature, Share2, Pencil, Calendar, FolderKanban, Briefcase, User, Link as LinkIcon, Receipt, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuoteByProject } from '@/hooks/useQuotes';
import { useProjectContracts } from '@/hooks/useContracts';
import { useInvoices } from '@/hooks/useInvoices';

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

    // Fetch all project documents
    const { data: quote, isLoading: quoteLoading } = useQuoteByProject(project?.id);
    const { data: contracts, isLoading: contractsLoading } = useProjectContracts(project?.id);
    const { data: invoices, isLoading: invoicesLoading } = useInvoices(project?.id);

    React.useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    // Combine documents for the pipeline
    const combinedDocuments = React.useMemo(() => {
        const docs = [];
        if (quote) {
            docs.push({
                type: 'quote',
                id: quote.id,
                title: quote.title,
                reference: quote.reference || 'Nouveau',
                status: quote.status || 'draft',
                date: quote.created_at,
                icon: FileText,
                color: 'text-orange-600',
                bg: 'bg-orange-100'
            });
        }
        if (contracts) {
            contracts.forEach(c => docs.push({
                type: 'contract',
                id: c.id,
                title: c.title,
                reference: c.reference || 'Nouveau',
                status: c.status,
                date: c.created_at,
                icon: FileSignature,
                color: 'text-indigo-600',
                bg: 'bg-indigo-100'
            }));
        }
        if (invoices) {
            invoices.forEach((i: any) => docs.push({
                type: 'invoice',
                id: i.id,
                title: i.notes ? `Facture (${i.notes})` : 'Facture',
                reference: i.reference || 'Nouveau',
                status: i.status,
                date: i.created_at,
                icon: Receipt,
                color: 'text-emerald-600',
                bg: 'bg-emerald-100'
            }));
        }
        // Trier du plus récent au plus ancien
        return docs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }, [quote, contracts, invoices]);

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

    const isLoadingDocs = quoteLoading || contractsLoading || invoicesLoading;
    const hasDocuments = combinedDocuments.length > 0;

    const translateDocStatus = (type: string, status: string) => {
        if (type === 'invoice') {
            switch (status) {
                case 'en_attente': return <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">En attente</span>;
                case 'payé': return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Payé</span>;
                case 'en_retard': return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">En retard</span>;
            }
        }
        if (type === 'contract') {
            switch (status) {
                case 'draft': return <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Brouillon</span>;
                case 'sent': return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Envoyé</span>;
                case 'signed': return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Signé</span>;
            }
        }
        if (type === 'quote') {
            switch (status) {
                case 'draft': return <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Brouillon</span>;
                case 'sent': return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Envoyé</span>;
                case 'accepted': return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Accepté</span>;
                case 'rejected': return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Refusé</span>;
            }
        }
        return <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs uppercase font-bold">{status}</span>;
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
                                <FileText className="h-4 w-4 mr-2" /> Documents & Facturation
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

                        <TabsContent value="documents" className="m-0 focus-visible:outline-none">
                            <div className="bg-white rounded-xl border border-border shadow-sm p-6 overflow-hidden">
                                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-text-primary">Pipeline Documentaire</h3>
                                        <p className="text-sm text-text-muted">Retrouvez l'historique légal et financier lié à ce projet.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => navigate(`/projets/${project.id}/devis`)} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                            <Plus className="h-4 w-4 mr-1" /> Devis / Facture
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={onOpenContracts} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                            <Plus className="h-4 w-4 mr-1" /> Contrat Légal
                                        </Button>
                                    </div>
                                </div>

                                {isLoadingDocs ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-text-muted">
                                        <Clock className="h-8 w-8 animate-spin opacity-50 mb-4" />
                                        <p>Chargement des documents...</p>
                                    </div>
                                ) : !hasDocuments ? (
                                    <div className="py-16 text-center border-2 border-dashed border-border rounded-xl bg-surface/50">
                                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border">
                                            <FileText className="h-8 w-8 text-text-muted" />
                                        </div>
                                        <h4 className="font-bold text-text-primary mb-2">Aucun document généré</h4>
                                        <p className="text-sm text-text-muted max-w-sm mx-auto mb-6">
                                            Commencez par générer un devis ou un contrat légal pour structurer la mission.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-border/50 ml-3 pl-6 space-y-6">
                                        {combinedDocuments.map((doc) => {
                                            const Icon = doc.icon;
                                            return (
                                                <div key={`${doc.type}-${doc.id}`} className="relative group">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[35px] top-1.5 h-6 w-6 rounded-full border-4 border-white ${doc.bg} ${doc.color} flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110`}>
                                                        <Icon className="h-2.5 w-2.5" />
                                                    </div>

                                                    <div className="bg-white border text-left border-border rounded-xl p-4 shadow-sm hover:border-[var(--brand)]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between sm:justify-start gap-4 mb-1">
                                                                <h4 className="font-bold text-text-primary text-base">
                                                                    {doc.title}
                                                                </h4>
                                                                {translateDocStatus(doc.type, doc.status)}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
                                                                <span className="font-mono bg-surface px-2 py-0.5 rounded border border-border/50 font-bold">{doc.reference}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {doc.date ? format(new Date(doc.date), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Non daté'}
                                                                </span>
                                                                <span className="capitalize opacity-60">• {doc.type === 'quote' ? 'Devis' : doc.type === 'contract' ? 'Contrat' : 'Facture'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex-shrink-0">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className={`h-8 hover:bg-surface border border-transparent hover:border-border`}
                                                                onClick={() => {
                                                                    if (doc.type === 'contract') onOpenContracts();
                                                                    else navigate(`/projets/${project.id}/devis`);
                                                                }}
                                                            >
                                                                Gérer <LayoutDashboard className="h-3 w-3 ml-2 opacity-50" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Bottom Fade indicator */}
                                        <div className="absolute -left-[24px] bottom-0 h-10 w-2 bg-gradient-to-t from-white to-transparent" />
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
