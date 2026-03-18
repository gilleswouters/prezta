import { useState, useEffect } from 'react';
import { useProjectContracts, useUpdateProjectContract, useDeleteProjectContract } from '@/hooks/useContracts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ContractGenerator } from './ContractGenerator';
import { SendForSignatureModal } from './SendForSignatureModal';
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { ContractPDFDocument } from './pdf/ContractPDFDocument';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { generateDocumentName } from '@/lib/document-naming';
import { trackEvent } from '@/lib/plausible';
import {
    Download, Loader2, Plus, FileText, Calendar, Send, Trash2, AlertCircle,
    ChevronDown, GitBranch, CalendarClock, X,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import type { ProjectWithClient } from '@/types/project';
import type { ProjectContract, ContractStatus } from '@/types/contract';

interface ProjectContractsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectWithClient | null;
}

/** Statuses that block direct edit — require a new version. */
const LOCKED_STATUSES: ContractStatus[] = ['sent', 'lu', 'signed'];

export function ProjectContractsModal({ open, onOpenChange, project }: ProjectContractsModalProps) {
    const { data: contracts, isLoading } = useProjectContracts(project?.id);
    const { data: profile } = useProfile();
    const updateContract = useUpdateProjectContract();
    const deleteContract = useDeleteProjectContract();

    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<string | null>(null);
    const [signerErrorId, setSignerErrorId] = useState<string | null>(null);

    // Signature confirmation modal
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [contractToSend, setContractToSend] = useState<ProjectContract | null>(null);

    // Version intercept dialog
    const [versionInterceptOpen, setVersionInterceptOpen] = useState(false);
    const [pendingVersionOf, setPendingVersionOf] = useState<string | null>(null);
    const [pendingVersion, setPendingVersion] = useState(1);

    // Collapsible open state per contract
    const [historyOpenIds, setHistoryOpenIds] = useState<Set<string>>(new Set());

    // Expiry date picker state
    const [expiryPickerId, setExpiryPickerId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setSignerErrorId(null);
            setSendModalOpen(false);
            setContractToSend(null);
            setHistoryOpenIds(new Set());
        }
    }, [open]);

    // ── Version group logic ───────────────────────────────────────────────────

    /** Groups contracts by their version chain root id. */
    const versionGroups = new Map<string, ProjectContract[]>();
    for (const c of contracts ?? []) {
        const rootId = c.version_of ?? c.id;
        if (!versionGroups.has(rootId)) versionGroups.set(rootId, []);
        versionGroups.get(rootId)!.push(c);
    }

    const getSiblings = (contract: ProjectContract): ProjectContract[] => {
        const rootId = contract.version_of ?? contract.id;
        return (versionGroups.get(rootId) ?? []).filter(c => c.id !== contract.id);
    };

    // ── Add contract with optional version intercept ───────────────────────────

    const handleAddContract = () => {
        const lockedContract = contracts?.find(c => LOCKED_STATUSES.includes(c.status));
        if (lockedContract) {
            const maxVersion = Math.max(...(contracts?.map(c => c.version ?? 1) ?? [1]));
            setPendingVersionOf(lockedContract.version_of ?? lockedContract.id);
            setPendingVersion(maxVersion + 1);
            setVersionInterceptOpen(true);
        } else {
            setPendingVersionOf(null);
            setGeneratorOpen(true);
        }
    };

    const handleVersionInterceptConfirmNew = () => {
        setVersionInterceptOpen(false);
        setGeneratorOpen(true);
    };

    const handleVersionInterceptIndependent = () => {
        setVersionInterceptOpen(false);
        setPendingVersionOf(null);
        setPendingVersion(1);
        setGeneratorOpen(true);
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDeleteConfirm = async () => {
        if (!contractToDelete) return;
        await deleteContract.mutateAsync(contractToDelete);
        setContractToDelete(null);
    };

    // ── Status update ─────────────────────────────────────────────────────────

    const handleUpdateStatus = async (contractId: string, status: ContractStatus, signatureId?: string) => {
        await updateContract.mutateAsync({
            id: contractId,
            updates: {
                status,
                signed_at: status === 'signed' ? new Date().toISOString() : undefined,
                sent_at: status === 'sent' ? new Date().toISOString() : undefined,
                ...(signatureId ? { signature_id: signatureId } : {}),
            },
        });
    };

    // ── FIRMA send ────────────────────────────────────────────────────────────

    const handleRequestSend = (contract: ProjectContract) => {
        if (!project?.clients?.contact_name) {
            setSignerErrorId(contract.id);
            return;
        }
        setSignerErrorId(null);
        setContractToSend(contract);
        setSendModalOpen(true);
    };

    const handleSendToFirma = async (contract: ProjectContract) => {
        const toastId = toast.loading('Génération du document (1/2)...');
        try {
            const blob = await pdf(
                <ContractPDFDocument contract={contract} profile={profile ?? null} />
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
                        body: { pdfBase64: base64data, title: contract.title, clientName, clientEmail },
                    });

                    if (error) throw error;

                    const body = data as { firmaId?: string; error?: string } | null;
                    if (body?.error) throw new Error(body.error);

                    await handleUpdateStatus(contract.id, 'sent', body?.firmaId);
                    trackEvent('signature_requested');
                    toast.success('Envoyé pour signature avec succès !', { id: toastId });
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
                    console.error('Firma integration error inside onload:', err);
                    toast.error(message, { id: toastId });
                }
            };

            reader.onerror = () => {
                toast.error('Erreur de lecture du PDF', { id: toastId });
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
            console.error('Firma integration error:', err);
            toast.error(message, { id: toastId });
        }
    };

    // ── Collapsible toggle ────────────────────────────────────────────────────

    const toggleHistory = (id: string) => {
        setHistoryOpenIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] bg-white border-border">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                            <FileText className="h-6 w-6 text-brand" />
                            Contrats du Projet
                        </DialogTitle>
                        <DialogDescription>
                            Gérez les documents contractuels pour{' '}
                            <strong>{project?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                            </div>
                        ) : contracts?.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-text-muted opacity-20" />
                                <p className="text-text-muted mb-4">
                                    Aucun contrat généré pour ce projet.
                                </p>
                                <Button
                                    onClick={handleAddContract}
                                    className="bg-brand text-white hover:bg-brand-hover"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Créer le premier contrat
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contracts?.map((contract) => {
                                    const siblings = getSiblings(contract);
                                    const hasHistory = siblings.length > 0;
                                    const isHistoryOpen = historyOpenIds.has(contract.id);
                                    const clientName = project?.clients?.name ?? 'Client';
                                    const pdfFileName = generateDocumentName(
                                        'Contrat-prestation',
                                        clientName,
                                        contract.created_at,
                                        contract.version ?? 1,
                                    );

                                    return (
                                        <div
                                            key={contract.id}
                                            className="rounded-xl border border-border bg-surface hover:border-brand/30 transition-all"
                                        >
                                            <div className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-lg shrink-0 ${
                                                        contract.status === 'signed'
                                                            ? 'bg-success-light text-success'
                                                            : contract.status === 'sent'
                                                            ? 'bg-brand-light text-brand'
                                                            : contract.status === 'lu'
                                                            ? 'bg-warning-light text-warning'
                                                            : 'bg-surface text-text-muted'
                                                    }`}>
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-bold text-sm text-text truncate">
                                                                {contract.title}
                                                            </p>
                                                            {(contract.version ?? 1) > 1 && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-light text-brand border border-brand/20 shrink-0 uppercase tracking-wider">
                                                                    v{contract.version}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <Calendar className="h-3 w-3 text-text-muted shrink-0" />
                                                            <span className="text-[10px] text-text-muted">
                                                                {format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: fr })}
                                                            </span>
                                                            <DocumentStatusBadge status={contract.status} />
                                                            {contract.expires_at && (
                                                                <ExpiryBadge expiresAt={contract.expires_at} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <PDFDownloadLink
                                                        document={
                                                            <ContractPDFDocument contract={contract} profile={profile ?? null} />
                                                        }
                                                        fileName={pdfFileName}
                                                        className="inline-flex items-center justify-center h-8 w-8 text-text-muted hover:text-brand hover:bg-brand-light rounded-md"
                                                        title="Télécharger PDF"
                                                    >
                                                        {({ loading }) =>
                                                            loading ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Download className="h-4 w-4" />
                                                            )
                                                        }
                                                    </PDFDownloadLink>

                                                    {contract.status === 'draft' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-[11px] text-brand hover:bg-brand-light"
                                                            onClick={() => handleRequestSend(contract)}
                                                        >
                                                            <Send className="h-3 w-3 mr-1" />
                                                            Envoyer
                                                        </Button>
                                                    )}

                                                    {hasHistory && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 text-text-muted hover:text-brand hover:bg-brand-light ${isHistoryOpen ? 'text-brand bg-brand-light' : ''}`}
                                                            onClick={() => toggleHistory(contract.id)}
                                                            title="Historique des versions"
                                                        >
                                                            <ChevronDown className={`h-4 w-4 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
                                                        </Button>
                                                    )}

                                                    <Popover
                                                        open={expiryPickerId === contract.id}
                                                        onOpenChange={(v) => setExpiryPickerId(v ? contract.id : null)}
                                                    >
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-8 w-8 hover:bg-brand-light ${
                                                                    contract.expires_at ? 'text-brand' : 'text-text-muted hover:text-brand'
                                                                }`}
                                                                title={contract.expires_at ? 'Modifier la date d\'expiration' : 'Ajouter une date d\'expiration'}
                                                            >
                                                                <CalendarClock className="h-4 w-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 bg-white border-border shadow-lg" align="end">
                                                            <div className="p-3 border-b border-border">
                                                                <p className="text-xs font-semibold text-text-primary">Date d&apos;expiration (optionnel)</p>
                                                                {contract.expires_at && (
                                                                    <p className="text-[10px] text-text-muted mt-0.5">
                                                                        Actuellement : {format(parseISO(contract.expires_at), 'dd/MM/yyyy', { locale: fr })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <CalendarPicker
                                                                mode="single"
                                                                selected={contract.expires_at ? parseISO(contract.expires_at) : undefined}
                                                                onSelect={(date) => {
                                                                    updateContract.mutate({
                                                                        id: contract.id,
                                                                        updates: { expires_at: date ? date.toISOString() : null },
                                                                    });
                                                                    setExpiryPickerId(null);
                                                                }}
                                                                locale={fr}
                                                                disabled={(date) => date < new Date()}
                                                                className="bg-white"
                                                            />
                                                            {contract.expires_at && (
                                                                <div className="p-2 border-t border-border">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="w-full text-xs text-danger hover:text-danger hover:bg-danger/10 h-7"
                                                                        onClick={() => {
                                                                            updateContract.mutate({
                                                                                id: contract.id,
                                                                                updates: { expires_at: null },
                                                                            });
                                                                            setExpiryPickerId(null);
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3 mr-1" /> Supprimer la date
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </PopoverContent>
                                                    </Popover>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger-light"
                                                        onClick={() => setContractToDelete(contract.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* No-contact-name guard */}
                                            {signerErrorId === contract.id && (
                                                <div className="px-4 pb-3 flex items-center gap-1.5 text-danger text-[11px] font-medium">
                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                    Ajoutez le nom du signataire dans la fiche client avant d&apos;envoyer
                                                </div>
                                            )}

                                            {/* Version history collapsible */}
                                            {hasHistory && isHistoryOpen && (
                                                <div className="border-t border-border px-4 pb-3 pt-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                                                        <GitBranch className="h-3 w-3" />
                                                        Historique des versions
                                                    </p>
                                                    <div className="space-y-1">
                                                        {siblings
                                                            .sort((a, b) => (a.version ?? 1) - (b.version ?? 1))
                                                            .map(sibling => (
                                                                <div key={sibling.id} className="flex items-center gap-2 text-xs text-text-muted">
                                                                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border">
                                                                        v{sibling.version ?? 1}
                                                                    </span>
                                                                    <DocumentStatusBadge status={sibling.status} />
                                                                    <span className="text-[10px]">
                                                                        {format(new Date(sibling.created_at), 'dd/MM/yyyy', { locale: fr })}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <Button
                                    onClick={handleAddContract}
                                    variant="outline"
                                    className="w-full border-dashed border-2 py-6 border-border hover:border-brand/50 text-text-muted hover:text-brand"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ajouter un autre contrat
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Signature confirmation modal */}
            {contractToSend && (
                <SendForSignatureModal
                    open={sendModalOpen}
                    onOpenChange={(v) => {
                        setSendModalOpen(v);
                        if (!v) setContractToSend(null);
                    }}
                    signerName={project?.clients?.contact_name ?? ''}
                    signerEmail={project?.clients?.email ?? ''}
                    documentTitle={contractToSend.title}
                    documentType="Contrat"
                    onConfirm={() => handleSendToFirma(contractToSend)}
                />
            )}

            {/* Version intercept dialog */}
            <AlertDialog open={versionInterceptOpen} onOpenChange={setVersionInterceptOpen}>
                <AlertDialogContent className="bg-white border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Créer une nouvelle version ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Un contrat a déjà été envoyé pour ce projet. Souhaitez-vous créer
                            une <strong>nouvelle version (v{pendingVersion})</strong> liée au contrat
                            existant, ou un <strong>contrat indépendant</strong> ?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => setVersionInterceptOpen(false)}>
                            Annuler
                        </AlertDialogCancel>
                        <Button variant="outline" onClick={handleVersionInterceptIndependent}>
                            Contrat indépendant
                        </Button>
                        <AlertDialogAction onClick={handleVersionInterceptConfirmNew} className="bg-brand text-white hover:bg-brand-hover">
                            Nouvelle version
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ContractGenerator
                open={generatorOpen}
                onOpenChange={setGeneratorOpen}
                project={project}
                versionOf={pendingVersionOf}
                version={pendingVersionOf ? pendingVersion : undefined}
            />


            <AlertDialog
                open={!!contractToDelete}
                onOpenChange={(open) => !open && setContractToDelete(null)}
            >
                <AlertDialogContent className="bg-white border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est définitive. Le contrat sera supprimé de votre tableau
                            de bord. (Attention : si le contrat a déjà été envoyé via Firma, il ne
                            sera pas annulé côté client).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Oui, supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── Expiry Badge ─────────────────────────────────────────────────────────────

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
    const days = differenceInDays(parseISO(expiresAt), new Date());
    const isUrgent = days <= 7;
    const isWarning = days <= 30;

    if (!isWarning) {
        return (
            <span className="text-[10px] text-text-muted bg-surface border border-border px-1.5 py-0.5 rounded font-medium">
                Expire le {format(parseISO(expiresAt), 'dd/MM/yyyy', { locale: fr })}
            </span>
        );
    }

    return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            isUrgent
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
        }`}>
            {isUrgent ? `⚠ Expire dans ${days}j` : `Expire dans ${days}j`}
        </span>
    );
}
