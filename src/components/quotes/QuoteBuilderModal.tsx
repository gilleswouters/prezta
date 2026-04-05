import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuoteStore } from '@/stores/useQuoteStore';
import { QuoteLineItem } from '@/components/quotes/QuoteLineItem';
import { CataloguePickerModal } from '@/components/quotes/CataloguePickerModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Save, Plus, Sparkles, Loader2, Play, Eye, Edit3, Download, Receipt, Send, AlertCircle, FolderKanban } from 'lucide-react';
import { generateDocumentName } from '@/lib/document-naming';
import { Unit } from '@/types/product';
import { trackEvent } from '@/lib/plausible';
import { useQuoteByProject, useQuoteById, useSaveQuote, useUpdateQuoteStatus } from '@/hooks/useQuotes';
import type { QuoteLine } from '@/types/quote';
import { useTasks } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { InvoiceStatus } from '@/types/invoice';
import { SendForSignatureModal } from '@/components/contracts/SendForSignatureModal';
import { useProjectById } from '@/hooks/useProjects';
import { supabase } from '@/lib/supabase';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { QuotePDFDocument } from '@/components/quotes/pdf/QuotePDFDocument';
import { toast } from 'sonner';

interface QuoteBuilderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    quoteId?: string;
    projectName: string;
}

export function QuoteBuilderModal({ open, onOpenChange, projectId, quoteId, projectName }: QuoteBuilderModalProps) {
    const store = useQuoteStore();
    const { data: profile } = useProfile();
    const { data: project } = useProjectById(projectId);
    const { data: dbQuoteById } = useQuoteById(quoteId);
    const { data: dbQuoteByProject } = useQuoteByProject(quoteId ? undefined : projectId);
    const dbQuote = dbQuoteById ?? dbQuoteByProject;
    const saveQuote = useSaveQuote();
    const createInvoice = useCreateInvoice();
    const updateQuoteStatus = useUpdateQuoteStatus();
    const { data: projectTasks, createTask, updateTask } = useTasks(projectId);

    const [aiBrief, setAiBrief] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [signerError, setSignerError] = useState(false);

    // Load quote into store when modal opens
    useEffect(() => {
        if (open && projectId) {
            if (dbQuote) {
                store.data = {
                    id: dbQuote.id,
                    title: dbQuote.title,
                    projectId: dbQuote.project_id,
                    lines: (dbQuote.lines as QuoteLine[]) || [],
                    notes: dbQuote.notes || '',
                };
                store.updateMetadata(dbQuote.title, dbQuote.notes ?? undefined);
            } else {
                store.initializeQuote(projectId);
            }
        }
    }, [open, projectId, dbQuote]);

    const { subtotalHT, tvaAmounts, totalTVA, totalTTC } = store.getTotals();

    // TVA breakdown base amounts
    const tvaBaseAmounts: Record<string, number> = {};
    store.data.lines.forEach(line => {
        const key = line.tvaRate.toString();
        if (!tvaBaseAmounts[key]) tvaBaseAmounts[key] = 0;
        tvaBaseAmounts[key] += line.quantity * line.unitPrice;
    });
    const hasZeroTva = store.data.lines.some(l => l.tvaRate === 0);

    const handleAIGeneration = async () => {
        if (!aiBrief.trim()) {
            toast.error('Veuillez entrer un brief décrivant les prestations.');
            return;
        }
        setIsGenerating(true);
        try {
            const { data, error: fnError } = await supabase.functions.invoke('generate-quote-brief', {
                body: { brief: aiBrief },
            });
            if (fnError) throw fnError;
            const raw = data as { lines: Array<{ name: string; description?: string; quantity: number; unitPrice: number; tvaRate: number; unit: string; }> };
            const typedLines = raw.lines.map(l => ({ ...l, unit: l.unit as Unit }));
            store.setLinesFromAI(typedLines);
            toast.success('Lignes générées par l\'IA avec succès.');
            setAiBrief('');
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImportBillableTasks = async () => {
        if (!projectTasks?.length) { toast.info('Aucune tâche trouvée.'); return; }
        const billable = projectTasks.filter(t => t.facturable && t.inclus_devis && t.status !== 'done');
        if (!billable.length) { toast.info('Aucune prestation marquée "Inclure dans devis".'); return; }
        billable.forEach(task => {
            store.addLine();
            const newLine = store.data.lines[store.data.lines.length - 1];
            if (newLine) {
                store.updateLine(newLine.id, {
                    name: task.title,
                    description: task.description || '',
                    quantity: 1,
                    unitPrice: task.prix_estime ?? 0,
                    tvaRate: 20,
                    unit: 'forfait' as const,
                });
            }
        });
        for (const task of billable) {
            try { await updateTask({ id: task.id, updates: { inclus_devis: false } }); } catch { /* non-blocking */ }
        }
        toast.success(`${billable.length} prestation(s) importée(s).`);
    };

    const handleSave = async () => {
        const isNew = !dbQuote;
        saveQuote.mutate({ projectId, payload: store.data }, {
            onSuccess: async () => {
                if (isNew) {
                    trackEvent('quote_created');
                    for (const line of store.data.lines) {
                        if (line.name?.trim()) {
                            try {
                                await createTask({ title: line.name, description: line.description || null, status: 'todo', priority: 'medium', project_id: projectId, due_date: null });
                            } catch { /* non-blocking */ }
                        }
                    }
                }
                toast.success('Devis enregistré.');
            },
        });
    };

    const handleConvertToInvoice = async () => {
        const { totalTTC: ttc } = store.getTotals();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        try {
            await createInvoice.mutateAsync({
                project_id: projectId,
                amount: parseFloat(ttc.toFixed(2)),
                status: InvoiceStatus.PENDING,
                due_date: dueDate.toISOString().split('T')[0],
                paid_date: null,
                notes: `Facture générée depuis le devis: ${store.data.title}`,
            });
            toast.success('Facture créée avec succès !');
            onOpenChange(false);
        } catch (error) {
            toast.error('Erreur lors de la création de la facture.');
            console.error(error);
        }
    };

    const handleRequestSend = () => {
        if (!project?.clients?.contact_name) { setSignerError(true); return; }
        setSignerError(false);
        setSendModalOpen(true);
    };

    const handleSendToFirma = async () => {
        const toastId = toast.loading('Génération du document (1/2)...');
        setIsSending(true);
        try {
            const blob = await pdf(
                <QuotePDFDocument data={store.data} totals={{ subtotalHT, tvaAmounts, totalTVA, totalTTC }} profile={profile || null} />
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
                    const { data, error } = await supabase.functions.invoke('firma-signature', {
                        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                        body: { pdfBase64: base64data, title: store.data.title, clientName, clientEmail },
                    });
                    if (error) throw error;
                    const body = data as { firmaId?: string; error?: string } | null;
                    if (body?.error) throw new Error(body.error);
                    await updateQuoteStatus.mutateAsync({ id: dbQuote!.id, status: 'sent', signatureId: body?.firmaId });
                    trackEvent('signature_requested');
                    toast.success('Envoyé pour signature avec succès !', { id: toastId });
                } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi", { id: toastId });
                } finally {
                    setIsSending(false);
                }
            };
            reader.onerror = () => { toast.error('Erreur de lecture du PDF', { id: toastId }); setIsSending(false); };
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi", { id: toastId });
            setIsSending(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0 bg-white border-border overflow-hidden">
                    {/* Accessible title for screen readers */}
                    <DialogTitle className="sr-only">Éditeur de devis — {projectName}</DialogTitle>
                    <DialogDescription className="sr-only">Modifiez et sauvegardez votre devis.</DialogDescription>

                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0 bg-white">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-text-muted font-medium shrink-0 truncate max-w-[120px]">{projectName}</span>
                            <span className="text-text-muted/50 text-sm shrink-0">/</span>
                            <Input
                                value={store.data.title}
                                onChange={(e) => store.updateMetadata(e.target.value, store.data.notes)}
                                className="text-base font-bold bg-transparent border-transparent hover:border-border hover:bg-white focus:bg-white focus:border-brand h-auto py-1 px-2 text-text-primary flex-1 min-w-0"
                            />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-surface p-1 rounded-lg border border-border">
                                <Button variant={viewMode === 'editor' ? 'default' : 'ghost'} onClick={() => setViewMode('editor')} className={`h-7 px-3 text-xs font-semibold ${viewMode === 'editor' ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                                    <Edit3 className="h-3 w-3 mr-1.5" /> Édition
                                </Button>
                                <Button variant={viewMode === 'preview' ? 'default' : 'ghost'} onClick={() => setViewMode('preview')} className={`h-7 px-3 text-xs font-semibold ${viewMode === 'preview' ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                                    <Eye className="h-3 w-3 mr-1.5" /> Aperçu
                                </Button>
                            </div>

                            {signerError && (
                                <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-light/40 border border-danger/20 rounded-lg px-2.5 py-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    Signataire manquant
                                </div>
                            )}

                            {dbQuote && (
                                <Button onClick={handleConvertToInvoice} variant="outline" size="sm" className="text-success hover:text-success hover:bg-success-light border-success-light font-semibold">
                                    <Receipt className="h-3.5 w-3.5 mr-1.5" /> Facture
                                </Button>
                            )}
                            {dbQuote && (!dbQuote.status || dbQuote.status === 'draft' || dbQuote.status === 'sent') && (
                                <Button onClick={handleRequestSend} disabled={isSending} variant="outline" size="sm" className="text-brand hover:text-brand hover:bg-brand-light border-brand/30 font-semibold">
                                    {isSending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                                    Signer
                                </Button>
                            )}
                            <Button onClick={handleSave} size="sm" className="bg-brand text-white hover:bg-brand-hover font-semibold px-5">
                                <Save className="h-3.5 w-3.5 mr-1.5" /> Enregistrer
                            </Button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto">
                        {viewMode === 'editor' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                                {/* Lines column */}
                                <div className="lg:col-span-8 space-y-5">
                                    <h3 className="text-base font-bold text-text-primary">1. Prestations</h3>

                                    {store.data.lines.length === 0 ? (
                                        <div className="bg-white border border-dashed border-border p-8 text-center rounded-xl">
                                            <p className="text-text-secondary mb-4">Ce devis est vide.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {store.data.lines.map((line) => (
                                                <QuoteLineItem key={line.id} line={line} updateLine={store.updateLine} removeLine={store.removeLine} />
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                        <Button variant="outline" className="border-border text-text-secondary bg-white hover:bg-surface-hover text-sm font-semibold h-9 flex-1" onClick={store.addLine}>
                                            <Plus className="h-4 w-4 mr-2 text-success" /> Ajouter une ligne libre
                                        </Button>
                                        <CataloguePickerModal />
                                        {projectTasks && projectTasks.filter(t => t.facturable && t.inclus_devis && t.status !== 'done').length > 0 && (
                                            <Button variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-sm font-semibold h-9 shrink-0" onClick={handleImportBillableTasks}>
                                                <FolderKanban className="h-4 w-4 mr-2" />
                                                Importer ({projectTasks.filter(t => t.facturable && t.inclus_devis && t.status !== 'done').length})
                                            </Button>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <h3 className="text-base font-bold text-text-primary mb-3">2. Notes additionnelles</h3>
                                        <Textarea
                                            placeholder="Conditions de paiement, remarques spécifiques pour le client..."
                                            className="min-h-[80px] border-border bg-white text-text-primary resize-y"
                                            value={store.data.notes || ''}
                                            onChange={(e) => store.updateMetadata(store.data.title, e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Right column */}
                                <div className="lg:col-span-4 space-y-5">
                                    {/* AI Brief */}
                                    <div className="bg-brand-light/30 border border-brand-border rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="h-4 w-4 text-brand" />
                                            <h4 className="font-bold text-brand text-sm">Générer depuis un brief</h4>
                                        </div>
                                        <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                                            Collez les échanges client. L'IA déduira les prestations et estimera les prix.
                                        </p>
                                        <Textarea
                                            placeholder="Ex: Le client veut 3 pages vitrines, 1 logo..."
                                            className="text-sm border-brand-border bg-white mb-2 min-h-[80px]"
                                            value={aiBrief}
                                            onChange={(e) => setAiBrief(e.target.value)}
                                            disabled={isGenerating}
                                        />
                                        <Button className="w-full bg-brand hover:bg-brand-hover text-white h-8 text-xs font-bold" onClick={handleAIGeneration} disabled={isGenerating || !aiBrief.trim()}>
                                            {isGenerating ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Analyse...</> : <><Play className="h-3 w-3 mr-2" />Générer les lignes</>}
                                        </Button>
                                    </div>

                                    {/* Totals */}
                                    <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                                        <h3 className="font-bold text-text-primary mb-4 border-b border-border pb-3 text-sm">Résumé financier</h3>

                                        <div className="space-y-3 text-sm font-medium mb-4">
                                            <div className="flex justify-between text-text-secondary">
                                                <span>Sous-total HT</span>
                                                <span className="text-text-primary">{subtotalHT.toFixed(2)} €</span>
                                            </div>
                                            {Object.entries(tvaBaseAmounts).map(([rate, base]) => {
                                                const amount = tvaAmounts[rate] ?? 0;
                                                const rateNum = parseFloat(rate);
                                                const label = rateNum === -1 ? 'Exonéré de TVA'
                                                    : rateNum === 0 ? '0% — Auto-entrepreneur'
                                                    : `TVA ${rate}% (sur ${base.toFixed(2)} €)`;
                                                return (
                                                    <div key={rate} className="flex justify-between text-text-muted text-xs">
                                                        <span>{label}</span>
                                                        <span>{amount.toFixed(2)} €</span>
                                                    </div>
                                                );
                                            })}
                                            <div className="flex justify-between text-text-secondary border-t border-border pt-3">
                                                <span>Total TVA</span>
                                                <span className="text-text-primary">{totalTVA.toFixed(2)} €</span>
                                            </div>
                                        </div>

                                        <div className="bg-surface rounded-lg p-3 flex justify-between items-center border border-border">
                                            <span className="font-bold text-text-primary text-sm">Total TTC</span>
                                            <span className="text-xl font-black text-brand tracking-tight">{totalTTC.toFixed(2)} €</span>
                                        </div>
                                        {hasZeroTva && (
                                            <p className="mt-2 text-[10px] text-text-muted italic">* TVA non applicable, art. 293B du CGI</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 p-6">
                                <div className="w-full flex justify-end max-w-4xl">
                                    <PDFDownloadLink
                                        document={<QuotePDFDocument data={store.data} totals={{ subtotalHT, tvaAmounts, totalTVA, totalTTC }} profile={profile || null} />}
                                        fileName={generateDocumentName('Devis', profile?.company_name || profile?.full_name || 'CLIENT', dbQuote?.created_at || new Date().toISOString(), dbQuote?.version ?? 1)}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-5 bg-brand text-white hover:bg-brand-hover shadow-sm"
                                    >
                                        {({ loading }) => (<>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{loading ? 'Génération...' : 'Télécharger PDF'}</>)}
                                    </PDFDownloadLink>
                                </div>
                                <div className="w-full max-w-4xl rounded-xl overflow-hidden border border-border shadow-lg bg-surface" style={{ height: 'calc(95vh - 180px)' }}>
                                    <PDFViewer width="100%" height="100%" showToolbar={false}>
                                        <QuotePDFDocument data={store.data} totals={{ subtotalHT, tvaAmounts, totalTVA, totalTTC }} profile={profile || null} />
                                    </PDFViewer>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <SendForSignatureModal
                open={sendModalOpen}
                onOpenChange={setSendModalOpen}
                signerName={project?.clients?.contact_name ?? ''}
                signerEmail={project?.clients?.email ?? ''}
                documentTitle={store.data.title}
                documentType="Devis"
                onConfirm={handleSendToFirma}
            />
        </>
    );
}
