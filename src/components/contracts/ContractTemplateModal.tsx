import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2, Save, Info } from 'lucide-react';
import type { ContractTemplateFormData, Jurisdiction } from '@/types/contract';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ContractTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: any; // ContractTemplate ou null pour nouveau
    onSave: (data: ContractTemplateFormData) => Promise<void>;
    isLoading: boolean;
}

export function ContractTemplateModal({ open, onOpenChange, template, onSave, isLoading }: ContractTemplateModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('FR');
    const [category, setCategory] = useState('Contrat de prestation');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (open) {
            if (template) {
                setName(template.name || '');
                setDescription(template.description || '');
                setJurisdiction(template.jurisdiction || 'FR');
                setCategory(template.category || 'Contrat de prestation');
                setContent(template.content || '');
            } else {
                setName('');
                setDescription('');
                setJurisdiction('FR');
                setCategory('Contrat de prestation');
                setContent('## Contrat de prestations de services\n\nEntre:\n{{my_name}}\n{{my_address}}\nCi-après le "Prestataire",\n\nEt:\n{{client_name}}\n{{client_address}}\nCi-après le "Client",\n\nIl a été convenu ce qui suit:\n\n### Article 1 - Objet\n...\n');
            }
        }
    }, [open, template]);

    const handleSave = async () => {
        if (!name.trim() || !content.trim()) return;

        await onSave({
            name: name.trim(),
            description: description.trim() || null,
            jurisdiction,
            category: category.trim(),
            content: content.trim()
        });
        onOpenChange(false);
    };

    const isSystem = template?.is_system;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col bg-white border-border">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                        <FileText className="h-6 w-6 text-brand" />
                        {isSystem ? "Voir le modèle" : template ? "Modifier le modèle" : "Nouveau Modèle"}
                    </DialogTitle>
                    <DialogDescription>
                        {isSystem ? "Ce modèle système ne peut pas être modifié. Dupliquez-le pour l'adapter." : "Créez ou modifiez votre modèle de contrat en utilisant le format Markdown."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 form-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text">Nom du modèle *</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Contrat de Dev web"
                                disabled={isSystem}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text">Catégorie</label>
                            <Input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Ex: Contrat de prestation"
                                disabled={isSystem}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text">Juridiction *</label>
                            <Select
                                value={jurisdiction}
                                onValueChange={(v) => setJurisdiction(v as Jurisdiction)}
                                disabled={isSystem}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pays" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FR">France</SelectItem>
                                    <SelectItem value="BE">Belgique</SelectItem>
                                    <SelectItem value="CH">Suisse</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text">Description</label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optionnel..."
                                disabled={isSystem}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-text">Contenu (Markdown) *</label>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-brand hover:text-brand-hover hover:bg-brand-light">
                                        <Info className="h-3.5 w-3.5 mr-1" /> Variables disponibles
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-4 text-sm bg-white" align="end">
                                    <div className="space-y-2 font-medium">
                                        <p className="font-bold border-b border-border pb-2 mb-2">Mon profil</p>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-1">{`{{my_name}}`}</code>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-1">{`{{my_city}}`}</code>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-1">{`{{my_bce}}`} (ou SIRET)</code>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-3">{`{{my_vat}}`}</code>

                                        <p className="font-bold border-b border-border pb-2 mb-2">Le Client</p>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-1">{`{{client_name}}`}</code>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-3">{`{{client_address}}`}</code>

                                        <p className="font-bold border-b border-border pb-2 mb-2">Le Projet</p>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-1">{`{{project_name}}`}</code>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px] mb-1">{`{{start_date}}`}</code>
                                        <code className="block bg-surface px-1.5 py-0.5 rounded text-[11px]">{`{{total_price}}`}</code>
                                    </div>
                                    <p className="text-[10px] text-text-muted mt-4">Astuce: utilisez la syntaxe Markdown ## Titre pour formater.</p>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 min-h-0 font-mono text-sm resize-none bg-surface/50 border-border"
                            placeholder="Rédigez le contenu du contrat..."
                            disabled={isSystem}
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t border-border mt-auto shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        {isSystem ? "Fermer" : "Annuler"}
                    </Button>
                    {!isSystem && (
                        <Button
                            onClick={handleSave}
                            disabled={!name.trim() || !content.trim() || isLoading}
                            className="bg-brand text-white hover:bg-brand-hover"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
