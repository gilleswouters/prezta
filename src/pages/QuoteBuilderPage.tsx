import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuoteStore } from '@/stores/useQuoteStore';
import { QuoteLineItem } from '@/components/quotes/QuoteLineItem';
import { CataloguePickerModal } from '@/components/quotes/CataloguePickerModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, Sparkles, Loader2, Play, Trash2, Eye, Edit3, Download, Receipt } from 'lucide-react';
import { generateQuoteFromBrief } from '@/lib/gemini';
import { useDeleteProject } from '@/hooks/useProjects';
import { useQuoteByProject, useSaveQuote } from '@/hooks/useQuotes';
import { useProfile } from '@/hooks/useProfile';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { InvoiceStatus } from '@/types/invoice';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { QuotePDFDocument } from '@/components/quotes/pdf/QuotePDFDocument';
import { toast } from 'sonner';

export default function QuoteBuilderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const store = useQuoteStore();
    const deleteProject = useDeleteProject();
    const { data: profile } = useProfile();
    const { data: dbQuote } = useQuoteByProject(id);
    const saveQuote = useSaveQuote();
    const createInvoice = useCreateInvoice();

    const [aiBrief, setAiBrief] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

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
                store.initializeQuote(id);
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
            const generatedLines = await generateQuoteFromBrief(aiBrief);
            store.setLinesFromAI(generatedLines);
            toast.success('Lignes générées par l\'IA avec succès.');
            setAiBrief('');
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la génération.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;
        saveQuote.mutate({ projectId: id, payload: store.data });
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
            // On navigue vers la page registre pour que l'utilisateur puisse vérifier
            navigate('/registre');
        } catch (error) {
            console.error("Erreur conversion", error);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-4 w-full">
                    <Button variant="ghost" size="icon" className="text-text-text-muted hover:bg-surface-hover shrink-0" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 w-full max-w-sm">
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

                <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
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
                    <Button onClick={handleDeleteProject} variant="outline" className="text-danger hover:text-danger-hover border-danger-light hover:bg-danger-light font-semibold h-10 px-4 shrink-0 shadow-sm" title="Supprimer le projet">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSave} className="bg-brand text-white hover:bg-brand-hover font-semibold w-full sm:w-auto h-10 px-6 shrink-0 shadow-md">
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                    </Button>
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
                            fileName={`Devis_${store.data.title.replace(/\s+/g, '_')}.pdf`}
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
        </div>
    );
}
