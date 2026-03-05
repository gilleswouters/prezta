import { useState, useMemo } from 'react';
import { useContractTemplates, useCreateContractTemplate, useUpdateContractTemplate, useDeleteContractTemplate } from '@/hooks/useContracts';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Globe, Lock, Trash2, Edit3, Loader2 } from 'lucide-react';
import { ContractTemplateModal } from '@/components/contracts/ContractTemplateModal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import type { ContractTemplate, ContractTemplateFormData } from '@/types/contract';

export default function ContractTemplatesPage() {
    const { data: templates, isLoading } = useContractTemplates();
    const createTemplate = useCreateContractTemplate();
    const updateTemplate = useUpdateContractTemplate();
    const deleteTemplate = useDeleteContractTemplate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | undefined>();

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const templatesByJurisdiction = useMemo(() => {
        if (!templates) return {};
        const groups: Record<string, ContractTemplate[]> = {
            'FR': [],
            'BE': [],
            'CH': []
        };
        templates.forEach(t => {
            if (groups[t.jurisdiction]) groups[t.jurisdiction].push(t);
        });
        return groups;
    }, [templates]);

    const handleOpenNew = () => {
        setSelectedTemplate(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (template: ContractTemplate) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Modèles de contrats</h1>
                    <p className="text-text-secondary mt-1">
                        Gérez vos trames légales. Les modèles "Système" sont publics, les vôtres sont privés et modifiables.
                    </p>
                </div>
                <Button onClick={handleOpenNew} className="bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau modèle
                </Button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.entries(templatesByJurisdiction).filter(([_, items]) => items.length > 0) as [string, ContractTemplate[]][]).map(([jurisdiction, items]) => (
                    <div key={jurisdiction} className="col-span-1 md:col-span-2 lg:col-span-3">
                        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
                            <Globe className="h-5 w-5 text-brand" />
                            {jurisdiction === 'FR' ? 'France' : jurisdiction === 'BE' ? 'Belgique' : 'Suisse'}
                            <span className="text-xs font-medium text-text-muted bg-surface px-2 py-0.5 rounded-full ml-2">
                                {items.length} {items.length > 1 ? 'modèles' : 'modèle'}
                            </span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(template => (
                                <div key={template.id} className="group relative bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-brand/30 transition-all cursor-pointer" onClick={() => handleOpenEdit(template)}>

                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-lg ${template.is_system ? 'bg-surface text-text-muted' : 'bg-brand-light text-brand'} shrink-0`}>
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        {template.is_system ? (
                                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface px-2 py-1 rounded">
                                                <Lock className="h-3 w-3" /> Système
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-light px-2 py-1 rounded">
                                                Personnalisé
                                            </div>
                                        )}
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
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-brand hover:bg-brand-light" onClick={(e) => { e.stopPropagation(); handleOpenEdit(template); }}>
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            {!template.is_system && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-danger hover:bg-danger/10" onClick={(e) => { e.stopPropagation(); setDeleteId(template.id); }}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {(!templates || templates.length === 0) && (
                    <div className="col-span-full py-20 text-center bg-surface border-2 border-dashed border-border rounded-xl">
                        <FileText className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-bold text-text-primary mb-2">Aucun modèle de contrat</h3>
                        <p className="text-text-secondary mb-6 max-w-md mx-auto">
                            Commencez par créer votre premier modèle de contrat, ou utilisez les modèles système si la base est configurée.
                        </p>
                        <Button onClick={handleOpenNew} className="bg-brand text-white hover:bg-brand-hover shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Créer un modèle
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal & Dialogs */}
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
                description="Cette action est irréversible. Les contrats déjà générés avec ce modèle ne seront pas affectés."
            />
        </div>
    );
}
