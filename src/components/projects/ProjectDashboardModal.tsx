import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import type { ProjectWithClient } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectTaskList } from '@/components/tasks/ProjectTaskList';
import { GanttChart } from '@/components/tasks/GanttChart';
import { TaskCreateDialog } from '@/components/tasks/TaskCreateDialog';
import { useTasks } from '@/hooks/useTasks';
import { SendForSignatureModal } from '@/components/contracts/SendForSignatureModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO as parseDateISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, FileSignature, Share2, Pencil, Calendar, FolderKanban, Briefcase, User, Link as LinkIcon, Receipt, Plus, Clock, Download, Archive, Send, AlertCircle, Loader2, Eye, Copy, CheckSquare, X, ChevronLeft, ChevronRight, Layers, FileDown } from 'lucide-react';
import { GenerateDocumentSheet } from '@/components/contracts/GenerateDocumentSheet';
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useQuotesByProject, useDuplicateQuote, useUpdateQuoteStatus, useSaveQuote, type Quote } from '@/hooks/useQuotes';
import { useProjectContracts } from '@/hooks/useContracts';
import { useInvoices } from '@/hooks/useInvoices';
import { useConvertirDevisEnFacture, useFacturesByProject } from '@/hooks/useFactures';
import type { Facture } from '@/types/facture';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/plausible';
import { generateDocumentName } from '@/lib/document-naming';
import { PDFDownloadLink, pdf, PDFViewer } from '@react-pdf/renderer';
import { QuotePDFDocument } from '@/components/quotes/pdf/QuotePDFDocument';
import { ContractPDFDocument } from '@/components/contracts/pdf/ContractPDFDocument';
import { InvoicePDFDocument } from '@/components/invoices/pdf/InvoicePDFDocument';
import { QuoteBuilderModal } from '@/components/quotes/QuoteBuilderModal';
import { ImportTasksModal } from '@/components/quotes/ImportTasksModal';
import type { QuoteData, QuoteLine, QuoteTotals } from '@/types/quote';
import type { ProjectContract } from '@/types/contract';
import type { Invoice } from '@/types/invoice';
import { taskMateriauTotalHT, type TaskMateriau } from '@/types/task-materiau';

interface ProjectDashboardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectWithClient | null;
    onEdit: () => void;
    onOpenContracts: () => void;
    defaultTab?: "overview" | "tasks" | "documents" | "quotes";
}

export function ProjectDashboardModal({ open, onOpenChange, project, onEdit, onOpenContracts, defaultTab = "overview" }: ProjectDashboardModalProps) {
    const [activeTab, setActiveTab] = React.useState<string>(defaultTab);
    const [tasksView, setTasksView] = React.useState<'list' | 'gantt'>('list');
    const [ganttScale, setGanttScale] = React.useState<'day' | 'week' | 'month'>('week');

    // Fetch all project documents
    const { data: tasks, updateTask } = useTasks(project?.id);
    const { data: quotes, isLoading: quoteLoading } = useQuotesByProject(project?.id);
    const { data: contracts, isLoading: contractsLoading } = useProjectContracts(project?.id);
    const { data: invoices, isLoading: invoicesLoading } = useInvoices(project?.id);
    const { data: profile } = useProfile();
    const updateQuoteStatus = useUpdateQuoteStatus();
    const duplicateQuote = useDuplicateQuote();
    const saveQuote = useSaveQuote();
    const convertirDevis = useConvertirDevisEnFacture();
    const { data: facturesDuProjet } = useFacturesByProject(project?.id);
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [convertingQuoteId, setConvertingQuoteId] = React.useState<string | null>(null);
    const [generateDocOpen, setGenerateDocOpen] = React.useState(false);

    // Mini calendar state (for the overview card)
    const [calCardMonth, setCalCardMonth] = React.useState<Date>(new Date());

    // Portal state
    const [isTogglingPortal, setIsTogglingPortal] = React.useState(false);

    // Quick task popup
    const [quickTaskOpen, setQuickTaskOpen] = React.useState(false);

    // Import tâches → devis
    const [importTasksOpen, setImportTasksOpen] = React.useState(false);

    async function handleImportTasks(taskIds: string[]) {
        const currentSelectedIds = new Set(selectedTasks.map(t => t.id));
        const newSelectedIds = new Set(taskIds);
        const toAdd    = taskIds.filter(id => !currentSelectedIds.has(id));
        const toRemove = selectedTasks.filter(t => !newSelectedIds.has(t.id)).map(t => t.id);
        await Promise.all([
            ...toAdd.map(id => updateTask({ id, updates: { inclus_devis: true } })),
            ...toRemove.map(id => updateTask({ id, updates: { inclus_devis: false } })),
        ]);
    }

    // Devis tab: live task selection state (qty + price overrides per task)
    type TaskLineOverride = { qty: number; price: string; unit?: string; tvaRate?: number };
    const [taskLineOverrides, setTaskLineOverrides] = React.useState<Record<string, TaskLineOverride>>({});

    const selectedTasks = React.useMemo(
        () => (tasks ?? []).filter(t => (t.inclus_devis ?? false)),
        [tasks]
    );

    const facturableTasks = React.useMemo(
        () => (tasks ?? []).filter(t => t.facturable && t.prix_estime != null && t.prix_estime > 0),
        [tasks]
    );

    // Fetch task_materiaux for all selected tasks so the Devis tab always shows
    // the real total (labor + materials), regardless of whether prix_total is set in DB.
    const selectedTaskIds = React.useMemo(() => selectedTasks.map(t => t.id), [selectedTasks]);
    const { data: selectedTasksMateriaux } = useQuery({
        queryKey: ['task-materiaux-devis', selectedTaskIds],
        queryFn: async () => {
            if (selectedTaskIds.length === 0) return [];
            const { data, error } = await supabase
                .from('task_materiaux')
                .select('task_id, quantite, prix_unitaire, marge')
                .in('task_id', selectedTaskIds);
            if (error) throw error;
            return data as { task_id: string; quantite: number; prix_unitaire: number; marge: number }[];
        },
        enabled: selectedTaskIds.length > 0,
        staleTime: 30_000,
    });

    // Toggle: show material/sous-traitant breakdown in the devis table + annexe in PDF
    const [showTaskDetail, setShowTaskDetail] = React.useState(false);
    // Toggle: whether the annexe page shows prices of materials/sous-traitants
    const [showMaterialPrices, setShowMaterialPrices] = React.useState(true);

    // Full details query — only triggered when the detail view is open
    const { data: taskMateriauDetails } = useQuery({
        queryKey: ['task-materiaux-detail', selectedTaskIds],
        queryFn: async () => {
            if (selectedTaskIds.length === 0) return [];
            const { data, error } = await supabase
                .from('task_materiaux')
                .select('*')
                .in('task_id', selectedTaskIds)
                .order('created_at');
            if (error) throw error;
            return data as TaskMateriau[];
        },
        enabled: showTaskDetail && selectedTaskIds.length > 0,
        staleTime: 30_000,
    });

    // Materials total per task id (computed from live task_materiaux, not cached prix_total)
    const materiauTotalByTaskId = React.useMemo(() => {
        const map: Record<string, number> = {};
        for (const item of selectedTasksMateriaux ?? []) {
            map[item.task_id] = (map[item.task_id] ?? 0) + taskMateriauTotalHT(item);
        }
        return map;
    }, [selectedTasksMateriaux]);

    const getTaskLine = (task: { id: string; prix_estime?: number | null; quantite_tache?: number | null }): TaskLineOverride => {
        if (taskLineOverrides[task.id]) return taskLineOverrides[task.id];
        // Compute: labor (prix_estime × quantite_tache) + materials total
        const labor = (task.prix_estime ?? 0) * (task.quantite_tache ?? 1);
        const mats = materiauTotalByTaskId[task.id] ?? 0;
        const total = labor + mats;
        return { qty: 1, price: total > 0 ? total.toString() : '0' };
    };

    const handleTaskCreatedWithDevisData = React.useCallback(
        (taskId: string, unit: string, tvaRate: number, prixEstime: number) => {
            setTaskLineOverrides(prev => ({
                ...prev,
                [taskId]: { qty: prev[taskId]?.qty ?? 1, price: prixEstime > 0 ? prixEstime.toString() : (prev[taskId]?.price ?? '0'), unit, tvaRate },
            }));
        },
        []
    );

    // Devis generation preview state (build in-memory, save only on approval)
    const [quoteGeneratePreview, setQuoteGeneratePreview] = React.useState<QuoteData | null>(null);

    const handleGenerateQuote = () => {
        if (!project || !selectedTasks.length) return;
        const maxVer = quotes && quotes.length > 0
            ? Math.max(...quotes.map(q => q.version ?? 0))
            : 0;
        const newVersion = maxVer + 1;

        const lines: QuoteLine[] = selectedTasks.map(t => {
            const lv = getTaskLine(t);
            const mats = showTaskDetail
                ? (taskMateriauDetails ?? []).filter(m => m.task_id === t.id)
                : [];

            // Build sub-lines: labor first, then materials/sous-traitants
            const subLines: import('@/types/quote').QuoteSubLine[] = [];
            if (showTaskDetail) {
                const laborQty = t.quantite_tache ?? 1;
                const laborUnit = lv.unit ?? 'forfait';
                const laborPrice = t.prix_estime ?? 0;
                const laborTotal = laborPrice * laborQty;
                // Always include labor line so the total is traceable
                subLines.push({
                    designation: 'Main d\'œuvre',
                    type: 'main_oeuvre',
                    quantite: laborQty,
                    unite: laborUnit,
                    prix_unitaire: laborPrice,
                    total_ht: laborTotal,
                });
                for (const m of mats) {
                    subLines.push({
                        designation: m.designation,
                        type: m.type,
                        quantite: m.quantite,
                        unite: m.unite,
                        prix_unitaire: m.prix_unitaire,
                        total_ht: taskMateriauTotalHT(m),
                        fournisseur_nom: m.fournisseur_nom,
                    });
                }
            }

            return {
                id: crypto.randomUUID(),
                name: t.title,
                quantity: lv.qty,
                unitPrice: parseFloat(lv.price) || 0,
                tvaRate: lv.tvaRate ?? 20,
                unit: (lv.unit ?? 'forfait') as import('@/types/product').Unit,
                subLines: subLines.length > 0 ? subLines : undefined,
            };
        });

        const hasAnnex = lines.some(l => l.subLines && l.subLines.length > 0);

        setQuoteGeneratePreview({
            title: `Devis v${newVersion} — ${project.name}`,
            projectId: project.id,
            clientName: project.clients?.name ?? undefined,
            clientAddress: project.clients?.address ?? undefined,
            clientEmail: project.clients?.email ?? undefined,
            lines,
            notes: '',
            status: 'draft',
            version: newVersion,
            detailOptions: hasAnnex ? { showMaterialPrices } : undefined,
        });
    };

    const handleConfirmSaveQuote = async () => {
        if (!project || !quoteGeneratePreview) return;
        await saveQuote.mutateAsync({ projectId: project.id, payload: quoteGeneratePreview });
        setQuoteGeneratePreview(null);
    };

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

    // Quote builder modal (inline editor — no navigation)
    const [quoteBuilderQuoteId, setQuoteBuilderQuoteId] = React.useState<string | undefined>(undefined);
    const [quoteBuilderOpen, setQuoteBuilderOpen] = React.useState(false);

    const openQuoteBuilder = (quoteId?: string) => {
        setQuoteBuilderQuoteId(quoteId);
        setQuoteBuilderOpen(true);
    };

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

    async function handleConvertirEnFacture(quoteId: string) {
        setConvertingQuoteId(quoteId);
        try {
            const echeance = new Date();
            echeance.setDate(echeance.getDate() + 30);
            const factureId = await convertirDevis.mutateAsync({
                devisId: quoteId,
                dateEcheance: echeance.toISOString().slice(0, 10),
            });
            navigate(`/factures/${factureId}`);
        } finally {
            setConvertingQuoteId(null);
        }
    }

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
            openQuoteBuilder(q.id);
        }
    };

    const handleCreateNewVersion = async () => {
        if (!versionConfirmQuote) return;
        try {
            const newQuote = await duplicateQuote.mutateAsync({ quoteId: versionConfirmQuote.id });
            setVersionConfirmQuote(null);
            toast.success(`Version v${newQuote.version} créée.`);
            openQuoteBuilder(newQuote.id);
        } catch {
            // error toast handled in hook
        }
    };

    const handleModifyAnyway = () => {
        if (!versionConfirmQuote) return;
        openQuoteBuilder(versionConfirmQuote.id);
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
        <>
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

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-brand/30 text-brand hover:bg-brand-light hover:border-brand/60 shrink-0"
                        onClick={() => setGenerateDocOpen(true)}
                    >
                        <FileDown className="h-4 w-4" />
                        Générer un document
                    </Button>
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
                                <FolderKanban className="h-4 w-4 mr-2" /> Prestations & Frais
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
                                <FileText className="h-4 w-4 mr-2" /> Documents
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
                                            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Description</p>
                                            <p className="text-sm text-text-primary line-clamp-4">
                                                {project.description || <span className="italic opacity-50">Aucune description.</span>}
                                            </p>
                                        </div>

                                        {/* Client info */}
                                        {project.clients && (
                                            <div>
                                                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Client</p>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                                        {project.clients.name}
                                                    </p>
                                                    {project.clients.email && (
                                                        <p className="text-xs text-text-muted pl-5">{project.clients.email}</p>
                                                    )}
                                                    {project.clients.contact_name && (
                                                        <p className="text-xs text-text-muted pl-5">Contact : {project.clients.contact_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Début</p>
                                                <p className="text-sm font-medium flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                                    {project.start_date
                                                        ? format(new Date(project.start_date), 'd MMM yyyy', { locale: fr })
                                                        : <span className="italic text-text-muted opacity-60 text-xs">Non défini</span>}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Deadline</p>
                                                {project.end_date ? (() => {
                                                    const daysLeft = Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000);
                                                    const isUrgent = daysLeft >= 0 && daysLeft <= 7;
                                                    const isOverdue = daysLeft < 0;
                                                    return (
                                                        <div>
                                                            <p className={`text-sm font-medium flex items-center gap-1.5 ${isUrgent ? 'text-amber-600' : isOverdue ? 'text-red-600' : 'text-text-primary'}`}>
                                                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                                {format(new Date(project.end_date), 'd MMM yyyy', { locale: fr })}
                                                            </p>
                                                            <p className={`text-[11px] mt-0.5 font-semibold pl-5 ${isUrgent ? 'text-amber-500' : isOverdue ? 'text-red-500' : 'text-text-muted'}`}>
                                                                {isOverdue ? `En retard de ${Math.abs(daysLeft)}j` : daysLeft === 0 ? "Aujourd'hui !" : `Dans ${daysLeft}j`}
                                                            </p>
                                                        </div>
                                                    );
                                                })() : (
                                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                                        <span className="italic text-text-muted opacity-60 text-xs">Non défini</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Créé le</p>
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

                                {/* Card 2 — Mini calendrier du projet */}
                                {(() => {
                                    // Compute days grid for calCardMonth
                                    const monthStart = startOfMonth(calCardMonth);
                                    const monthEnd = endOfMonth(calCardMonth);
                                    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
                                    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
                                    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

                                    // Collect marked dates
                                    const startD = project.start_date ? parseDateISO(project.start_date) : null;
                                    const endD = project.end_date ? parseDateISO(project.end_date) : null;
                                    const dueDates = (tasks ?? [])
                                        .filter(t => t.due_date && t.status !== 'done')
                                        .map(t => parseDateISO(t.due_date!));
                                    const overdueDates = (tasks ?? [])
                                        .filter(t => t.due_date && t.status !== 'done' && parseDateISO(t.due_date!) < new Date())
                                        .map(t => parseDateISO(t.due_date!));

                                    const isStart = (d: Date) => startD ? isSameDay(d, startD) : false;
                                    const isEnd = (d: Date) => endD ? isSameDay(d, endD) : false;
                                    const hasDue = (d: Date) => dueDates.some(dd => isSameDay(d, dd));
                                    const isOverdue = (d: Date) => overdueDates.some(dd => isSameDay(d, dd));
                                    const isToday = (d: Date) => isSameDay(d, new Date());

                                    return (
                                        <div className="bg-white rounded-xl border border-border p-4 flex flex-col shadow-sm">
                                            {/* Header */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="h-7 w-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                                                    <Calendar className="h-4 w-4 text-sky-600" />
                                                </div>
                                                <h3 className="font-bold text-sm text-text-primary flex-1">Calendrier</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => { onOpenChange(false); navigate(`/calendrier?project=${project.id}`); }}
                                                    className="text-xs text-brand hover:underline font-medium shrink-0"
                                                >
                                                    Voir tout →
                                                </button>
                                            </div>

                                            {/* Month nav */}
                                            <div className="flex items-center justify-between mb-2">
                                                <button type="button" onClick={() => setCalCardMonth(m => subMonths(m, 1))}
                                                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-surface transition-colors text-text-muted hover:text-text-primary">
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </button>
                                                <p className="text-xs font-bold text-text-primary capitalize">
                                                    {format(calCardMonth, 'MMMM yyyy', { locale: fr })}
                                                </p>
                                                <button type="button" onClick={() => setCalCardMonth(m => addMonths(m, 1))}
                                                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-surface transition-colors text-text-muted hover:text-text-primary">
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {/* Day labels */}
                                            <div className="grid grid-cols-7 mb-1">
                                                {['L','M','M','J','V','S','D'].map((d, i) => (
                                                    <div key={i} className="text-center text-[9px] font-bold uppercase tracking-wider text-text-muted py-0.5">
                                                        {d}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Days grid */}
                                            <div className="grid grid-cols-7 gap-y-0.5 flex-1">
                                                {days.map((day, i) => {
                                                    const inMonth = isSameMonth(day, calCardMonth);
                                                    const isStartDay = isStart(day);
                                                    const isEndDay = isEnd(day);
                                                    const hasDueDay = hasDue(day);
                                                    const isOverdueDay = isOverdue(day);
                                                    const isTodayDay = isToday(day);

                                                    let bgClass = '';
                                                    let textClass = inMonth ? 'text-text-primary' : 'text-text-muted opacity-30';
                                                    let ring = '';

                                                    if (isStartDay) { bgClass = 'bg-emerald-100'; textClass = 'text-emerald-700 font-bold'; ring = 'ring-1 ring-emerald-400'; }
                                                    else if (isEndDay) { bgClass = 'bg-red-100'; textClass = 'text-red-700 font-bold'; ring = 'ring-1 ring-red-400'; }
                                                    else if (isTodayDay) { bgClass = 'bg-brand/10'; textClass = 'text-brand font-bold'; ring = 'ring-1 ring-brand/40'; }

                                                    return (
                                                        <div key={i} className="flex flex-col items-center py-0.5">
                                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] transition-colors ${bgClass} ${textClass} ${ring}`}>
                                                                {format(day, 'd')}
                                                            </span>
                                                            {/* Dot for task due date */}
                                                            {hasDueDay && inMonth && (
                                                                <span className={`h-1 w-1 rounded-full mt-0.5 ${isOverdueDay ? 'bg-red-400' : 'bg-brand'}`} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Legend */}
                                            <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap gap-x-3 gap-y-1">
                                                {startD && (
                                                    <span className="flex items-center gap-1 text-[11px] text-text-muted">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                                                        Début
                                                    </span>
                                                )}
                                                {endD && (
                                                    <span className="flex items-center gap-1 text-[11px] text-text-muted">
                                                        <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                                                        Deadline
                                                    </span>
                                                )}
                                                {dueDates.length > 0 && (
                                                    <span className="flex items-center gap-1 text-[11px] text-text-muted">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                                                        Tâches ({dueDates.length})
                                                    </span>
                                                )}
                                                {!startD && !endD && dueDates.length === 0 && (
                                                    <span className="text-[11px] text-text-muted italic">Aucune date définie</span>
                                                )}
                                            </div>

                                            {/* Open calendar CTA */}
                                            <div className="mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full text-xs text-sky-700 border-sky-200 hover:bg-sky-50"
                                                    onClick={() => { onOpenChange(false); navigate(`/calendrier?project=${project.id}`); }}
                                                >
                                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                    Ouvrir le calendrier du projet
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })()}

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

                            {/* Task pipeline — always visible */}
                            <div className="mt-4 bg-white rounded-xl border border-border shadow-sm">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4 text-text-muted" />
                                        Prestations & Frais
                                        {tasks && tasks.length > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-bold">
                                                {tasks.length}
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs bg-brand text-white hover:bg-brand-hover"
                                            onClick={() => setQuickTaskOpen(true)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Nouvelle tâche
                                        </Button>
                                        <button
                                            onClick={() => setActiveTab('tasks')}
                                            className="text-xs text-brand hover:underline font-medium"
                                        >
                                            Voir tout →
                                        </button>
                                    </div>
                                </div>

                                {/* Status columns */}
                                {(() => {
                                    const todoTasks = (tasks ?? []).filter(t => t.status === 'todo');
                                    const inProgressTasks = (tasks ?? []).filter(t => t.status === 'in_progress' || t.status === 'review');
                                    const doneTasks = (tasks ?? []).filter(t => t.status === 'done');
                                    const allEmpty = (tasks ?? []).length === 0;
                                    if (allEmpty) {
                                        return (
                                            <div className="py-10 text-center">
                                                <CheckSquare className="h-8 w-8 text-text-muted opacity-20 mx-auto mb-2" />
                                                <p className="text-sm text-text-muted">Aucune tâche pour ce projet.</p>
                                                <button
                                                    onClick={() => setQuickTaskOpen(true)}
                                                    className="mt-2 text-xs text-brand hover:underline font-medium"
                                                >
                                                    Créer la première tâche
                                                </button>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="grid grid-cols-3 divide-x divide-border">
                                            {[
                                                { label: 'À faire', items: todoTasks, color: 'text-text-muted', dot: 'bg-gray-300', bg: 'bg-gray-50/60' },
                                                { label: 'En cours', items: inProgressTasks, color: 'text-blue-700', dot: 'bg-blue-400', bg: 'bg-blue-50/40' },
                                                { label: 'Terminées', items: doneTasks, color: 'text-emerald-700', dot: 'bg-emerald-400', bg: 'bg-emerald-50/30' },
                                            ].map(col => (
                                                <div key={col.label} className={`p-3 ${col.bg}`}>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <span className={`h-2 w-2 rounded-full shrink-0 ${col.dot}`} />
                                                        <p className={`text-[11px] font-bold uppercase tracking-wider ${col.color}`}>
                                                            {col.label}
                                                            <span className="ml-1 font-normal opacity-70">({col.items.length})</span>
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                                        {col.items.length === 0 ? (
                                                            <p className="text-[11px] text-text-muted italic">Aucune</p>
                                                        ) : col.items.map(t => {
                                                            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
                                                            return (
                                                                <div
                                                                    key={t.id}
                                                                    className="group/chip flex items-start gap-1.5 text-xs rounded-lg px-2 py-1.5 bg-white border border-border/50 hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer"
                                                                    onClick={() => setActiveTab('tasks')}
                                                                >
                                                                    <span className="flex-1 truncate text-text-primary font-medium leading-4">{t.title}</span>
                                                                    {t.priority === 'high' && (
                                                                        <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-red-400 mt-1" title="Priorité haute" />
                                                                    )}
                                                                    {isOverdue && (
                                                                        <AlertCircle className="shrink-0 h-3 w-3 text-red-400 mt-0.5" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </TabsContent>

                        <TabsContent value="tasks" className="m-0 focus-visible:outline-none h-full space-y-3">
                            {/* Sub-menu: Liste / Gantt + granularité */}
                            <div className="flex items-center justify-between">
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {(['list', 'gantt'] as const).map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setTasksView(v)}
                                            style={{
                                                height: 'var(--h-input-sm)',
                                                padding: '0 10px',
                                                background: tasksView === v ? 'var(--p-100)' : 'transparent',
                                                color: tasksView === v ? 'var(--p-900)' : 'var(--color-text-2)',
                                                border: '1px solid var(--color-border-2)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: 'var(--text-11)',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            {v === 'list' ? 'Liste' : 'Gantt'}
                                        </button>
                                    ))}
                                </div>
                                {tasksView === 'gantt' && (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {(['day', 'week', 'month'] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setGanttScale(s)}
                                                style={{
                                                    height: 'var(--h-input-sm)',
                                                    padding: '0 10px',
                                                    background: ganttScale === s ? 'var(--p-100)' : 'transparent',
                                                    color: ganttScale === s ? 'var(--p-900)' : 'var(--color-text-2)',
                                                    border: '1px solid var(--color-border-2)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: 'var(--text-11)',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit',
                                                }}
                                            >
                                                {s === 'day' ? 'Jour' : s === 'week' ? 'Semaine' : 'Mois'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {facturableTasks.length > 0 && (!quotes || quotes.length === 0) && (
                                <div className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
                                    <FileText className="h-4 w-4 text-brand shrink-0" />
                                    <span className="flex-1 text-text-secondary">
                                        {facturableTasks.length} prestation{facturableTasks.length > 1 ? 's' : ''} facturable{facturableTasks.length > 1 ? 's' : ''} sans devis.
                                    </span>
                                    <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => setActiveTab('quotes')}>
                                        Créer un devis
                                    </Button>
                                </div>
                            )}

                            {tasksView === 'list' ? (
                                <div className="bg-white rounded-xl border border-border shadow-sm min-h-[500px] overflow-hidden">
                                    <ProjectTaskList
                                        projectId={project.id}
                                        onTaskCreatedWithDevisData={handleTaskCreatedWithDevisData}
                                    />
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-border shadow-sm p-4">
                                    <GanttChart tasks={tasks ?? []} scale={ganttScale} />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="quotes" className="m-0 focus-visible:outline-none space-y-6">
                            {/* Section 1 — Live selected tasks */}
                            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                                    <div>
                                        <h3 className="font-bold text-base text-text-primary">Tâches sélectionnées pour ce devis</h3>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            Créez des tâches via{' '}
                                            <button type="button" onClick={() => setActiveTab('tasks')} className="text-brand hover:underline font-medium">Prestations & Frais</button>
                                            {' '}→ "Nouvelle tâche" ou "Depuis le catalogue" pour les ajouter ici.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs gap-1 shrink-0 ml-4"
                                        onClick={() => setImportTasksOpen(true)}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Importer des tâches
                                    </Button>
                                    {selectedTasks.length > 0 && (
                                        <div className="flex items-center gap-4 shrink-0 ml-4">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <Switch
                                                    checked={showTaskDetail}
                                                    onCheckedChange={v => {
                                                        setShowTaskDetail(v);
                                                        if (!v) setShowMaterialPrices(true);
                                                    }}
                                                    id="task-detail-toggle"
                                                />
                                                <span className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                                                    <Layers className="h-3.5 w-3.5" />
                                                    Annexe détaillée
                                                </span>
                                            </label>
                                            {showTaskDetail && (
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <Switch
                                                        checked={showMaterialPrices}
                                                        onCheckedChange={setShowMaterialPrices}
                                                        id="material-prices-toggle"
                                                    />
                                                    <span className="text-xs text-text-muted whitespace-nowrap">
                                                        Prix dans l'annexe
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectedTasks.length === 0 ? (
                                    <div className="py-10 text-center border-2 border-dashed border-border rounded-xl bg-surface/50">
                                        <CheckSquare className="h-8 w-8 text-text-muted opacity-20 mx-auto mb-2" />
                                        <p className="font-medium text-text-primary text-sm mb-1">Aucune prestation dans le devis</p>
                                        <p className="text-xs text-text-muted">
                                            Dans l'onglet{' '}
                                            <button type="button" onClick={() => setActiveTab('tasks')} className="text-brand hover:underline font-medium">Prestations & Frais</button>
                                            , cliquez sur "Nouvelle tâche" ou "Depuis le catalogue" et renseignez un prix.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border text-left">
                                                        <th className="pb-2 text-xs font-semibold text-text-muted pr-3">Tâche</th>
                                                        <th className="pb-2 text-xs font-semibold text-text-muted w-16 text-center">Qté</th>
                                                        <th className="pb-2 text-xs font-semibold text-text-muted w-28 text-right">Prix unit. HT</th>
                                                        <th className="pb-2 text-xs font-semibold text-text-muted w-24 text-right">Total HT</th>
                                                        <th className="pb-2 text-xs font-semibold text-text-muted w-32 text-right">TVA</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {selectedTasks.map(t => {
                                                        const lv = getTaskLine(t);
                                                        const totalHT = lv.qty * (parseFloat(lv.price) || 0);
                                                        const matCount = showTaskDetail
                                                            ? (taskMateriauDetails ?? []).filter(m => m.task_id === t.id).length
                                                            : 0;
                                                        return (
                                                            <tr key={t.id} className="hover:bg-surface/50">
                                                                <td className="py-2 pr-3">
                                                                    <p className="font-medium text-text-primary leading-tight">{t.title}</p>
                                                                    {showTaskDetail && (
                                                                        <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                                                                            <Layers className="h-3 w-3" />
                                                                            Annexe : MO{matCount > 0 ? ` + ${matCount} élément${matCount > 1 ? 's' : ''}` : ''}
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={lv.qty}
                                                                        onChange={e => setTaskLineOverrides(prev => ({
                                                                            ...prev,
                                                                            [t.id]: { ...getTaskLine(t), qty: Math.max(1, parseInt(e.target.value) || 1) }
                                                                        }))}
                                                                        className="w-14 h-7 text-center text-xs rounded border border-border bg-white focus:outline-none focus:ring-1 focus:ring-brand/40"
                                                                    />
                                                                </td>
                                                                <td className="py-2 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={lv.price}
                                                                            onChange={e => setTaskLineOverrides(prev => ({
                                                                                ...prev,
                                                                                [t.id]: { ...getTaskLine(t), price: e.target.value }
                                                                            }))}
                                                                            className="w-24 h-7 text-right text-xs rounded border border-border bg-white focus:outline-none focus:ring-1 focus:ring-brand/40 px-2"
                                                                        />
                                                                        <span className="text-xs text-text-muted shrink-0">€</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 text-right text-xs font-semibold text-text-primary">
                                                                    {totalHT.toFixed(2)} €
                                                                </td>
                                                                <td className="py-2 text-right">
                                                                    <select
                                                                        value={lv.tvaRate ?? 20}
                                                                        onChange={e => setTaskLineOverrides(prev => ({
                                                                            ...prev,
                                                                            [t.id]: { ...getTaskLine(t), tvaRate: parseFloat(e.target.value) }
                                                                        }))}
                                                                        className="h-7 text-xs rounded border border-border bg-white focus:outline-none focus:ring-1 focus:ring-brand/40 px-1 pr-6 text-right"
                                                                    >
                                                                        <option value="20">20%</option>
                                                                        <option value="10">10%</option>
                                                                        <option value="5.5">5,5%</option>
                                                                        <option value="2.1">2,1%</option>
                                                                        <option value="0">0%</option>
                                                                        <option value="-1">Exonéré</option>
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Totals */}
                                        {(() => {
                                            const totalHT = selectedTasks.reduce((sum, t) => {
                                                const lv = getTaskLine(t);
                                                return sum + lv.qty * (parseFloat(lv.price) || 0);
                                            }, 0);
                                            const totalTVA = selectedTasks.reduce((sum, t) => {
                                                const lv = getTaskLine(t);
                                                const lineHT = lv.qty * (parseFloat(lv.price) || 0);
                                                const rate = lv.tvaRate ?? 20;
                                                return sum + (rate > 0 ? lineHT * (rate / 100) : 0);
                                            }, 0);
                                            return (
                                                <div className="mt-4 pt-3 border-t border-border space-y-1 text-right text-sm">
                                                    <div className="flex justify-end gap-8">
                                                        <span className="text-text-muted">Total HT</span>
                                                        <span className="font-semibold w-24">{totalHT.toFixed(2)} €</span>
                                                    </div>
                                                    <div className="flex justify-end gap-8">
                                                        <span className="text-text-muted">TVA</span>
                                                        <span className="w-24">{totalTVA.toFixed(2)} €</span>
                                                    </div>
                                                    <div className="flex justify-end gap-8 text-base font-bold border-t border-border pt-2 mt-1">
                                                        <span>Total TTC</span>
                                                        <span className="w-24">{(totalHT + totalTVA).toFixed(2)} €</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <Button
                                            onClick={handleGenerateQuote}
                                            disabled={saveQuote.isPending}
                                            className="w-full mt-5 bg-brand text-white hover:bg-brand-hover"
                                        >
                                            {saveQuote.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <FileText className="h-4 w-4 mr-2" />
                                            )}
                                            Générer le devis final ({selectedTasks.length} prestation{selectedTasks.length !== 1 ? 's' : ''})
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Section 2 — Generated quotes history */}
                            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                                <div className="mb-4 border-b border-border pb-4">
                                    <h3 className="font-bold text-base text-text-primary">Devis générés</h3>
                                    <p className="text-xs text-text-muted mt-0.5">Historique des versions de devis pour ce projet.</p>
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
                                                reference: q.reference ?? undefined,
                                                title: q.title,
                                                projectId: q.project_id,
                                                clientName: project?.clients?.name ?? undefined,
                                                clientAddress: project?.clients?.address ?? undefined,
                                                clientEmail: project?.clients?.email ?? undefined,
                                                lines: ql,
                                                notes: q.notes ?? '',
                                                status: q.status ?? undefined,
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
                                                            {q.status !== 'archived' && (() => {
                                                                const factureExistante = facturesDuProjet?.find(f => f.devis_id === q.id);
                                                                if (factureExistante) {
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => navigate(`/factures/${factureExistante.id}`)}
                                                                            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                                                        >
                                                                            <Receipt className="h-3.5 w-3.5" />
                                                                            {factureExistante.numero_facture ?? 'Facturé'} ✓
                                                                        </button>
                                                                    );
                                                                }
                                                                return (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={convertingQuoteId === q.id}
                                                                        onClick={() => handleConvertirEnFacture(q.id)}
                                                                        className="h-8 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                                    >
                                                                        {convertingQuoteId === q.id
                                                                            ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                                            : <Receipt className="h-3.5 w-3.5 mr-1" />}
                                                                        Facturer
                                                                    </Button>
                                                                );
                                                            })()}
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

                            {/* Factures liées au projet */}
                            {facturesDuProjet && facturesDuProjet.length > 0 && (
                                <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                                        <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                            <Receipt className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-text-primary">Factures liées à ce projet</h3>
                                            <p className="text-xs text-text-muted mt-0.5">{facturesDuProjet.length} facture{facturesDuProjet.length > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border text-left">
                                                    <th className="pb-2 text-xs font-semibold text-text-muted">Numéro</th>
                                                    <th className="pb-2 text-xs font-semibold text-text-muted">Date</th>
                                                    <th className="pb-2 text-xs font-semibold text-text-muted text-right">Montant TTC</th>
                                                    <th className="pb-2 text-xs font-semibold text-text-muted text-center">Statut</th>
                                                    <th className="pb-2 w-8" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {facturesDuProjet.map((f: Facture) => (
                                                    <tr
                                                        key={f.id}
                                                        className="hover:bg-surface/50 cursor-pointer"
                                                        onClick={() => navigate(`/factures/${f.id}`)}
                                                    >
                                                        <td className="py-2 pr-3">
                                                            <span className="font-mono font-bold text-xs text-text-primary">{f.numero_facture || '—'}</span>
                                                        </td>
                                                        <td className="py-2 pr-3 text-xs text-text-secondary">
                                                            {f.date_emission ? format(new Date(f.date_emission), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                                        </td>
                                                        <td className="py-2 pr-3 text-right text-xs font-bold text-text-primary">
                                                            {f.total_ttc.toFixed(2)} €
                                                        </td>
                                                        <td className="py-2 text-center">
                                                            <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                                f.statut === 'payee' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                                f.statut === 'en_retard' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                f.statut === 'envoyee' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                                'bg-surface text-text-muted border border-border'
                                                            }`}>
                                                                {f.statut === 'payee' ? 'Payée' :
                                                                 f.statut === 'en_retard' ? 'En retard' :
                                                                 f.statut === 'envoyee' ? 'Envoyée' :
                                                                 f.statut === 'annulee' ? 'Annulée' : 'Brouillon'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2">
                                                            <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

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

                            {/* ── Generate-quote preview dialog (before save) ── */}
                            {quoteGeneratePreview && (() => {
                                const totals = calcQuoteTotals(quoteGeneratePreview.lines);
                                return (
                                    <Dialog open={!!quoteGeneratePreview} onOpenChange={(open) => !open && setQuoteGeneratePreview(null)}>
                                        <DialogContent showCloseButton={false} className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                                            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 gap-4">
                                                <div className="min-w-0">
                                                    <DialogTitle className="font-bold text-base text-text-primary truncate">
                                                        Aperçu — {quoteGeneratePreview.title}
                                                    </DialogTitle>
                                                    <p className="text-xs text-text-muted mt-0.5">Vérifiez le devis avant de l'enregistrer.</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setQuoteGeneratePreview(null)}
                                                        className="text-text-muted"
                                                    >
                                                        Annuler
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={handleConfirmSaveQuote}
                                                        disabled={saveQuote.isPending}
                                                        className="bg-brand text-white hover:bg-brand-hover"
                                                    >
                                                        {saveQuote.isPending
                                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                            : <FileText className="h-3.5 w-3.5 mr-1.5" />
                                                        }
                                                        Enregistrer ce devis
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-h-0">
                                                <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                                                    <QuotePDFDocument data={quoteGeneratePreview} totals={totals} profile={profile ?? null} />
                                                </PDFViewer>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                );
                            })()}

                            {/* Quote PDF preview dialog */}
                            {quotePreviewTarget && (() => {
                                const ql: QuoteLine[] = Array.isArray(quotePreviewTarget.lines) ? (quotePreviewTarget.lines as QuoteLine[]) : [];
                                const qt = calcQuoteTotals(ql);
                                const qd: QuoteData = { id: quotePreviewTarget.id, title: quotePreviewTarget.title, projectId: quotePreviewTarget.project_id, lines: ql, notes: quotePreviewTarget.notes ?? '', version: quotePreviewTarget.version ?? 1, created_at: quotePreviewTarget.created_at };
                                return (
                                    <Dialog open={!!quotePreviewTarget} onOpenChange={(open) => !open && setQuotePreviewTarget(null)}>
                                        <DialogContent showCloseButton={false} className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                                            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 gap-3">
                                                <DialogTitle className="font-serif text-lg truncate min-w-0">{quotePreviewTarget.title} v{quotePreviewTarget.version ?? 1}</DialogTitle>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <PDFDownloadLink
                                                        document={<QuotePDFDocument data={qd} totals={qt} profile={profile ?? null} />}
                                                        fileName={generateDocumentName('Devis', project.clients?.name || 'CLIENT', quotePreviewTarget.created_at || new Date().toISOString(), quotePreviewTarget.version ?? 1)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary"
                                                    >
                                                        {({ loading }) => (<>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Télécharger PDF</>)}
                                                    </PDFDownloadLink>
                                                    <DialogClose asChild>
                                                        <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs">
                                                            <X className="h-3.5 w-3.5" /> Fermer
                                                        </Button>
                                                    </DialogClose>
                                                </div>
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
                                        <p className="text-sm text-text-muted">Retrouvez l'historique documentaire et financier lié à ce projet.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setActiveTab('quotes')} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                            <Plus className="h-4 w-4 mr-1" /> Devis / Facture
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={onOpenContracts} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                            <Plus className="h-4 w-4 mr-1" /> Document
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
                                            Commencez par générer un devis ou un document pour structurer la mission.
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
                                                                <span className="capitalize opacity-60">• {doc.type === 'quote' ? 'Devis' : doc.type === 'contract' ? 'Document' : 'Facture'}</span>
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
                                                                    else setActiveTab('quotes');
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

            {/* Unified task creation dialog */}
            {project && (
                <TaskCreateDialog
                    open={quickTaskOpen}
                    onOpenChange={setQuickTaskOpen}
                    projectId={project.id}
                    onCreated={handleTaskCreatedWithDevisData}
                />
            )}

            {/* Quote builder modal — inline editor, no page navigation */}
            {project && (
                <QuoteBuilderModal
                    open={quoteBuilderOpen}
                    onOpenChange={setQuoteBuilderOpen}
                    projectId={project.id}
                    quoteId={quoteBuilderQuoteId}
                    projectName={project.name}
                />
            )}

            {/* Import tâches facturables dans le devis */}
            {project && (
                <ImportTasksModal
                    open={importTasksOpen}
                    onOpenChange={setImportTasksOpen}
                    projectId={project.id}
                    alreadySelected={selectedTasks.map(t => t.id)}
                    onImport={handleImportTasks}
                />
            )}

            {/* Contract PDF preview dialog */}
            <Dialog open={!!previewContract} onOpenChange={(open) => !open && setPreviewContract(null)}>
                <DialogContent showCloseButton={false} className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 gap-3">
                        <DialogTitle className="font-serif text-lg truncate min-w-0">{previewContract?.title}</DialogTitle>
                        <div className="flex items-center gap-2 shrink-0">
                            {previewContract && (
                                <PDFDownloadLink
                                    document={<ContractPDFDocument contract={previewContract} profile={profile ?? null} clientName={project?.clients?.name} />}
                                    fileName={generateDocumentName('Document-prestation', project?.clients?.name || 'CLIENT', previewContract.created_at, previewContract.version ?? 1)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary"
                                >
                                    {({ loading }) => (<>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Télécharger PDF</>)}
                                </PDFDownloadLink>
                            )}
                            <DialogClose asChild>
                                <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs">
                                    <X className="h-3.5 w-3.5" /> Fermer
                                </Button>
                            </DialogClose>
                        </div>
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
                <DialogContent showCloseButton={false} className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 gap-3">
                        <DialogTitle className="font-serif text-lg truncate min-w-0">
                            {previewInvoice ? (previewInvoice.notes ? `Facture — ${previewInvoice.notes}` : 'Facture') : ''}
                        </DialogTitle>
                        <div className="flex items-center gap-2 shrink-0">
                            {previewInvoice && (
                                <PDFDownloadLink
                                    document={<InvoicePDFDocument invoice={previewInvoice} profile={profile ?? null} />}
                                    fileName={generateDocumentName('Facture', project?.clients?.name || 'CLIENT', previewInvoice.created_at, 1)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary"
                                >
                                    {({ loading }) => (<>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Télécharger PDF</>)}
                                </PDFDownloadLink>
                            )}
                            <DialogClose asChild>
                                <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs">
                                    <X className="h-3.5 w-3.5" /> Fermer
                                </Button>
                            </DialogClose>
                        </div>
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

        <GenerateDocumentSheet
            open={generateDocOpen}
            onOpenChange={setGenerateDocOpen}
            project={project}
        />
        </>
    );
}
