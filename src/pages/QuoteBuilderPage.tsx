import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuoteStore } from '@/stores/useQuoteStore';
import { QuoteLineItem } from '@/components/quotes/QuoteLineItem';
import { CataloguePickerModal } from '@/components/quotes/CataloguePickerModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, Sparkles, Loader2, Play, Trash2, Eye, Edit3, Download, Receipt, Send, AlertCircle, FolderKanban } from 'lucide-react';
import { generateDocumentName } from '@/lib/document-naming';
import { Unit } from '@/types/product';
import { trackEvent } from '@/lib/plausible';
import { useDeleteProject, useProjectById } from '@/hooks/useProjects';
import { useQuoteByProject, useSaveQuote, useUpdateQuoteStatus } from '@/hooks/useQuotes';
import { useTasks } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { InvoiceStatus } from '@/types/invoice';
import { SendForSignatureModal } from '@/components/contracts/SendForSignatureModal';
import { supabase } from '@/lib/supabase';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { QuotePDFDocument } from '@/components/quotes/pdf/QuotePDFDocument';
import { toast } from 'sonner';
import { ProfileCompleteBanner } from '@/components/ui/ProfileCompleteBanner';

export default function QuoteBuilderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const store = useQuoteStore();
    const deleteProject = useDeleteProject();
    const { data: profile } = useProfile();
    const { data: project } = useProjectById(id);
    const { data: dbQuote } = useQuoteByProject(id);
    const saveQuote = useSaveQuote();
    const createInvoice = useCreateInvoice();
    const updateQuoteStatus = useUpdateQuoteStatus();
    const { data: projectTasks, createTask } = useTasks(id);

    const [aiBrief, setAiBrief] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [signerError, setSignerError] = useState(false);

    useEffect(() => {
        if (id) {
            // S'il y a un devis existant dans la DB on le charge, sinon on met les defaults du store.
            if (dbQuote) {
                store.data = {
                    id: dbQuote.id,
                    title: dbQuote.title,
                    projectId: dbQuote.project_id,
                    lines: dbQuote.lines || [],
                    notes: dbQuote.notes || ''
                };
                // force trigger re-render de la page par zustand
                store.updateMetadata(dbQuote.title, dbQuote.notes);
            } else {
                // Capture pending lines before initializeQuote resets the store
                const pending = store.pendingTimesheetLines;
                store.initializeQuote(id);
                if (pending && pending.length > 0) {
                    store.setLinesFromAI(pending);
                    store.setPendingTimesheetLines(null);
                }
            }
        }
    }, [id, dbQuote]);

    const { subtotalHT, tvaAmounts, totalTVA, totalTTC } = store.getTotals();

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

            const raw = data as { lines: Array<{
                name: string;
                description?: string;
                quantity: number;
                unitPrice: number;
                tvaRate: number;
                unit: string;
            }> };
            const typedLines = raw.lines.map(l => ({ ...l, unit: (l.unit as Unit) }));
            store.setLinesFromAI(typedLines);
            toast.success('Lignes générées par l\'IA avec succès.');
            setAiBrief('');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la génération.';
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImportFromTasks = () => {
        if (!projectTasks || projectTasks.length === 0) {
            toast.info('Aucune tâche trouvée pour ce projet.');
            return;
        }
        const activeTasks = projectTasks.filter(t => t.status !== 'done');
        if (activeTasks.length === 0) {
            toast.info('Toutes les tâches sont déjà terminées.');
            return;
        }
        activeTasks.forEach(task => {
            store.addLine();
            const newLine = store.data.lines[store.data.lines.length - 1];
            if (newLine) {
                store.updateLine(newLine.id, {
                    name: task.title,
                    description: task.description || '',
                    quantity: 1,
                    unitPrice: 0,
                    tvaRate: 20,
                    unit: 'forfait' as const,
                });
            }
        });
        toast.success(`${activeTasks.length} tâche(s) importée(s) en lignes de devis.`);
    };

    const handleSave = async () => {
        if (!id) return;
        const isNew = !dbQuote;
        saveQuote.mutate({ projectId: id, payload: store.data }, {
            onSuccess: async () => {
                if (isNew) {
                    trackEvent('quote_created');
                    // Auto-create tasks from quote lines for new quotes
                    for (const line of store.data.lines) {
                        if (line.name && line.name.trim()) {
                            try {
                                await createTask({
                                    title: line.name,
                                    description: line.description || null,
                                    status: 'todo',
                                    priority: 'medium',
                                    project_id: id,
                                    due_date: null,
                                });
                            } catch {
                                // Non-blocking — task creation failure doesn't affect quote
                            }
                        }
                    }
                }
            },
        });
    };

    const handleDeleteProject = async () => {
        if (!id) return;
        if (confirm(`Voulez-vous vraiment supprimer ce projet ("${store.data.title}") ? Cette action est irréversible.`)) {
            await deleteProject.mutateAsync(id);
            navigate('/projets');
        }
    };

    const handleConvertToInvoice = async () => {
        if (!id) return;
        // La facture aura le total TTC calculé dynamiquement
        const { totalTTC } = store.getTotals();

        // Echeance par défaut = j+30
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        try {
            await createInvoice.mutateAsync({
                project_id: id,
                amount: parseFloat(totalTTC.toFixed(2)),
                status: InvoiceStatus.PENDING,
                due_date: dueDate.toISOString().split('T')[0],
                paid_date: null,
                notes: `Facture générée depuis le devis: ${store.data.title}`
            });
            toast.success('Facture créée avec succès !');
            navigate(`/projets?open=${id}`);
        } catch (error) {
            console.error("Erreur conversion", error);
        }
    };

    const handleRequestSend = () => {
        if (!project?.clients?.contact_name) {
            setSignerError(true);
            return;
        }
        setSignerError(false);
        setSendModalOpen(true);
    };

    const handleSendToFirma = async () => {
        const toastId = toast.loading('Génération du document (1/2)...');
        setIsSending(true);
        try {
            const blob = await pdf(
                <QuotePDFDocument
                    data={store.data}
                    totals={{ subtotalHT, tvaAmounts, totalTVA, totalTTC }}
                    profile={profile || null}
                />
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
                        headers: {
                            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                        },
                        body: { pdfBase64: base64data, title: store.data.title, clientName, clientEmail },
                    });

                    if (error) throw error;

                    const body = data as { firmaId?: string; error?: string } | null;
                    if (body?.error) throw new Error(body.error);

                    await updateQuoteStatus.mutateAsync({
                        id: dbQuote!.id,
                        status: 'sent',
                        signatureId: body?.firmaId,
                    });

                    trackEvent('signature_requested');
                    toast.success('Envoyé pour signature avec succès !', { id: toastId });
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
                    toast.error(message, { id: toastId });
                } finally {
                    setIsSending(false);
                }
            };

            reader.onerror = () => {
                toast.error('Erreur de lecture du PDF', { id: toastId });
                setIsSending(false);
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
            toast.error(message, { id: toastId });
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <ProfileCompleteBanner profile={profile} />
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-4 w-full">
                    <Button variant="ghost" size="icon" className="text-text-text-muted hover:bg-surface-hover shrink-0" onClick={() => navigate(`/projets?open=${id}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 w-full max-w-sm">
                        {project?.name && (
                            <p className="text-xs text-text-muted font-medium mb-0.5 px-2 -ml-2 flex items-center gap-1">
                                <span className="opacity-50">Projet :</span>
                                <span className="font-semibold text-text-primary truncate">{project.name}</span>
                            </p>
                        )}
                        <Input
                            value={store.data.title}
                            onChange={(e) => store.updateMetadata(e.target.value, store.data.notes)}
                            className="text-2xl font-bold bg-transparent border-transparent hover:border-border hover:bg-white focus:bg-white focus:border-brand h-auto py-1 px-2 -ml-2 w-full text-text-primary"
                        />
                    </div>
                </div>

                <div className="flex items-center bg-surface2 p-1 rounded-lg border border-border">
                    <Button
                        variant={viewMode === 'editor' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('editor')}
                        className={`h-8 px-4 text-xs font-semibold ${viewMode === 'editor' ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        <Edit3 className="h-3.5 w-3.5 mr-2" /> Édition
                    </Button>
                    <Button
                        variant={viewMode === 'preview' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('preview')}
                        className={`h-8 px-4 text-xs font-semibold ${viewMode === 'preview' ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        <Eye className="h-3.5 w-3.5 mr-2" /> Aperçu PDF
                    </Button>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    {signerError && (
                        <div className="flex items-center gap-2 text-xs text-danger bg-danger-light/40 border border-danger/20 rounded-lg px-3 py-2">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            Ajoutez le nom du signataire dans la fiche client avant d'envoyer.
                        </div>
                    )}
                    <div className="flex gap-2">
                    {dbQuote && (
                        <Button
                            onClick={handleConvertToInvoice}
                            variant="outline"
                            className="text-success hover:text-success hover:bg-success-light border-success-light font-semibold h-10 px-4 shrink-0 shadow-sm"
                            title="Convertir en facture"
                        >
                            <Receipt className="h-4 w-4 mr-2" />
                            Créer Facture
                        </Button>
                    )}
                    {dbQuote && (!dbQuote.status || dbQuote.status === 'draft' || dbQuote.status === 'sent') && (
                        <Button
                            onClick={handleRequestSend}
                            disabled={isSending}
                            variant="outline"
                            className="text-brand hover:text-brand hover:bg-brand-light border-brand/30 font-semibold h-10 px-4 shrink-0 shadow-sm"
                            title="Envoyer pour signature"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Signer
                        </Button>
                    )}
                    <Button onClick={handleDeleteProject} variant="outline" className="text-danger hover:text-danger-hover border-danger-light hover:bg-danger-light font-semibold h-10 px-4 shrink-0 shadow-sm" title="Supprimer le projet">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSave} className="bg-brand text-white hover:bg-brand-hover font-semibold w-full sm:w-auto h-10 px-6 shrink-0 shadow-md">
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                    </Button>
                    </div>
                </div>
            </div>

            {viewMode === 'editor' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Colonne Principale: Lignes de devis */}
                    <div className="lg:col-span-8 space-y-6">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            1. Prestations
                        </h3>

                        {store.data.lines.length === 0 ? (
                            <div className="bg-white border border-dashed border-border p-8 text-center rounded-xl">
                                <p className="text-text-secondary mb-4">Ce devis est vide.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {store.data.lines.map((line) => (
                                    <QuoteLineItem
                                        key={line.id}
                                        line={line}
                                        updateLine={store.updateLine}
                                        removeLine={store.removeLine}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button variant="outline" className="border-border text-text-secondary bg-white hover:bg-surface-hover hover:text-text-primary text-sm font-semibold h-10 flex-1" onClick={store.addLine}>
                                <Plus className="h-4 w-4 mr-2 text-success" />
                                Ajouter une ligne libre
                            </Button>

                            <CataloguePickerModal />

                            {projectTasks && projectTasks.filter(t => t.status !== 'done').length > 0 && (
                                <Button
                                    variant="outline"
                                    className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-sm font-semibold h-10 shrink-0"
                                    onClick={handleImportFromTasks}
                                    title="Importer les tâches actives comme lignes de devis"
                                >
                                    <FolderKanban className="h-4 w-4 mr-2" />
                                    Depuis les tâches
                                </Button>
                            )}
                        </div>

                        <div className="pt-8">
                            <h3 className="text-lg font-bold text-text-primary mb-4">
                                2. Notes additionnelles
                            </h3>
                            <Textarea
                                placeholder="Conditions de paiement, remarques spécifiques pour le client..."
                                className="min-h-[100px] border-border bg-white text-text-primary focus:bg-white resize-y"
                                value={store.data.notes || ''}
                                onChange={(e) => store.updateMetadata(store.data.title, e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Colonne Droite: Totaux et Assistant IA */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Assistant IA */}
                        <div className="bg-brand-light/30 border border-brand-border rounded-xl p-5 mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-5 w-5 text-brand" />
                                <h4 className="font-bold text-brand">Générer depuis un brief</h4>
                            </div>
                            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                                Collez les échanges avec votre client. L'assistant déduira les prestations, quantités et estimera les prix horaires automatiquement.
                            </p>
                            <Textarea
                                placeholder="Ex: Le client veut 3 pages vitrines, 1 logo et 4 devises de SEO pour son agence immo..."
                                className="text-sm border-brand-border bg-white placeholder:text-text-disabled mb-3 min-h-[100px]"
                                value={aiBrief}
                                onChange={(e) => setAiBrief(e.target.value)}
                                disabled={isGenerating}
                            />
                            <Button
                                className="w-full bg-brand hover:bg-brand-hover text-white h-9 text-xs font-bold"
                                onClick={handleAIGeneration}
                                disabled={isGenerating || !aiBrief.trim()}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyse IA en cours...</>
                                ) : (
                                    <><Play className="h-3 w-3 mr-2" /> Générer les lignes</>
                                )}
                            </Button>
                        </div>

                        {/* Résumé Financier */}
                        <div className="bg-white border border-border rounded-xl p-6 shadow-sm sticky top-6">
                            <h3 className="font-bold text-text-primary mb-6 border-b border-border pb-4">Résumé financier</h3>

                            <div className="space-y-4 text-sm font-medium mb-6">
                                <div className="flex justify-between text-text-secondary">
                                    <span>Sous-total HT</span>
                                    <span className="text-text-primary">{subtotalHT.toFixed(2)} €</span>
                                </div>

                                {Object.entries(tvaAmounts).map(([rate, amount]) => {
                                    if (amount === 0) return null;
                                    return (
                                        <div key={rate} className="flex justify-between text-text-muted text-xs">
                                            <span>TVA ({rate}%)</span>
                                            <span>{amount.toFixed(2)} €</span>
                                        </div>
                                    );
                                })}

                                <div className="flex justify-between text-text-secondary border-t border-border pt-4">
                                    <span>Total TVA</span>
                                    <span className="text-text-primary">{totalTVA.toFixed(2)} €</span>
                                </div>
                            </div>

                            <div className="bg-surface rounded-lg p-4 flex justify-between items-center border border-border">
                                <span className="font-bold text-text-primary">Total TTC</span>
                                <span className="text-2xl font-black text-brand tracking-tight">{totalTTC.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
                    <div className="w-full flex justify-end max-w-4xl">
                        <PDFDownloadLink
                            document={<QuotePDFDocument data={store.data} totals={{ subtotalHT, tvaAmounts, totalTVA, totalTTC }} profile={profile || null} />}
                            fileName={generateDocumentName(
                                'Devis',
                                profile?.company_name || profile?.full_name || 'CLIENT',
                                dbQuote?.created_at || new Date().toISOString(),
                                dbQuote?.version ?? 1,
                            )}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 h-10 px-6 bg-brand text-white hover:bg-brand-hover shadow-md"
                        >
                            {({ loading }) => (
                                <>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    {loading ? "Génération du PDF..." : "Télécharger le PDF"}
                                </>
                            )}
                        </PDFDownloadLink>
                    </div>

                    <div className="w-full max-w-4xl h-[800px] rounded-xl overflow-hidden border border-border shadow-lg bg-surface2">
                        <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                            <QuotePDFDocument data={store.data} totals={{ subtotalHT, tvaAmounts, totalTVA, totalTTC }} profile={profile || null} />
                        </PDFViewer>
                    </div>
                </div>
            )}

            <SendForSignatureModal
                open={sendModalOpen}
                onOpenChange={setSendModalOpen}
                signerName={project?.clients?.contact_name ?? ''}
                signerEmail={project?.clients?.email ?? ''}
                documentTitle={store.data.title}
                documentType="Devis"
                onConfirm={handleSendToFirma}
            />
        </div>
    );
}
