import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, PrezButton } from '@/components/ui/button';
import { useContractTemplates, useCreateContractTemplate, useUpdateContractTemplate, useDeleteContractTemplate } from '@/hooks/useContracts';
import { Plus, FileText, Trash2, Edit3, Loader2, Copy, BookOpen, Eye, Download, X, FolderOpen, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ContractTemplateModal } from '@/components/contracts/ContractTemplateModal';
import { ContractWizardModal } from '@/components/contracts/ContractWizardModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContractPreviewPanel } from '@/components/contracts/ContractPreviewPanel';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useProfile } from '@/hooks/useProfile';
import { useContractPDF } from '@/hooks/useContractPDF';
import type { ContractTemplate, ContractTemplateFormData } from '@/types/contract';

export default function ContractTemplatesPage() {
    const navigate = useNavigate();
    const { data: templates, isLoading } = useContractTemplates();
    const createTemplate = useCreateContractTemplate();
    const updateTemplate = useUpdateContractTemplate();
    const deleteTemplate = useDeleteContractTemplate();
    const { data: profile } = useProfile();
    const { downloadContractPDF } = useContractPDF();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | undefined>();
    const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [examplesOpen, setExamplesOpen] = useState(false);

    useEffect(() => { document.title = 'Documents & Modèles · Prezta'; }, []);

    const userTemplates = useMemo(
        () => (templates ?? []).filter(t => !t.is_system),
        [templates],
    );

    const exampleTemplates = useMemo(
        () => (templates ?? []).filter(t => t.is_system && t.is_example),
        [templates],
    );

    const handleOpenNew = () => {
        setIsWizardOpen(true);
    };

    const handleOpenEdit = (template: ContractTemplate) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleDuplicate = async (template: ContractTemplate) => {
        await createTemplate.mutateAsync({
            name: `${template.name} (copie)`,
            description: template.description,
            jurisdiction: template.jurisdiction,
            category: template.category,
            content: template.content,
        });
    };

    const handleSaveTemplate = async (data: ContractTemplateFormData) => {
        if (selectedTemplate) {
            await updateTemplate.mutateAsync({ id: selectedTemplate.id, updates: data });
        } else {
            await createTemplate.mutateAsync(data);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteTemplate.mutateAsync(deleteId);
        setDeleteId(null);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;
    }

    return (
        <div>
            <PageHeader
                title="Documents & Modèles"
                color="blue"
                subtitle="Stockez vos modèles personnels et injectez automatiquement vos données client et projet."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/projets')}>
                            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                            Générer depuis un projet
                        </Button>
                        <PrezButton variant="primary" size="md" icon={<Plus className="h-3.5 w-3.5" />} onClick={handleOpenNew}>
                            Nouveau modèle
                        </PrezButton>
                    </div>
                }
            />

            <Alert className="border-amber-200 bg-amber-50 text-amber-800 flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <AlertDescription>
                    Prezta vous permet de stocker vos propres modèles de documents et d'y injecter automatiquement vos données. Pour tout document juridique, faites-le rédiger ou valider par un avocat.
                </AlertDescription>
            </Alert>

            {/* Mes modèles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTemplates.map(template => (
                    <div
                        key={template.id}
                        className="group relative bg-white border border-border rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:border-brand/30 cursor-pointer"
                        onClick={() => handleOpenEdit(template)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 rounded-lg bg-brand-light text-brand shrink-0">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand bg-brand-light px-2 py-1 rounded">
                                Personnalisé
                            </div>
                        </div>

                        <h3 className="font-bold text-text-primary text-base mb-1 line-clamp-1 group-hover:text-brand transition-colors">
                            {template.name}
                        </h3>

                        <p className="text-sm text-text-secondary line-clamp-2 h-10">
                            {template.description || "Aucune description fournie pour ce modèle."}
                        </p>

                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-text-muted font-medium bg-surface px-2 py-1 rounded">
                                {template.category}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-text-muted hover:text-brand hover:bg-brand-light"
                                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}
                                    title="Aperçu PDF"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-brand hover:bg-brand-light" onClick={(e) => { e.stopPropagation(); handleOpenEdit(template); }}>
                                    <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-danger hover:bg-danger/10" onClick={(e) => { e.stopPropagation(); setDeleteId(template.id); }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {userTemplates.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-surface border-2 border-dashed border-border rounded-xl">
                        <FileText className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-bold text-text-primary mb-2">Aucun modèle personnel</h3>
                        <p className="text-text-secondary mb-6 max-w-md mx-auto">
                            Créez votre premier modèle ou utilisez un exemple comme point de départ.
                        </p>
                        <Button onClick={handleOpenNew} className="bg-brand text-white hover:bg-brand-hover shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau modèle
                        </Button>
                    </div>
                )}
            </div>

            {/* Exemples — sous-menu discret */}
            {exampleTemplates.length > 0 && (
                <div className="mt-8 border-t border-border pt-4">
                    <button
                        onClick={() => setExamplesOpen(v => !v)}
                        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors w-full py-1"
                    >
                        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${examplesOpen ? 'rotate-90' : ''}`} />
                        Exemples de documents
                        <span className="text-[11px] bg-surface px-1.5 py-0.5 rounded-full">
                            {exampleTemplates.length}
                        </span>
                    </button>

                    {examplesOpen && (
                        <div className="mt-3 space-y-2">
                            {exampleTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white border border-border hover:border-amber-200 hover:bg-amber-50/30 transition-colors group"
                                >
                                    <BookOpen className="h-4 w-4 text-amber-500 shrink-0" />
                                    <span className="flex-1 font-medium text-sm text-text-primary">
                                        {template.name}
                                    </span>
                                    <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded hidden sm:inline">
                                        {template.category}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-text-muted hover:text-brand hover:bg-brand-light shrink-0"
                                        onClick={() => setPreviewTemplate(template)}
                                        title="Aperçu PDF"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-border text-text-secondary hover:border-brand/40 hover:text-brand hover:bg-brand-light gap-1 shrink-0"
                                        onClick={() => handleDuplicate(template)}
                                        disabled={createTemplate.isPending}
                                    >
                                        <Copy className="h-3 w-3" />
                                        Utiliser comme base
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Template preview dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
                <DialogContent showCloseButton={false} className="sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 flex flex-col bg-white border-border">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 gap-3">
                        <DialogTitle className="font-serif text-lg truncate min-w-0">
                            {previewTemplate?.name ?? 'Aperçu'}
                        </DialogTitle>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                disabled={isDownloading}
                                onClick={async () => {
                                    if (!previewTemplate) return;
                                    setIsDownloading(true);
                                    try {
                                        await downloadContractPDF(
                                            previewTemplate.content,
                                            previewTemplate.name,
                                            profile ?? null,
                                            `${previewTemplate.name}.pdf`,
                                        );
                                    } finally {
                                        setIsDownloading(false);
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md border border-border bg-white hover:bg-surface transition-colors text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                Télécharger PDF
                            </button>
                            <DialogClose asChild>
                                <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs">
                                    <X className="h-3.5 w-3.5" /> Fermer
                                </Button>
                            </DialogClose>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                        {previewTemplate && (
                            <ContractPreviewPanel
                                content={previewTemplate.content}
                                title={previewTemplate.name}
                                profile={profile ?? null}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal & Dialogs */}
            <ContractWizardModal
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                onSave={handleSaveTemplate}
                isLoading={createTemplate.isPending}
            />

            <ContractTemplateModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                template={selectedTemplate}
                onSave={handleSaveTemplate}
                isLoading={createTemplate.isPending || updateTemplate.isPending}
            />

            <DeleteConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="Supprimer ce modèle ?"
                description="Cette action est irréversible. Les documents déjà générés avec ce modèle ne seront pas affectés."
            />
        </div>
    );
}
