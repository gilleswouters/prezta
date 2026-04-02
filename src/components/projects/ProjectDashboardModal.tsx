import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { ProjectWithClient } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectTaskList } from '@/components/tasks/ProjectTaskList';
import { QuickTaskPopup } from '@/components/tasks/QuickTaskPopup';
import { useTasks } from '@/hooks/useTasks';
import { SendForSignatureModal } from '@/components/contracts/SendForSignatureModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LayoutDashboard, FileText, FileSignature, Share2, Pencil, Calendar, FolderKanban, Briefcase, User, Link as LinkIcon, Receipt, Plus, Clock, Download, Archive, Send, AlertCircle, Loader2, Eye, Copy, CheckSquare } from 'lucide-react';
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useQuotesByProject, useDuplicateQuote, useUpdateQuoteStatus, type Quote } from '@/hooks/useQuotes';
import { useProjectContracts } from '@/hooks/useContracts';
import { useInvoices } from '@/hooks/useInvoices';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/plausible';
import { generateDocumentName } from '@/lib/document-naming';
import { PDFDownloadLink, pdf, PDFViewer } from '@react-pdf/renderer';
import { QuotePDFDocument } from '@/components/quotes/pdf/QuotePDFDocument';
import { ContractPDFDocument } from '@/components/contracts/pdf/ContractPDFDocument';
import { InvoicePDFDocument } from '@/components/invoices/pdf/InvoicePDFDocument';
import type { QuoteData, QuoteLine, QuoteTotals } from '@/types/quote';
import type { ProjectContract } from '@/types/contract';
import type { Invoice } from '@/types/invoice';

interface ProjectDashboardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectWithClient | null;
    onEdit: () => void;
    onOpenContracts: () => void;
    defaultTab?: "overview" | "tasks" | "documents" | "quotes";
}

export function ProjectDashboardModal({ open, onOpenChange, project, onEdit, onOpenContracts, defaultTab = "overview" }: ProjectDashboardModalProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState<string>(defaultTab);

    // Fetch all project documents
    const { data: tasks } = useTasks(project?.id);
    const { data: quotes, isLoading: quoteLoading } = useQuotesByProject(project?.id);
    const { data: contracts, isLoading: contractsLoading } = useProjectContracts(project?.id);
    const { data: invoices, isLoading: invoicesLoading } = useInvoices(project?.id);
    const { data: profile } = useProfile();
    const updateQuoteStatus = useUpdateQuoteStatus();
    const duplicateQuote = useDuplicateQuote();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Portal state
    const [isTogglingPortal, setIsTogglingPortal] = React.useState(false);

    // Quick task popup
    const [quickTaskOpen, setQuickTaskOpen] = React.useState(false);

    // Devis tab: FIRMA send — tracks which quote is being sent
    const [quoteSendTarget, setQuoteSendTarget] = React.useState<Quote | null>(null);
    const [quoteSending, setQuoteSending] = React.useState(false);
    const [quoteSignerError, setQuoteSignerError] = React.useState(false);

    // Devis tab: version confirmation dialog
    const [versionConfirmQuote, setVersionConfirmQuote] = React.useState<Quote | null>(null);

    // Document preview dialogs
    const [quotePreviewTarget, setQuotePreviewTarget] = React.useState<Quote | null>(null);
    const [previewContract, setPreviewContract] = React.useState<ProjectContract | null>(null);
    const [previewInvoice, setPreviewInvoice] = React.useState<Invoice | null>(null);

    React.useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    // Combine documents for the pipeline
    const combinedDocuments = React.useMemo(() => {
        type DocEntry = { type: string; id: string; title: string; reference: string; status: string; date: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string };
        const docs: DocEntry[] = [];
        if (quotes && quotes.length > 0) {
            quotes.forEach(q => docs.push({
                type: 'quote',
                id: q.id,
                title: q.version && q.version > 1 ? `${q.title} v${q.version}` : q.title,
                reference: q.reference || 'Nouveau',
                status: q.status || 'draft',
                date: q.created_at,
                icon: FileText,
                color: 'text-orange-600',
                bg: 'bg-orange-100'
            }));
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
            invoices.forEach((i: Invoice) => docs.push({
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
    }, [quotes, contracts, invoices]);

    // ── Devis tab helpers ─────────────────────────────────────────────────────

    function calcQuoteTotals(lines: QuoteLine[]): QuoteTotals {
        const tvaAmounts: Record<string, number> = {};
        let subtotalHT = 0;
        for (const l of lines) {
            const lineHT = (l.quantity || 0) * (l.unitPrice || 0);
            subtotalHT += lineHT;
            const rate = String(l.tvaRate || 0);
            tvaAmounts[rate] = (tvaAmounts[rate] || 0) + lineHT * (l.tvaRate || 0) / 100;
        }
        const totalTVA = Object.values(tvaAmounts).reduce((a, b) => a + b, 0);
        return { subtotalHT, tvaAmounts, totalTVA, totalTTC: subtotalHT + totalTVA };
    }

    const handleRequestQuoteSend = (q: Quote) => {
        if (!project?.clients?.contact_name) {
            setQuoteSignerError(true);
            return;
        }
        setQuoteSignerError(false);
        setQuoteSendTarget(q);
    };

    const handleSendQuoteToFirma = async () => {
        if (!quoteSendTarget) return;
        const quote = quoteSendTarget;
        const toastId = toast.loading('Génération du document (1/2)...');
        setQuoteSending(true);

        const quoteLines: QuoteLine[] = Array.isArray(quote.lines) ? (quote.lines as QuoteLine[]) : [];
        const quoteData: QuoteData = {
            id: quote.id,
            title: quote.title,
            projectId: quote.project_id,
            lines: quoteLines,
            notes: quote.notes ?? '',
            version: quote.version ?? 1,
            created_at: quote.created_at,
        };
        const totals = calcQuoteTotals(quoteLines);

        try {
            const blob = await pdf(
                <QuotePDFDocument data={quoteData} totals={totals} profile={profile ?? null} />
            ).toBlob();

            const reader = new FileReader();
            reader.readAsDataURL(blob);

            reader.onloadend = async () => {
                try {
                    const base64data = reader.result?.toString().split(',')[1];
                    if (!base64data) throw new Error('Erreur de conversion PDF');

                    toast.loading('Envoi sécurisé via Firma.dev (2/2)...', { id: toastId });

                    const clientEmail = project?.clients?.email;
                    if (!clientEmail) throw new Error("Le client n'a pas d'adresse e-mail définie.");

                    const clientName = project!.clients!.contact_name!;

                    const { data: firmaData, error: firmaError } = await supabase.functions.invoke('firma-signature', {
                        headers: {
                            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                        },
                        body: { pdfBase64: base64data, title: quote.title, clientName, clientEmail },
                    });

                    if (firmaError) throw firmaError;

                    const body = firmaData as { firmaId?: string; error?: string } | null;
                    if (body?.error) throw new Error(body.error);

                    await updateQuoteStatus.mutateAsync({
                        id: quote.id,
                        status: 'sent',
                        signatureId: body?.firmaId,
                    });

                    trackEvent('signature_requested');
                    toast.success('Envoyé pour signature avec succès !', { id: toastId });
                    setQuoteSendTarget(null);
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
                    toast.error(message, { id: toastId });
                } finally {
                    setQuoteSending(false);
                }
            };

            reader.onerror = () => {
                toast.error('Erreur de lecture du PDF', { id: toastId });
                setQuoteSending(false);
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
            toast.error(message, { id: toastId });
            setQuoteSending(false);
        }
    };

    const handleTogglePortal = async () => {
        if (!project) return;
        setIsTogglingPortal(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ portal_enabled: !project.portal_enabled })
                .eq('id', project.id);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
        } catch {
            toast.error("Impossible de modifier le portail.");
        } finally {
            setIsTogglingPortal(false);
        }
    };

    const handleResetPortalLink = async () => {
        if (!project) return;
        const newLink = crypto.randomUUID();
        const { error } = await supabase
            .from('projects')
            .update({ portal_link: newLink })
            .eq('id', project.id);
        if (error) {
            toast.error("Impossible de réinitialiser le lien.");
        } else {
            queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
            toast.success("Lien réinitialisé — l'ancien lien ne fonctionne plus.");
        }
    };

    // FIX 7: open version-confirmation dialog for sent/accepted quotes
    const handleModifyQuote = (q: Quote) => {
        if (q.status === 'sent' || q.status === 'lu' || q.status === 'accepted') {
            setVersionConfirmQuote(q);
        } else {
            navigate(`/projets/${project?.id}/devis?q=${q.id}`);
        }
    };

    const handleCreateNewVersion = async () => {
        if (!versionConfirmQuote) return;
        try {
            const newQuote = await duplicateQuote.mutateAsync({ quoteId: versionConfirmQuote.id });
            setVersionConfirmQuote(null);
            toast.success(`Version v${newQuote.version} créée.`);
            navigate(`/projets/${project?.id}/devis?q=${newQuote.id}`);
        } catch {
            // error toast handled in hook
        }
    };

    const handleModifyAnyway = () => {
        if (!versionConfirmQuote) return;
        navigate(`/projets/${project?.id}/devis?q=${versionConfirmQuote.id}`);
        setVersionConfirmQuote(null);
    };

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

    const translateDocStatus = (status: string) => (
        <DocumentStatusBadge status={status} />
    );

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
                                value="quotes"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1"
                            >
                                <FileText className="h-4 w-4 mr-2" /> Devis
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                {/* Card 1 — Détails du projet */}
                                <div className="bg-white rounded-xl border border-border p-4 flex flex-col shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-sm text-text-primary">Détails du projet</h3>
                                        <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 text-text-muted">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-sm text-text-primary line-clamp-4">
                                                {project.description || <span className="italic opacity-50">Aucune description.</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Créé le</p>
                                            <p className="text-sm font-medium flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                                {format(new Date(project.created_at), 'd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 flex gap-2 flex-wrap">
                                        <Button size="sm" variant="outline" onClick={onEdit} className="text-xs">
                                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                            Modifier le projet
                                        </Button>
                                    </div>
                                </div>

                                {/* Card 2 — Ajouter une tâche / prestation */}
                                <div className="bg-white rounded-xl border border-border p-4 flex flex-col shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                            <CheckSquare className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <h3 className="font-bold text-sm text-text-primary">Tâches & Prestations</h3>
                                    </div>
                                    <p className="text-xs text-text-muted flex-1">
                                        Ajoutez une tâche simple ou une prestation facturable directement liée à ce projet.
                                    </p>
                                    <div className="mt-auto pt-4 flex gap-2 flex-wrap">
                                        <Button
                                            size="sm"
                                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                                            onClick={() => setQuickTaskOpen(true)}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                                            Tâche / Prestation
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setActiveTab('tasks')} className="text-xs">
                                            Voir les tâches
                                        </Button>
                                    </div>
                                </div>

                                {/* Card 3 — Portail client */}
                                <div className="bg-white rounded-xl border border-border p-4 flex flex-col shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                            <Share2 className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-text-primary">Portail client</p>
                                            <p className="text-xs text-text-muted truncate">
                                                {project.portal_enabled
                                                    ? (project.portal_expires_at
                                                        ? `Expire le ${format(new Date(project.portal_expires_at), 'd MMM yyyy', { locale: fr })}`
                                                        : 'Accès client actif')
                                                    : 'Désactivé'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={project.portal_enabled ?? false}
                                            onCheckedChange={handleTogglePortal}
                                            disabled={isTogglingPortal}
                                            className="data-[state=checked]:bg-indigo-600 shrink-0"
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted flex-1">
                                        {project.portal_enabled
                                            ? 'Votre client peut consulter les documents partagés via ce lien sécurisé.'
                                            : 'Activez le portail pour partager les documents avec votre client.'}
                                    </p>
                                    <div className="mt-auto pt-4 flex gap-2 flex-wrap">
                                        {project.portal_enabled && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={handleShare} className="text-xs">
                                                    <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                                                    Copier le lien
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={handleResetPortalLink} className="text-xs text-text-muted hover:text-danger">
                                                    Réinitialiser
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Task mini-pipeline below cards */}
                            {tasks && tasks.length > 0 && (() => {
                                const todoTasks = tasks.filter(t => t.status === 'todo');
                                const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'review');
                                const doneTasks = tasks.filter(t => t.status === 'done');
                                return (
                                    <div className="mt-4 bg-white rounded-xl border border-border p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                                                <FolderKanban className="h-4 w-4 text-text-muted" />
                                                Pipeline des tâches
                                            </h3>
                                            <button
                                                onClick={() => setActiveTab('tasks')}
                                                className="text-xs text-brand hover:underline font-medium"
                                            >
                                                Voir tout ({tasks.length})
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'À faire', items: todoTasks, color: 'text-text-muted', dot: 'bg-gray-300' },
                                                { label: 'En cours', items: inProgressTasks, color: 'text-blue-700', dot: 'bg-blue-400' },
                                                { label: 'Terminées', items: doneTasks, color: 'text-emerald-700', dot: 'bg-emerald-400' },
                                            ].map(col => (
                                                <div key={col.label}>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <span className={`h-2 w-2 rounded-full shrink-0 ${col.dot}`} />
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${col.color}`}>
                                                            {col.label} ({col.items.length})
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {col.items.slice(0, 3).map(t => (
                                                            <p key={t.id} className="text-xs text-text-primary truncate bg-surface2/60 rounded px-2 py-1 border border-border/50">
                                                                {t.title}
                                                            </p>
                                                        ))}
                                                        {col.items.length > 3 && (
                                                            <p className="text-[10px] text-text-muted pl-2">+{col.items.length - 3} de plus</p>
                                                        )}
                                                        {col.items.length === 0 && (
                                                            <p className="text-[10px] text-text-muted italic pl-2">Aucune</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </TabsContent>

                        <TabsContent value="tasks" className="m-0 focus-visible:outline-none h-full">
                            <div className="bg-white rounded-xl border border-border shadow-sm min-h-[500px] overflow-hidden">
                                <ProjectTaskList projectId={project.id} />
                            </div>
                        </TabsContent>

                        <TabsContent value="quotes" className="m-0 focus-visible:outline-none">
                            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-text-primary">Devis du projet</h3>
                                        <p className="text-sm text-text-muted">Gérez les versions de devis et leur envoi pour signature.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => navigate(`/projets/${project.id}/devis`)} className="text-brand border-brand/30 hover:bg-brand-light">
                                        <Plus className="h-4 w-4 mr-1" /> Nouveau devis
                                    </Button>
                                </div>

                                {quoteLoading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-text-muted">
                                        <Clock className="h-6 w-6 animate-spin opacity-50 mb-3" />
                                        <p>Chargement...</p>
                                    </div>
                                ) : !quotes || quotes.length === 0 ? (
                                    <div className="py-12 text-center border-2 border-dashed border-border rounded-xl bg-surface/50">
                                        <FileText className="h-10 w-10 text-text-muted opacity-30 mx-auto mb-3" />
                                        <p className="font-semibold text-text-primary mb-1">Aucun devis pour ce projet</p>
                                        <p className="text-sm text-text-muted">Créez un devis pour structurer la mission.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {quotes.map(q => {
                                            const ql: QuoteLine[] = Array.isArray(q.lines) ? (q.lines as QuoteLine[]) : [];
                                            const totals = calcQuoteTotals(ql);
                                            const qd: QuoteData = {
                                                id: q.id,
                                                title: q.title,
                                                projectId: q.project_id,
                                                lines: ql,
                                                notes: q.notes ?? '',
                                                version: q.version ?? 1,
                                                created_at: q.created_at,
                                            };
                                            return (
                                                <div key={q.id} className="border border-border rounded-xl p-4 bg-white shadow-sm">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex-1 space-y-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                                                    v{q.version ?? 1}
                                                                </span>
                                                                <h4 className="font-bold text-text-primary truncate">{q.title}</h4>
                                                                <DocumentStatusBadge status={q.status || 'draft'} />
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-text-muted">
                                                                <span className="font-semibold text-text-primary">{totals.subtotalHT.toFixed(2)} € HT</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {q.created_at ? format(new Date(q.created_at), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-xs text-text-muted hover:text-brand hover:bg-brand-light"
                                                                onClick={() => handleModifyQuote(q)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                                                Modifier
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-xs text-text-muted hover:text-brand hover:bg-brand-light"
                                                                onClick={() => setQuotePreviewTarget(q)}
                                                            >
                                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                                Aperçu
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-xs text-text-muted hover:text-brand hover:bg-brand-light"
                                                                disabled={duplicateQuote.isPending}
                                                                onClick={() => duplicateQuote.mutate({ quoteId: q.id })}
                                                            >
                                                                <Copy className="h-3.5 w-3.5 mr-1" />
                                                                Dupliquer
                                                            </Button>
                                                            <PDFDownloadLink
                                                                document={<QuotePDFDocument data={qd} totals={totals} profile={profile ?? null} />}
                                                                fileName={generateDocumentName('Devis', project.clients?.name || 'CLIENT', q.created_at || new Date().toISOString(), q.version ?? 1)}
                                                                className="inline-flex items-center gap-1 text-xs font-semibold h-8 px-2.5 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary"
                                                            >
                                                                {({ loading }) => (
                                                                    <>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF</>
                                                                )}
                                                            </PDFDownloadLink>
                                                            {q.status !== 'archived' && q.status !== 'accepted' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={quoteSending}
                                                                    onClick={() => handleRequestQuoteSend(q)}
                                                                    className="h-8 text-xs font-semibold text-brand border-brand/30 hover:bg-brand-light"
                                                                >
                                                                    {quoteSending && quoteSendTarget?.id === q.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                                    ) : (
                                                                        <Send className="h-3.5 w-3.5 mr-1" />
                                                                    )}
                                                                    Signer
                                                                </Button>
                                                            )}
                                                            {q.status !== 'archived' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => updateQuoteStatus.mutate({ id: q.id, status: 'archived' })}
                                                                    className="h-8 text-xs text-text-muted hover:text-danger hover:bg-danger-light"
                                                                >
                                                                    <Archive className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {quoteSignerError && quoteSendTarget?.id === q.id && (
                                                        <div className="mt-3 flex items-center gap-2 text-xs text-danger bg-danger-light/40 border border-danger/20 rounded-lg px-3 py-2">
                                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                            Ajoutez le nom du signataire dans la fiche client avant d'envoyer.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* FIX 7: Version confirmation dialog */}
                            <Dialog open={!!versionConfirmQuote} onOpenChange={(open) => !open && setVersionConfirmQuote(null)}>
                                <DialogContent className="sm:max-w-[420px] bg-white border-border rounded-2xl p-6">
                                    <DialogTitle className="text-base font-bold text-text-primary">Devis déjà envoyé</DialogTitle>
                                    <DialogDescription className="text-sm text-text-muted mt-1">
                                        Ce devis a déjà été envoyé au client. Pour préserver la traçabilité, créez une nouvelle version.
                                    </DialogDescription>
                                    <div className="flex flex-col gap-2 mt-4">
                                        <Button
                                            onClick={handleCreateNewVersion}
                                            disabled={duplicateQuote.isPending}
                                            className="bg-brand text-white hover:bg-brand-hover"
                                        >
                                            {duplicateQuote.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Copy className="h-4 w-4 mr-2" />
                                            )}
                                            Créer v{(versionConfirmQuote?.version ?? 1) + 1} (recommandé)
                                        </Button>
                                        <Button variant="outline" onClick={handleModifyAnyway} className="text-text-muted">
                                            Modifier quand même
                                        </Button>
                                        <Button variant="ghost" onClick={() => setVersionConfirmQuote(null)} className="text-text-muted">
                                            Annuler
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <SendForSignatureModal
                                open={!!quoteSendTarget}
                                onOpenChange={(open) => !open && setQuoteSendTarget(null)}
                                signerName={project?.clients?.contact_name ?? ''}
                                signerEmail={project?.clients?.email ?? ''}
                                documentTitle={quoteSendTarget?.title ?? ''}
                                documentType="Devis"
                                onConfirm={handleSendQuoteToFirma}
                            />

                            {/* Quote PDF preview dialog */}
                            {quotePreviewTarget && (() => {
                                const ql: QuoteLine[] = Array.isArray(quotePreviewTarget.lines) ? (quotePreviewTarget.lines as QuoteLine[]) : [];
                                const qt = calcQuoteTotals(ql);
                                const qd: QuoteData = { id: quotePreviewTarget.id, title: quotePreviewTarget.title, projectId: quotePreviewTarget.project_id, lines: ql, notes: quotePreviewTarget.notes ?? '', version: quotePreviewTarget.version ?? 1, created_at: quotePreviewTarget.created_at };
                                return (
                                    <Dialog open={!!quotePreviewTarget} onOpenChange={(open) => !open && setQuotePreviewTarget(null)}>
                                        <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                                            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                                                <DialogTitle className="font-serif text-lg truncate pr-4">{quotePreviewTarget.title} v{quotePreviewTarget.version ?? 1}</DialogTitle>
                                                <PDFDownloadLink
                                                    document={<QuotePDFDocument data={qd} totals={qt} profile={profile ?? null} />}
                                                    fileName={generateDocumentName('Devis', project.clients?.name || 'CLIENT', quotePreviewTarget.created_at || new Date().toISOString(), quotePreviewTarget.version ?? 1)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary shrink-0"
                                                >
                                                    {({ loading }) => (<>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Télécharger PDF</>)}
                                                </PDFDownloadLink>
                                            </div>
                                            <div className="flex-1 min-h-0">
                                                <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                                                    <QuotePDFDocument data={qd} totals={qt} profile={profile ?? null} />
                                                </PDFViewer>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                );
                            })()}
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
                                                                {translateDocStatus(doc.status)}
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

                                                        <div className="flex-shrink-0 flex gap-1">
                                                            {doc.type === 'contract' && (() => {
                                                                const c = contracts?.find(x => x.id === doc.id) ?? null;
                                                                return c ? (
                                                                    <Button size="sm" variant="ghost" className="h-8 text-text-muted hover:text-brand hover:bg-brand-light" onClick={() => setPreviewContract(c)}>
                                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                                        Aperçu
                                                                    </Button>
                                                                ) : null;
                                                            })()}
                                                            {doc.type === 'invoice' && (() => {
                                                                const inv = invoices?.find((x: Invoice) => x.id === doc.id) ?? null;
                                                                return inv ? (
                                                                    <Button size="sm" variant="ghost" className="h-8 text-text-muted hover:text-brand hover:bg-brand-light" onClick={() => setPreviewInvoice(inv)}>
                                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                                        Aperçu
                                                                    </Button>
                                                                ) : null;
                                                            })()}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 hover:bg-surface border border-transparent hover:border-border"
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

            {/* Quick Task Popup */}
            {project && (
                <QuickTaskPopup
                    open={quickTaskOpen}
                    onOpenChange={setQuickTaskOpen}
                    projectId={project.id}
                />
            )}

            {/* Contract PDF preview dialog */}
            <Dialog open={!!previewContract} onOpenChange={(open) => !open && setPreviewContract(null)}>
                <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                        <DialogTitle className="font-serif text-lg truncate pr-4">{previewContract?.title}</DialogTitle>
                        {previewContract && (
                            <PDFDownloadLink
                                document={<ContractPDFDocument contract={previewContract} profile={profile ?? null} clientName={project?.clients?.name} />}
                                fileName={generateDocumentName('Contrat-prestation', project?.clients?.name || 'CLIENT', previewContract.created_at, previewContract.version ?? 1)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary shrink-0"
                            >
                                {({ loading }) => (<>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Télécharger PDF</>)}
                            </PDFDownloadLink>
                        )}
                    </div>
                    <div className="flex-1 min-h-0">
                        {previewContract && (
                            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                                <ContractPDFDocument contract={previewContract} profile={profile ?? null} clientName={project?.clients?.name} />
                            </PDFViewer>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invoice PDF preview dialog */}
            <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
                <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                        <DialogTitle className="font-serif text-lg truncate pr-4">
                            {previewInvoice ? (previewInvoice.notes ? `Facture — ${previewInvoice.notes}` : 'Facture') : ''}
                        </DialogTitle>
                        {previewInvoice && (
                            <PDFDownloadLink
                                document={<InvoicePDFDocument invoice={previewInvoice} profile={profile ?? null} />}
                                fileName={generateDocumentName('Facture', project?.clients?.name || 'CLIENT', previewInvoice.created_at, 1)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary shrink-0"
                            >
                                {({ loading }) => (<>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Télécharger PDF</>)}
                            </PDFDownloadLink>
                        )}
                    </div>
                    <div className="flex-1 min-h-0">
                        {previewInvoice && (
                            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                                <InvoicePDFDocument invoice={previewInvoice} profile={profile ?? null} />
                            </PDFViewer>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </Dialog>
    );
}
