import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, BookOpen } from 'lucide-react';
import type { ContractTemplateFormData } from '@/types/contract';
import { ContractBlockEditor } from './ContractBlockEditor';

const DEFAULT_CONTENT = `Entre les soussignés :

**Le Prestataire**
{{nom_prestataire}}
{{adresse_prestataire}}
SIRET : {{siret_prestataire}} — TVA : {{tva_prestataire}}

**Le Client**
{{nom_client}}
{{adresse_client}}

Il a été convenu ce qui suit :

## Article 1 – Objet

Décrivez ici l'objet du document.

## Article 2 – Conditions

Ajoutez vos conditions ici.
`;

const VARIABLES = [
    {
        group: 'Mon profil',
        items: [
            { key: '{{nom_prestataire}}', label: 'Nom / société' },
            { key: '{{adresse_prestataire}}', label: 'Adresse complète' },
            { key: '{{ville_prestataire}}', label: 'Ville' },
            { key: '{{siret_prestataire}}', label: 'SIRET / BCE' },
            { key: '{{tva_prestataire}}', label: 'N° TVA' },
        ],
    },
    {
        group: 'Le Client',
        items: [
            { key: '{{nom_client}}', label: 'Nom du client' },
            { key: '{{adresse_client}}', label: 'Adresse' },
        ],
    },
    {
        group: 'Le Projet',
        items: [
            { key: '{{nom_projet}}', label: 'Nom du projet' },
            { key: '{{date_debut}}', label: 'Date de début' },
            { key: '{{montant_total}}', label: 'Montant HT' },
        ],
    },
];

interface ContractWizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: ContractTemplateFormData) => Promise<void>;
    isLoading: boolean;
}

export function ContractWizardModal({
    open,
    onOpenChange,
    onSave,
    isLoading,
}: ContractWizardModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState(DEFAULT_CONTENT);
    const [editorKey, setEditorKey] = useState(0);

    useEffect(() => {
        if (open) {
            setName('');
            setCategory('');
            setDescription('');
            setContent(DEFAULT_CONTENT);
            setEditorKey((k) => k + 1);
        }
    }, [open]);

    const handleSave = async () => {
        if (!name.trim() || !content.trim()) return;
        await onSave({
            name: name.trim(),
            description: description.trim() || null,
            jurisdiction: 'FR',
            category: category.trim() || 'Modèle personnel',
            content: content.trim(),
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[960px] h-[92vh] flex flex-col bg-white border-border">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="text-[length:var(--text-18)] font-[var(--font-heavy)] flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[var(--color-text-3)]" />
                        Nouveau modèle
                    </DialogTitle>
                    <DialogDescription>
                        Donnez un nom à votre modèle et rédigez son contenu. Utilisez les variables pour l'auto-complétion.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex gap-5 overflow-hidden">
                    {/* Main column: metadata + editor */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-1 form-scrollbar">
                        {/* Metadata row */}
                        <div className="grid grid-cols-2 gap-3 shrink-0">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-text">Nom du modèle *</label>
                                <Input
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex : Devis standard, Bon de commande…"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-text">Type de document</label>
                                <Input
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Ex : Document de prestation, CGV, NDA…"
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-sm font-semibold text-text">Description</label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optionnel — à quoi sert ce modèle ?"
                                />
                            </div>
                        </div>

                        {/* Hint */}
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 shrink-0">
                            <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                            <span>
                                Collez ou rédigez votre modèle. Utilisez{' '}
                                <code className="font-mono bg-amber-100 px-1 rounded">{'{{nom_client}}'}</code>,{' '}
                                <code className="font-mono bg-amber-100 px-1 rounded">{'{{nom_projet}}'}</code>, etc.
                                {' '}pour les données automatiques.
                            </span>
                        </div>

                        {/* Block editor */}
                        <ContractBlockEditor
                            key={editorKey}
                            value={content}
                            onChange={setContent}
                        />
                    </div>

                    {/* Variables sidebar */}
                    <div className="w-52 shrink-0 overflow-y-auto form-scrollbar">
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">
                            Variables disponibles
                        </p>
                        {VARIABLES.map((group) => (
                            <div key={group.group} className="mb-4">
                                <p className="text-[11px] font-bold text-text-secondary mb-1.5 border-b border-border pb-1">
                                    {group.group}
                                </p>
                                <div className="space-y-1.5">
                                    {group.items.map((v) => (
                                        <div key={v.key}>
                                            <code className="block bg-surface px-1.5 py-1 rounded text-[11px] text-brand font-mono leading-tight">
                                                {v.key}
                                            </code>
                                            <span className="text-[10px] text-text-muted pl-0.5">
                                                {v.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                            Ces valeurs sont injectées automatiquement lors de la génération depuis un projet.
                        </p>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t border-border mt-auto shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!name.trim() || !content.trim() || isLoading}
                        className="bg-brand text-white hover:bg-brand-hover"
                    >
                        {isLoading
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <FileText className="mr-2 h-4 w-4" />}
                        Créer le modèle
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
