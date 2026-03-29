/**
 * ContractWizardNew — 5-step contract creation wizard (useReducer-based).
 *
 * Steps:
 *   1. Type + Basics  (contract type, title, reference, dates)
 *   2. Financial Terms (TJM/forfait or salary fields, conditional on type)
 *   3. Clauses        (required/optional clause toggles + inline editors)
 *   4. Catalogue      (attach products — skipped for travail types)
 *   5. Preview & Save (assembled markdown preview, save button)
 */

import { useReducer, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import type {
    ContractType,
    ContractMetadata,
    ActiveClause,
    SelectedCatalogueItem,
    ProjectContractFormData,
} from '@/types/contract';
import {
    CONTRACT_TYPE_LABELS,
    CONTRACT_TYPE_DESCRIPTIONS,
    TRAVAIL_CONTRACT_TYPES,
    getClausesForType,
    CATEGORY_LABELS,
} from '@/data/contractClauses';
import { parseContractTemplate, type VariableContext } from '@/lib/utils/contract-parser';
import { useProfile } from '@/hooks/useProfile';
import { useProjectById } from '@/hooks/useProjects';
import { useProducts } from '@/hooks/useProducts';
import { useCreateProjectContract, useInsertContractCatalogueItems } from '@/hooks/useContracts';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    Lock,
    Loader2,
    Plus,
    Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface WizardState {
    step: WizardStep;
    contractType: ContractType | null;
    title: string;
    reference: string;
    startDate: string;
    endDate: string;
    metadata: ContractMetadata;
    clauses: ActiveClause[];
    useCatalogueItems: boolean;
    selectedItems: SelectedCatalogueItem[];
}

type WizardAction =
    | { type: 'SET_STEP'; payload: WizardStep }
    | { type: 'SET_TYPE'; payload: ContractType }
    | { type: 'PATCH_BASICS'; payload: Partial<Pick<WizardState, 'title' | 'reference' | 'startDate' | 'endDate'>> }
    | { type: 'PATCH_METADATA'; payload: Partial<ContractMetadata> }
    | { type: 'TOGGLE_CLAUSE'; payload: string }
    | { type: 'SET_CLAUSE_CONTENT'; payload: { clauseId: string; content: string } }
    | { type: 'SET_USE_CATALOGUE'; payload: boolean }
    | { type: 'SET_ITEMS'; payload: SelectedCatalogueItem[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateReference(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `C-${year}-${month}-${rand}`;
}

function initClauses(contractType: ContractType): ActiveClause[] {
    return getClausesForType(contractType).map(c => ({
        clauseId: c.id,
        enabled: true,
        overriddenContent: null,
    }));
}

function assembleMarkdown(
    contractType: ContractType,
    activeClauses: ActiveClause[],
    context: VariableContext,
): string {
    const allClauses = getClausesForType(contractType);
    const clauseMap = new Map(allClauses.map(c => [c.id, c]));

    const sections: string[] = [];
    for (const active of activeClauses) {
        if (!active.enabled) continue;
        const template = clauseMap.get(active.clauseId);
        if (!template) continue;
        const raw = active.overriddenContent ?? template.content;
        const resolved = parseContractTemplate(raw, context);
        sections.push(`## ${template.label}\n\n${resolved}`);
    }

    return sections.join('\n\n---\n\n');
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: WizardState = {
    step: 1,
    contractType: null,
    title: '',
    reference: generateReference(),
    startDate: '',
    endDate: '',
    metadata: { devise: 'EUR' },
    clauses: [],
    useCatalogueItems: false,
    selectedItems: [],
};

function reducer(state: WizardState, action: WizardAction): WizardState {
    switch (action.type) {
        case 'SET_STEP':
            return { ...state, step: action.payload };
        case 'SET_TYPE': {
            const clauses = initClauses(action.payload);
            const title = CONTRACT_TYPE_LABELS[action.payload];
            return { ...state, contractType: action.payload, clauses, title };
        }
        case 'PATCH_BASICS':
            return { ...state, ...action.payload };
        case 'PATCH_METADATA':
            return { ...state, metadata: { ...state.metadata, ...action.payload } };
        case 'TOGGLE_CLAUSE':
            return {
                ...state,
                clauses: state.clauses.map(c =>
                    c.clauseId === action.payload ? { ...c, enabled: !c.enabled } : c,
                ),
            };
        case 'SET_CLAUSE_CONTENT':
            return {
                ...state,
                clauses: state.clauses.map(c =>
                    c.clauseId === action.payload.clauseId
                        ? { ...c, overriddenContent: action.payload.content }
                        : c,
                ),
            };
        case 'SET_USE_CATALOGUE':
            return { ...state, useCatalogueItems: action.payload };
        case 'SET_ITEMS':
            return { ...state, selectedItems: action.payload };
        default:
            return state;
    }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContractWizardNewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContractWizardNew({ open, onOpenChange, projectId }: ContractWizardNewProps) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const { data: profile } = useProfile();
    const { data: project } = useProjectById(projectId);
    const { data: products } = useProducts();
    const createContract = useCreateProjectContract();
    const insertItems = useInsertContractCatalogueItems();

    const isTravail = state.contractType
        ? TRAVAIL_CONTRACT_TYPES.includes(state.contractType)
        : false;

    // ── Context for variable resolution ───────────────────────────────────────
    const context = useMemo((): VariableContext => {
        const { metadata, startDate, endDate } = state;
        const client = project?.clients ?? null;

        const montantTotal = metadata.forfait
            ? `${metadata.forfait.toLocaleString('fr-FR')} ${metadata.devise}`
            : metadata.tjm
            ? `${metadata.tjm} ${metadata.devise}/jour`
            : metadata.salaireBase
            ? `${metadata.salaireBase.toLocaleString('fr-FR')} ${metadata.devise} bruts/mois`
            : 'à définir';

        return {
            nom_prestataire: profile?.company_name || profile?.full_name || '',
            adresse_prestataire: [profile?.address_street, profile?.address_zip, profile?.address_city]
                .filter(Boolean)
                .join(', '),
            siret_prestataire: profile?.siret_number || '',
            tva_prestataire: profile?.vat_number || '',
            nom_client: client?.name || '',
            adresse_client: client?.address || '',
            nom_projet: project?.name || '',
            date_debut: startDate
                ? format(new Date(startDate), 'dd/MM/yyyy', { locale: fr })
                : 'à convenir',
            date_fin: endDate
                ? format(new Date(endDate), 'dd/MM/yyyy', { locale: fr })
                : 'à convenir',
            montant_total: montantTotal,
            tjm: metadata.tjm ? `${metadata.tjm} ${metadata.devise}` : '',
            forfait: metadata.forfait
                ? `${metadata.forfait.toLocaleString('fr-FR')} ${metadata.devise}`
                : '',
            devise: metadata.devise,
            acompte_percent: metadata.acomptePercent ? `${metadata.acomptePercent}%` : '30%',
            penalite_retard: metadata.penaliteRetardPercent
                ? `${metadata.penaliteRetardPercent}%`
                : '3×',
            salaire_base: metadata.salaireBase
                ? `${metadata.salaireBase.toLocaleString('fr-FR')} ${metadata.devise} bruts/mois`
                : '',
            convention_collective: metadata.conventionCollective || 'applicable',
            periode_essai: metadata.periodeEssaiMonths
                ? `${metadata.periodeEssaiMonths} mois`
                : '2 mois',
            cdd_date_fin: metadata.cddEndDate || 'à définir',
            alternance_diplome: metadata.alternanceDiplome || '',
            alternance_cfa: metadata.alternanceCfa || '',
            alternance_maitre: metadata.alternanceMaitreApprentissage || '',
            pi_condition: metadata.piTransferCondition || 'paiement intégral des honoraires',
            non_concurrence_duree: metadata.nonConcurrenceDureeMonths
                ? `${metadata.nonConcurrenceDureeMonths} mois`
                : '12 mois',
            non_concurrence_zone: metadata.nonConcurrenceZone || 'France métropolitaine',
        };
    }, [state, profile, project]);

    const assembledContent = useMemo(() => {
        if (!state.contractType) return '';
        return assembleMarkdown(state.contractType, state.clauses, context);
    }, [state.contractType, state.clauses, context]);

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!state.contractType) return;

        const payload: ProjectContractFormData = {
            project_id: projectId,
            template_id: null,
            title: state.title || CONTRACT_TYPE_LABELS[state.contractType],
            reference: state.reference,
            content: assembledContent,
            contract_type: state.contractType,
            clauses: state.clauses,
            metadata: state.metadata,
            status: 'draft',
            version: 1,
            version_of: null,
        };

        try {
            const saved = await createContract.mutateAsync(payload);

            if (state.useCatalogueItems && state.selectedItems.length > 0) {
                await insertItems.mutateAsync({
                    contractId: saved.id,
                    items: state.selectedItems.map(item => ({
                        product_id: item.productId,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        note: item.note || null,
                    })),
                });
            }

            onOpenChange(false);
        } catch {
            // handled by mutation
        }
    };

    const isSaving = createContract.isPending || insertItems.isPending;

    // ── Step labels ───────────────────────────────────────────────────────────

    const STEPS = ['Type', 'Termes', 'Clauses', 'Prestations', 'Aperçu'];
    const _totalSteps = isTravail ? 4 : 5; // skip catalogue for travail

    const nextStep = () => {
        const next = state.step + 1;
        // Skip step 4 (catalogue) for travail types
        if (next === 4 && isTravail) {
            dispatch({ type: 'SET_STEP', payload: 5 });
        } else {
            dispatch({ type: 'SET_STEP', payload: next as WizardStep });
        }
    };

    const prevStep = () => {
        const prev = state.step - 1;
        if (prev === 4 && isTravail) {
            dispatch({ type: 'SET_STEP', payload: 3 });
        } else {
            dispatch({ type: 'SET_STEP', payload: prev as WizardStep });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-surface text-text border-border">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Nouveau contrat
                    </DialogTitle>
                    {/* Progress bar */}
                    <div className="flex gap-1.5 mt-3">
                        {STEPS.map((label, i) => {
                            const stepNum = (i + 1) as WizardStep;
                            if (isTravail && stepNum === 4) return null;
                            return (
                                <div key={label} className="flex-1">
                                    <div
                                        className={`h-1 rounded-full transition-colors ${
                                            state.step >= stepNum ? 'bg-brand' : 'bg-border'
                                        }`}
                                    />
                                    <p
                                        className={`text-[10px] mt-1 text-center ${
                                            state.step >= stepNum ? 'text-brand' : 'text-text-muted'
                                        }`}
                                    >
                                        {label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1 py-4">
                    {state.step === 1 && (
                        <StepType state={state} dispatch={dispatch} />
                    )}
                    {state.step === 2 && (
                        <StepFinancial state={state} dispatch={dispatch} isTravail={isTravail} />
                    )}
                    {state.step === 3 && (
                        <StepClauses state={state} dispatch={dispatch} />
                    )}
                    {state.step === 4 && !isTravail && (
                        <StepCatalogue
                            state={state}
                            dispatch={dispatch}
                            products={products ?? []}
                        />
                    )}
                    {state.step === 5 && (
                        <StepPreview assembledContent={assembledContent} />
                    )}
                </div>

                <DialogFooter className="border-t border-border pt-4">
                    <div className="flex justify-between w-full">
                        <Button
                            variant="outline"
                            onClick={state.step === 1 ? () => onOpenChange(false) : prevStep}
                            className="border-border"
                        >
                            {state.step === 1 ? 'Annuler' : (
                                <><ArrowLeft className="mr-2 h-4 w-4" />Retour</>
                            )}
                        </Button>

                        {state.step < 5 ? (
                            <Button
                                onClick={nextStep}
                                disabled={state.step === 1 && !state.contractType}
                                className="bg-brand text-white hover:opacity-90"
                            >
                                Suivant <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !state.contractType}
                                className="bg-accent text-bg hover:opacity-90"
                            >
                                {isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Créer le contrat
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Step 1 — Type + Basics ───────────────────────────────────────────────────

function StepType({
    state,
    dispatch,
}: {
    state: WizardState;
    dispatch: React.Dispatch<WizardAction>;
}) {
    const allTypes = Object.keys(CONTRACT_TYPE_LABELS) as ContractType[];

    return (
        <div className="space-y-6">
            {/* Type selector */}
            <div>
                <Label className="text-sm font-medium mb-3 block">Type de contrat *</Label>
                <div className="grid grid-cols-1 gap-2">
                    {allTypes.map(type => {
                        const isTravailType = TRAVAIL_CONTRACT_TYPES.includes(type);
                        const selected = state.contractType === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => dispatch({ type: 'SET_TYPE', payload: type })}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                                    selected
                                        ? 'border-brand bg-brand/5 ring-1 ring-brand'
                                        : 'border-border bg-surface2 hover:border-brand/40'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{CONTRACT_TYPE_LABELS[type]}</span>
                                    {isTravailType && (
                                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50">
                                            Droit du travail
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {CONTRACT_TYPE_DESCRIPTIONS[type]}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Basics */}
            {state.contractType && (
                <div className="space-y-4 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                        <Label htmlFor="wiz-title">Titre du contrat</Label>
                        <Input
                            id="wiz-title"
                            value={state.title}
                            onChange={e => dispatch({ type: 'PATCH_BASICS', payload: { title: e.target.value } })}
                            className="bg-surface2 border-border"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="wiz-ref">Référence</Label>
                        <Input
                            id="wiz-ref"
                            value={state.reference}
                            onChange={e => dispatch({ type: 'PATCH_BASICS', payload: { reference: e.target.value } })}
                            className="bg-surface2 border-border font-mono text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="wiz-start">Date de début</Label>
                            <Input
                                id="wiz-start"
                                type="date"
                                value={state.startDate}
                                onChange={e =>
                                    dispatch({ type: 'PATCH_BASICS', payload: { startDate: e.target.value } })
                                }
                                className="bg-surface2 border-border"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="wiz-end">Date de fin</Label>
                            <Input
                                id="wiz-end"
                                type="date"
                                value={state.endDate}
                                onChange={e =>
                                    dispatch({ type: 'PATCH_BASICS', payload: { endDate: e.target.value } })
                                }
                                className="bg-surface2 border-border"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Step 2 — Financial Terms ─────────────────────────────────────────────────

function StepFinancial({
    state,
    dispatch,
    isTravail,
}: {
    state: WizardState;
    dispatch: React.Dispatch<WizardAction>;
    isTravail: boolean;
}) {
    const { metadata } = state;
    const isRegie = state.contractType === 'regie';

    const patch = (val: Partial<ContractMetadata>) =>
        dispatch({ type: 'PATCH_METADATA', payload: val });

    if (isTravail) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-text-muted">Renseignez les conditions de travail.</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Salaire brut mensuel (€)</Label>
                        <Input
                            type="number"
                            placeholder="2 500"
                            value={metadata.salaireBase ?? ''}
                            onChange={e => patch({ salaireBase: e.target.value ? Number(e.target.value) : undefined })}
                            className="bg-surface2 border-border"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Période d'essai (mois)</Label>
                        <Input
                            type="number"
                            placeholder="2"
                            value={metadata.periodeEssaiMonths ?? ''}
                            onChange={e => patch({ periodeEssaiMonths: e.target.value ? Number(e.target.value) : undefined })}
                            className="bg-surface2 border-border"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label>Convention collective</Label>
                    <Input
                        placeholder="Ex: Syntec, Métallurgie..."
                        value={metadata.conventionCollective ?? ''}
                        onChange={e => patch({ conventionCollective: e.target.value || undefined })}
                        className="bg-surface2 border-border"
                    />
                </div>

                {state.contractType === 'contrat_travail_cdd' && (
                    <div className="space-y-1.5">
                        <Label>Date de fin du CDD</Label>
                        <Input
                            type="date"
                            value={metadata.cddEndDate ?? ''}
                            onChange={e => patch({ cddEndDate: e.target.value || undefined })}
                            className="bg-surface2 border-border"
                        />
                    </div>
                )}

                {state.contractType === 'contrat_alternance' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Diplôme préparé</Label>
                            <Input
                                placeholder="Ex: Master Marketing Digital"
                                value={metadata.alternanceDiplome ?? ''}
                                onChange={e => patch({ alternanceDiplome: e.target.value || undefined })}
                                className="bg-surface2 border-border"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>CFA partenaire</Label>
                            <Input
                                placeholder="Ex: CFA Paris ESTACA"
                                value={metadata.alternanceCfa ?? ''}
                                onChange={e => patch({ alternanceCfa: e.target.value || undefined })}
                                className="bg-surface2 border-border"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Maître d'apprentissage</Label>
                            <Input
                                placeholder="Prénom Nom"
                                value={metadata.alternanceMaitreApprentissage ?? ''}
                                onChange={e => patch({ alternanceMaitreApprentissage: e.target.value || undefined })}
                                className="bg-surface2 border-border"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-text-muted">Définissez les conditions financières du contrat.</p>

            <div className="grid grid-cols-2 gap-4">
                {isRegie ? (
                    <div className="space-y-1.5">
                        <Label>TJM ({metadata.devise})</Label>
                        <Input
                            type="number"
                            placeholder="650"
                            value={metadata.tjm ?? ''}
                            onChange={e => patch({ tjm: e.target.value ? Number(e.target.value) : undefined })}
                            className="bg-surface2 border-border"
                        />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <Label>Montant forfaitaire ({metadata.devise})</Label>
                        <Input
                            type="number"
                            placeholder="5 000"
                            value={metadata.forfait ?? ''}
                            onChange={e => patch({ forfait: e.target.value ? Number(e.target.value) : undefined })}
                            className="bg-surface2 border-border"
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label>Devise</Label>
                    <Select
                        value={metadata.devise}
                        onValueChange={v => patch({ devise: v as 'EUR' | 'CHF' })}
                    >
                        <SelectTrigger className="bg-surface2 border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EUR">EUR €</SelectItem>
                            <SelectItem value="CHF">CHF ₣</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label>Acompte (%)</Label>
                    <Input
                        type="number"
                        placeholder="30"
                        min={0}
                        max={100}
                        value={metadata.acomptePercent ?? ''}
                        onChange={e => patch({ acomptePercent: e.target.value ? Number(e.target.value) : undefined })}
                        className="bg-surface2 border-border"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Pénalité retard (%)</Label>
                    <Input
                        type="number"
                        placeholder="3"
                        value={metadata.penaliteRetardPercent ?? ''}
                        onChange={e => patch({ penaliteRetardPercent: e.target.value ? Number(e.target.value) : undefined })}
                        className="bg-surface2 border-border"
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Step 3 — Clauses ─────────────────────────────────────────────────────────

function StepClauses({
    state,
    dispatch,
}: {
    state: WizardState;
    dispatch: React.Dispatch<WizardAction>;
}) {
    const [expanded, setExpanded] = useState<string | null>(null);

    if (!state.contractType) return null;

    const allClauses = getClausesForType(state.contractType);
    const clauseMap = new Map(allClauses.map(c => [c.id, c]));

    // Group by category, preserving registry order
    const grouped = new Map<string, typeof allClauses>();
    for (const c of allClauses) {
        const list = grouped.get(c.category) ?? [];
        list.push(c);
        grouped.set(c.category, list);
    }

    return (
        <div className="space-y-6">
            <p className="text-sm text-text-muted">
                Les clauses obligatoires sont incluses automatiquement. Désactivez ou personnalisez les clauses optionnelles.
            </p>

            {Array.from(grouped.entries()).map(([category, clauses]) => (
                <div key={category}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                        {CATEGORY_LABELS[category] ?? category}
                    </p>
                    <div className="space-y-2">
                        {clauses.map(clause => {
                            const active = state.clauses.find(a => a.clauseId === clause.id);
                            const isEnabled = active?.enabled ?? true;
                            const isExpanded = expanded === clause.id;
                            const currentContent =
                                active?.overriddenContent ?? clause.content;

                            return (
                                <div
                                    key={clause.id}
                                    className={`rounded-lg border transition-colors ${
                                        isEnabled ? 'border-border bg-surface2' : 'border-border/50 bg-surface opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between px-3 py-2.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {clause.required ? (
                                                <Lock className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                            ) : (
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={() =>
                                                        dispatch({ type: 'TOGGLE_CLAUSE', payload: clause.id })
                                                    }
                                                    className="shrink-0"
                                                />
                                            )}
                                            <span className="text-sm font-medium truncate">
                                                {clauseMap.get(clause.id)?.label ?? clause.id}
                                            </span>
                                            {clause.required && (
                                                <Badge variant="outline" className="text-[10px] shrink-0">
                                                    Obligatoire
                                                </Badge>
                                            )}
                                        </div>
                                        {clause.editableByUser && isEnabled && (
                                            <button
                                                type="button"
                                                onClick={() => setExpanded(isExpanded ? null : clause.id)}
                                                className="ml-2 text-text-muted hover:text-text transition-colors shrink-0"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {isExpanded && clause.editableByUser && (
                                        <div className="px-3 pb-3 border-t border-border/50">
                                            <Textarea
                                                value={currentContent}
                                                onChange={e =>
                                                    dispatch({
                                                        type: 'SET_CLAUSE_CONTENT',
                                                        payload: { clauseId: clause.id, content: e.target.value },
                                                    })
                                                }
                                                className="mt-2 bg-surface border-border text-xs font-mono h-40 resize-none"
                                                spellCheck={false}
                                            />
                                            <p className="text-[10px] text-text-muted mt-1">
                                                Variables disponibles : {`{{nom_client}}`}, {`{{date_debut}}`}, {`{{montant_total}}`}…
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Step 4 — Catalogue ───────────────────────────────────────────────────────

interface Product {
    id: string;
    name: string;
    unit_price: number;
    description: string | null;
}

function StepCatalogue({
    state,
    dispatch,
    products,
}: {
    state: WizardState;
    dispatch: React.Dispatch<WizardAction>;
    products: Product[];
}) {
    const totalHT = state.selectedItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
    );

    const addItem = (product: Product) => {
        const alreadyIn = state.selectedItems.find(i => i.productId === product.id);
        if (alreadyIn) return;
        dispatch({
            type: 'SET_ITEMS',
            payload: [
                ...state.selectedItems,
                { productId: product.id, quantity: 1, unitPrice: product.unit_price, note: '' },
            ],
        });
    };

    const removeItem = (productId: string) =>
        dispatch({
            type: 'SET_ITEMS',
            payload: state.selectedItems.filter(i => i.productId !== productId),
        });

    const patchItem = (productId: string, patch: Partial<SelectedCatalogueItem>) =>
        dispatch({
            type: 'SET_ITEMS',
            payload: state.selectedItems.map(i =>
                i.productId === productId ? { ...i, ...patch } : i,
            ),
        });

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Inclure des prestations du catalogue</p>
                    <p className="text-xs text-text-muted">
                        Optionnel — les lignes sélectionnées seront attachées au contrat.
                    </p>
                </div>
                <Switch
                    checked={state.useCatalogueItems}
                    onCheckedChange={v => dispatch({ type: 'SET_USE_CATALOGUE', payload: v })}
                />
            </div>

            {state.useCatalogueItems && (
                <>
                    {/* Available products */}
                    <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                            Catalogue
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {products.map(product => {
                                const selected = state.selectedItems.some(i => i.productId === product.id);
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        disabled={selected}
                                        onClick={() => addItem(product)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-colors ${
                                            selected
                                                ? 'border-border/50 bg-surface opacity-50 cursor-default'
                                                : 'border-border bg-surface2 hover:border-brand/50'
                                        }`}
                                    >
                                        <span>{product.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-text-muted">
                                                {product.unit_price.toLocaleString('fr-FR')} €
                                            </span>
                                            {!selected && <Plus className="h-3.5 w-3.5 text-brand" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected items */}
                    {state.selectedItems.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                                Sélectionnés
                            </p>
                            <div className="space-y-2">
                                {state.selectedItems.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    return (
                                        <div
                                            key={item.productId}
                                            className="flex items-center gap-2 p-2 rounded border border-border bg-surface2"
                                        >
                                            <span className="flex-1 text-sm font-medium min-w-0 truncate">
                                                {product?.name ?? item.productId}
                                            </span>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={e =>
                                                    patchItem(item.productId, {
                                                        quantity: Number(e.target.value) || 1,
                                                    })
                                                }
                                                className="w-16 bg-surface border-border text-xs h-8"
                                                title="Quantité"
                                            />
                                            <span className="text-text-muted text-xs">×</span>
                                            <Input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={e =>
                                                    patchItem(item.productId, {
                                                        unitPrice: Number(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-24 bg-surface border-border text-xs h-8"
                                                title="Prix unitaire"
                                            />
                                            <span className="text-text-muted text-xs">€</span>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.productId)}
                                                className="text-text-muted hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-3 flex justify-end">
                                <div className="text-sm">
                                    <span className="text-text-muted">Total HT : </span>
                                    <span className="font-semibold">
                                        {totalHT.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                        })}{' '}
                                        {state.metadata.devise}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Step 5 — Preview ─────────────────────────────────────────────────────────

function StepPreview({ assembledContent }: { assembledContent: string }) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-text-muted">
                Vérifiez le contenu généré avant de créer le contrat.
            </p>
            <Textarea
                value={assembledContent}
                readOnly
                className="bg-surface2 border-border font-mono text-xs h-[50vh] resize-none"
            />
        </div>
    );
}
