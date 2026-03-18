import { useState, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, ArrowRight, Check, Sparkles, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import type { ContractTemplateFormData, Jurisdiction } from '@/types/contract';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardClause {
    id: string;
    title: string;
    body: string;
    isGenerating: boolean;
    aiPrompt: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

const CONTRACT_TYPES = [
    'Contrat de prestation',
    'Contrat de mission',
    'NDA',
    'CGV',
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
    return crypto.randomUUID();
}

function buildContent(parties: string, mission: string, clauses: WizardClause[]): string {
    const lines: string[] = [];

    if (parties.trim()) {
        lines.push(parties.trim());
        lines.push('');
    }

    if (mission.trim()) {
        lines.push('## Article 1 – Objet de la mission');
        lines.push('');
        lines.push(mission.trim());
        lines.push('');
    }

    clauses.forEach((clause, i) => {
        if (clause.title.trim() || clause.body.trim()) {
            lines.push(`## Article ${i + 2} – ${clause.title || 'Sans titre'}`);
            lines.push('');
            lines.push(clause.body.trim() || '(Contenu à compléter)');
            lines.push('');
        }
    });

    return lines.join('\n').trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ContractWizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: ContractTemplateFormData) => Promise<void>;
    isLoading: boolean;
}

export function ContractWizardModal({ open, onOpenChange, onSave, isLoading }: ContractWizardModalProps) {
    const { data: profile } = useProfile();

    const [step, setStep] = useState<WizardStep>(1);
    const [contractType, setContractType] = useState<string>('Contrat de prestation');
    const [templateName, setTemplateName] = useState('');
    const [partiesText, setPartiesText] = useState('');
    const [missionObject, setMissionObject] = useState('');
    const [clauses, setClauses] = useState<WizardClause[]>([
        { id: makeId(), title: 'Délai de paiement', body: '', isGenerating: false, aiPrompt: '' },
        { id: makeId(), title: 'Propriété intellectuelle', body: '', isGenerating: false, aiPrompt: '' },
    ]);
    const [showPreview, setShowPreview] = useState(true);

    // Reset state when opening
    const handleOpenChange = useCallback((isOpen: boolean) => {
        if (!isOpen) {
            setStep(1);
            setContractType('Contrat de prestation');
            setTemplateName('');
            setPartiesText('');
            setMissionObject('');
            setClauses([
                { id: makeId(), title: 'Délai de paiement', body: '', isGenerating: false, aiPrompt: '' },
                { id: makeId(), title: 'Propriété intellectuelle', body: '', isGenerating: false, aiPrompt: '' },
            ]);
        }
        onOpenChange(isOpen);
    }, [onOpenChange]);

    // Auto-fill parties from profile when entering step 2
    const handleGoToStep2 = () => {
        if (!partiesText && profile) {
            const prestataire = [
                `**Le Prestataire**`,
                profile.full_name || '{{my_name}}',
                profile.address_street ? `${profile.address_street}, ${profile.address_zip} ${profile.address_city}` : '{{my_address}}',
                profile.siret_number ? `SIRET : ${profile.siret_number}` : '',
                profile.vat_number ? `TVA : ${profile.vat_number}` : '',
            ].filter(Boolean).join('\n');

            const defaultParties = `Entre les soussignés :\n\n${prestataire}\n\n**Le Client**\n{{client_name}}\n{{client_address}}\n\nIl a été convenu ce qui suit :`;
            setPartiesText(defaultParties);
        }
        setStep(2);
    };

    // AI clause generation
    const generateClause = async (clauseId: string) => {
        const clause = clauses.find(c => c.id === clauseId);
        if (!clause || !clause.aiPrompt.trim()) return;

        setClauses(prev => prev.map(c => c.id === clauseId ? { ...c, isGenerating: true } : c));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

            const { data, error } = await supabase.functions.invoke('generate-clause', {
                headers: { Authorization: `Bearer ${accessToken}` },
                body: { description: `${clause.title} — ${clause.aiPrompt}` },
            });

            if (error) throw error;

            const result = data as { clause?: { title: string; body: string }; error?: string } | null;
            if (result?.clause?.body) {
                setClauses(prev => prev.map(c =>
                    c.id === clauseId ? { ...c, body: result.clause!.body, isGenerating: false, aiPrompt: '' } : c
                ));
            }
        } catch {
            setClauses(prev => prev.map(c => c.id === clauseId ? { ...c, isGenerating: false } : c));
        }
    };

    const addClause = () => {
        setClauses(prev => [...prev, { id: makeId(), title: '', body: '', isGenerating: false, aiPrompt: '' }]);
    };

    const removeClause = (id: string) => {
        setClauses(prev => prev.filter(c => c.id !== id));
    };

    const updateClause = (id: string, field: keyof Pick<WizardClause, 'title' | 'body' | 'aiPrompt'>, value: string) => {
        setClauses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleFinalSave = async () => {
        const content = buildContent(partiesText, missionObject, clauses);
        await onSave({
            name: templateName.trim() || contractType,
            description: `${contractType} — créé avec le guide pas à pas`,
            jurisdiction: 'FR' as Jurisdiction,
            category: contractType,
            content,
        });
        handleOpenChange(false);
    };

    const previewContent = buildContent(partiesText, missionObject, clauses);

    // ─── Step indicators ──────────────────────────────────────────────────────

    const STEPS = [
        { n: 1, label: 'Type' },
        { n: 2, label: 'Parties' },
        { n: 3, label: 'Objet' },
        { n: 4, label: 'Clauses' },
        { n: 5, label: 'Finaliser' },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className={`bg-white border-border ${step === 4 && showPreview ? 'sm:max-w-[1100px]' : 'sm:max-w-[640px]'} max-h-[92vh] flex flex-col transition-all duration-300`}>
                <DialogHeader className="shrink-0">
                    <DialogTitle className="font-serif text-xl">Guide pas à pas — Nouveau modèle</DialogTitle>
                    <DialogDescription className="text-text-muted text-sm">
                        Étape {step} sur 5
                    </DialogDescription>

                    {/* Step indicators */}
                    <div className="flex items-center gap-1 mt-3">
                        {STEPS.map((s, i) => (
                            <div key={s.n} className="flex items-center gap-1">
                                <div className={`flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold transition-colors ${step > s.n ? 'bg-brand text-white' : step === s.n ? 'bg-brand text-white ring-2 ring-brand/30' : 'bg-surface2 text-text-muted'}`}>
                                    {step > s.n ? <Check className="h-3 w-3" /> : s.n}
                                </div>
                                <span className={`text-[11px] font-medium hidden sm:block ${step === s.n ? 'text-brand' : 'text-text-muted'}`}>{s.label}</span>
                                {i < STEPS.length - 1 && <div className={`h-px w-4 sm:w-8 ${step > s.n ? 'bg-brand' : 'bg-border'}`} />}
                            </div>
                        ))}
                    </div>
                </DialogHeader>

                <div className={`flex-1 overflow-hidden flex gap-6 min-h-0`}>
                    {/* Main content */}
                    <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">

                        {/* ─── Step 1: Type + Nom ───────────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text">Type de contrat *</label>
                                    <Select value={contractType} onValueChange={setContractType}>
                                        <SelectTrigger className="bg-surface2 border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {CONTRACT_TYPES.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text">Nom du modèle *</label>
                                    <Input
                                        placeholder={`Ex: ${contractType} — Dev web`}
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        className="bg-surface2 border-border"
                                        autoFocus
                                    />
                                    <p className="text-xs text-text-muted">Ce nom identifie le modèle dans votre bibliothèque.</p>
                                </div>
                            </div>
                        )}

                        {/* ─── Step 2: Parties ──────────────────────────────────── */}
                        {step === 2 && (
                            <div className="space-y-3">
                                <p className="text-sm text-text-muted">Informations pré-remplies depuis votre profil. Modifiez si nécessaire.</p>
                                <Textarea
                                    value={partiesText}
                                    onChange={(e) => setPartiesText(e.target.value)}
                                    className="bg-surface2 border-border font-mono text-xs resize-none min-h-[240px]"
                                    placeholder="Entre les soussignés :&#10;&#10;**Le Prestataire**&#10;{{my_name}}&#10;..."
                                />
                                <p className="text-xs text-text-muted">
                                    Utilisez les variables : <code className="bg-surface px-1 rounded">{'{{my_name}}'}</code>, <code className="bg-surface px-1 rounded">{'{{client_name}}'}</code>, <code className="bg-surface px-1 rounded">{'{{client_address}}'}</code>
                                </p>
                            </div>
                        )}

                        {/* ─── Step 3: Objet ────────────────────────────────────── */}
                        {step === 3 && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text">Objet de la mission</label>
                                    <Textarea
                                        value={missionObject}
                                        onChange={(e) => setMissionObject(e.target.value)}
                                        placeholder="Décrivez en quelques mots l'objet de cette mission...&#10;&#10;Ex: Le prestataire s'engage à fournir des services de développement web conformément au cahier des charges annexé."
                                        className="bg-surface2 border-border resize-none min-h-[180px]"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-text-muted">
                                    Vous pouvez utiliser <code className="bg-surface px-1 rounded">{'{{project_name}}'}</code> et <code className="bg-surface px-1 rounded">{'{{start_date}}'}</code>.
                                </p>
                            </div>
                        )}

                        {/* ─── Step 4: Clauses ──────────────────────────────────── */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-text-muted">Ajoutez vos clauses essentielles. Utilisez l'IA pour les générer.</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(v => !v)}
                                        className="flex items-center gap-1 text-xs text-brand hover:underline"
                                    >
                                        {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        {showPreview ? 'Masquer' : 'Aperçu'}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {clauses.map((clause, idx) => (
                                        <div key={clause.id} className="rounded-lg border border-border bg-white overflow-hidden">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-surface/60 border-b border-border">
                                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider w-6 shrink-0">#{idx + 1}</span>
                                                <Input
                                                    value={clause.title}
                                                    onChange={(e) => updateClause(clause.id, 'title', e.target.value)}
                                                    placeholder="Nom de la clause..."
                                                    className="h-7 text-sm font-semibold border-none shadow-none bg-transparent px-0 focus-visible:ring-0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeClause(clause.id)}
                                                    className="h-6 w-6 flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger-light rounded transition-colors shrink-0"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <Textarea
                                                value={clause.body}
                                                onChange={(e) => updateClause(clause.id, 'body', e.target.value)}
                                                placeholder="Rédigez le contenu de cette clause, ou utilisez l'aide IA ci-dessous..."
                                                className="border-none shadow-none resize-none text-sm font-mono bg-white focus-visible:ring-0 min-h-[80px] rounded-none"
                                            />
                                            {/* AI assist */}
                                            <div className="px-4 pb-3 border-t border-border/50 bg-surface/30 pt-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={clause.aiPrompt}
                                                        onChange={(e) => updateClause(clause.id, 'aiPrompt', e.target.value)}
                                                        placeholder="Décrivez ce que doit couvrir cette clause..."
                                                        className="h-7 text-xs bg-white border-border flex-1"
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), generateClause(clause.id))}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-7 text-xs bg-brand text-white hover:bg-brand-hover shrink-0 gap-1"
                                                        onClick={() => generateClause(clause.id)}
                                                        disabled={!clause.aiPrompt.trim() || clause.isGenerating}
                                                    >
                                                        {clause.isGenerating ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="h-3 w-3" />
                                                        )}
                                                        Aide IA ✦
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed text-text-muted hover:text-text-primary hover:border-solid"
                                    onClick={addClause}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Ajouter une clause
                                </Button>
                            </div>
                        )}

                        {/* ─── Step 5: Preview final ────────────────────────────── */}
                        {step === 5 && (
                            <div className="space-y-4">
                                <div className="bg-surface rounded-lg border border-border p-4">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Aperçu du modèle</p>
                                    <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto">
                                        {previewContent || '(Modèle vide)'}
                                    </pre>
                                </div>
                                <div className="bg-brand-light/20 border border-brand/20 rounded-lg p-4 space-y-1">
                                    <p className="text-sm font-semibold text-brand">Prêt à créer :</p>
                                    <p className="text-sm text-text-secondary">
                                        <strong>{templateName || contractType}</strong> · {contractType} · {clauses.filter(c => c.title || c.body).length} clause(s)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live preview panel (step 4 only) */}
                    {step === 4 && showPreview && (
                        <div className="w-80 shrink-0 border-l border-border pl-4 py-4 overflow-y-auto hidden lg:block">
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Aperçu temps réel</p>
                            <pre className="text-[11px] text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                                {previewContent || '(Rédigez pour voir l\'aperçu)'}
                            </pre>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t border-border mt-auto shrink-0 flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => step === 1 ? handleOpenChange(false) : setStep((s) => (s - 1) as WizardStep)}
                    >
                        {step === 1 ? 'Annuler' : <><ArrowLeft className="h-4 w-4 mr-1" /> Précédent</>}
                    </Button>

                    {step < 5 ? (
                        <Button
                            className="bg-brand text-white hover:bg-brand-hover"
                            onClick={() => {
                                if (step === 1) handleGoToStep2();
                                else setStep((s) => (s + 1) as WizardStep);
                            }}
                            disabled={step === 1 && !templateName.trim()}
                        >
                            Suivant <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            className="bg-brand text-white hover:bg-brand-hover"
                            onClick={handleFinalSave}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Créer le modèle
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
