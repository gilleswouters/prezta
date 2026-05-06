import { useState, useMemo } from 'react';
import { useContractTemplates, useCreateProjectContract } from '@/hooks/useContracts';
import { useProfile } from '@/hooks/useProfile';
import { useQuoteByProject } from '@/hooks/useQuotes';
import { parseContractTemplate } from '@/lib/utils/contract-parser';
import { buildAddress } from '@/lib/contract-variables';
import { validateClientForContract } from '@/lib/contract-requirements';
import { ClientModal } from '@/components/ClientModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Check, AlertCircle, Edit3, Eye, UserCog } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { trackEvent } from '@/lib/plausible';
import type { ContractTemplate } from '@/types/contract';
import type { Client } from '@/types/client';

interface ContractGeneratorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: any; // Ideally ProjectWithClient
    /** UUID of the contract this new document is a version of (optional). */
    versionOf?: string | null;
    /** Version number to assign (defaults to 1). */
    version?: number;
}

export function ContractGenerator({ open, onOpenChange, project, versionOf, version }: ContractGeneratorProps) {
    const { data: templates, isLoading: templatesLoading } = useContractTemplates();
    const { data: profile } = useProfile();
    const { data: quote } = useQuoteByProject(project?.id);
    const createContract = useCreateProjectContract();

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
    const [previewContent, setPreviewContent] = useState<string>('');
    const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
    const [missingClientFields, setMissingClientFields] = useState<string[]>([]);
    const [clientEditOpen, setClientEditOpen] = useState(false);

    const frTemplates = useMemo(() => {
        if (!templates) return [];
        return templates.filter(t => t.jurisdiction === 'FR');
    }, [templates]);

    const buildContext = () => {
        let totalPrice = '0.00';
        if (quote?.lines) {
            const total = (quote.lines as any[]).reduce((acc, line) => {
                const lineHT = (line.quantity || 0) * (line.unitPrice || 0);
                const lineTTC = lineHT * (1 + (line.tvaRate || 0) / 100);
                return acc + lineTTC;
            }, 0);
            totalPrice = total.toFixed(2);
        }

        const repName = profile?.legal_representative_name || profile?.full_name || profile?.company_name || '';
        const repRole = profile?.legal_representative_role ? `, en qualité de ${profile.legal_representative_role}` : '';
        const fullNameWithRole = repName ? `${repName}${repRole}` : '';

        return {
            nom_prestataire: fullNameWithRole,
            adresse_prestataire: buildAddress(profile ?? null),
            ville_prestataire: profile?.address_city || '',
            siret_prestataire: profile?.bce_number || profile?.siret_number || '',
            tva_prestataire: profile?.vat_number || '',
            nom_client: project?.clients?.name || '',
            adresse_client: project?.clients?.address || '',
            nom_projet: project?.name || '',
            date_debut: project?.start_date
                ? new Date(project.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'à convenir',
            montant_total: totalPrice,
        };
    };

    const handleTemplateSelect = (id: string) => {
        const template = templates?.find(t => t.id === id);
        if (!template) return;

        setSelectedTemplateId(id);
        setSelectedTemplate(template);

        // Validate client completeness for this template category
        const client: Client | null = project?.clients ?? null;
        const { valid, missingFields } = validateClientForContract(client, template.category);

        if (!valid) {
            setMissingClientFields(missingFields);
            setPreviewContent('');
            return;
        }

        setMissingClientFields([]);
        const parsed = parseContractTemplate(template.content, buildContext());
        setPreviewContent(parsed);
        setViewMode('preview');
    };

    // Re-validate and regenerate after client edit
    const handleClientEditClose = () => {
        setClientEditOpen(false);
        if (!selectedTemplate) return;

        const client: Client | null = project?.clients ?? null;
        const { valid, missingFields } = validateClientForContract(client, selectedTemplate.category);

        if (valid) {
            setMissingClientFields([]);
            const parsed = parseContractTemplate(selectedTemplate.content, buildContext());
            setPreviewContent(parsed);
            setViewMode('preview');
        } else {
            setMissingClientFields(missingFields);
        }
    };

    const handleGenerate = async () => {
        const template = templates?.find(t => t.id === selectedTemplateId);
        if (!template) return;

        const versionNum = version ?? 1;
        await createContract.mutateAsync({
            project_id: project.id,
            template_id: template.id,
            title: versionNum > 1
                ? `Document - ${project.name} (v${versionNum})`
                : `Document - ${project.name}`,
            content: previewContent,
            status: 'draft',
            version: versionNum,
            version_of: versionOf ?? null,
            metadata: { devise: 'EUR' },
            contract_type: 'prestation_services',
            clauses: [],
        });

        trackEvent('contract_sent');
        onOpenChange(false);
    };

    const client: Client | null = project?.clients ?? null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col bg-white border-border">
                    <DialogHeader>
                        <DialogTitle className="text-[length:var(--text-18)] font-[var(--font-heavy)] flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[var(--color-text-3)]" />
                            Générer un document
                        </DialogTitle>
                        <DialogDescription>
                            {project?.name && <span className="font-semibold text-text-primary">{project.name} — </span>}
                            Choisissez un modèle adapté à votre juridiction.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text">Modèle de document</label>
                            <Select onValueChange={handleTemplateSelect} value={selectedTemplateId}>
                                <SelectTrigger className="w-full bg-surface border-border">
                                    <SelectValue placeholder={templatesLoading ? "Chargement des modèles..." : "Sélectionner un modèle"} />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[100] bg-white border-border min-w-[var(--radix-select-trigger-width)]">
                                    {templatesLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-brand" />
                                        </div>
                                    ) : !templates || templates.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-text-muted">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p>Aucun modèle trouvé.</p>
                                            <p className="text-[11px] mt-2">Vérifiez la base de données.</p>
                                        </div>
                                    ) : (
                                        <SelectGroup>
                                            <SelectLabel className="bg-surface2 font-bold text-text-muted uppercase">🇫🇷 France</SelectLabel>
                                            {frTemplates.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Client incomplete alert */}
                        {missingClientFields.length > 0 && (
                            <Alert className="border-amber-300 bg-amber-50">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800 font-semibold">Fiche client incomplète</AlertTitle>
                                <AlertDescription className="text-amber-700 space-y-2">
                                    <p>Pour générer ce document, les informations suivantes sont requises :</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-sm">
                                        {missingClientFields.map(field => (
                                            <li key={field}>
                                                {field} — <span className="font-semibold">manquant</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {client && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100"
                                            onClick={() => setClientEditOpen(true)}
                                        >
                                            <UserCog className="h-3.5 w-3.5 mr-1.5" />
                                            Compléter la fiche de « {client.name} »
                                        </Button>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {previewContent ? (
                            <div className="flex-1 overflow-hidden flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm font-semibold text-text">
                                    <label>Aperçu du document</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setViewMode(v => v === 'preview' ? 'edit' : 'preview')}
                                        className="h-8 text-xs font-semibold px-3"
                                    >
                                        {viewMode === 'preview' ? (
                                            <><Edit3 className="h-3.5 w-3.5 mr-2" /> Éditer le texte</>
                                        ) : (
                                            <><Eye className="h-3.5 w-3.5 mr-2" /> Voir l'aperçu</>
                                        )}
                                    </Button>
                                </div>

                                {viewMode === 'preview' ? (
                                    <div className="flex-1 overflow-y-auto border border-border rounded-xl p-8 bg-surface prose prose-sm max-w-none shadow-inner">
                                        <ReactMarkdown>{previewContent}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <Textarea
                                        className="flex-1 min-h-[300px] border-border rounded-xl p-6 bg-white font-mono text-sm resize-none focus:ring-brand shadow-inner leading-relaxed"
                                        value={previewContent}
                                        onChange={(e) => setPreviewContent(e.target.value)}
                                        placeholder="Éditez le texte du document ici..."
                                    />
                                )}
                            </div>
                        ) : missingClientFields.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-12 text-text-muted">
                                <FileText className="h-12 w-12 mb-2 opacity-20" />
                                <p>Sélectionnez un modèle pour voir l'aperçu personnalisé.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-4 border-t border-border">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-text-muted hover:text-text">
                            Annuler
                        </Button>
                        <Button
                            disabled={!selectedTemplateId || !previewContent || createContract.isPending}
                            onClick={handleGenerate}
                            className="bg-brand text-white hover:bg-brand-hover shadow-lg shadow-blue-100"
                        >
                            {createContract.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Générer et Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Client edit modal — opens without closing the generator */}
            <ClientModal
                open={clientEditOpen}
                onOpenChange={(isOpen) => { if (!isOpen) handleClientEditClose(); }}
                client={client}
            />
        </>
    );
}
