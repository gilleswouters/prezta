import { useState } from 'react';
import { useProjectContracts, useUpdateProjectContract, useDeleteProjectContract } from '@/hooks/useContracts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { ContractGenerator } from './ContractGenerator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { ContractPDFDocument } from './pdf/ContractPDFDocument';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { Download, Loader2, Plus, FileText, Calendar, Send, Trash2 } from 'lucide-react';

interface ProjectContractsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: any;
}

export function ProjectContractsModal({ open, onOpenChange, project }: ProjectContractsModalProps) {
    const { data: contracts, isLoading } = useProjectContracts(project?.id);
    const { data: profile } = useProfile();
    const updateContract = useUpdateProjectContract();
    const deleteContract = useDeleteProjectContract();
    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<string | null>(null);

    const handleDeleteConfirm = async () => {
        if (!contractToDelete) return;
        await deleteContract.mutateAsync(contractToDelete);
        setContractToDelete(null);
    };

    const handleUpdateStatus = async (contractId: string, status: 'sent' | 'signed', signatureId?: string) => {
        await updateContract.mutateAsync({
            id: contractId,
            updates: {
                status,
                signed_at: status === 'signed' ? new Date().toISOString() : null,
                ...(signatureId ? { signature_id: signatureId } : {})
            }
        });
    };

    const handleSendToFirma = async (contract: any) => {
        const toastId = toast.loading("Génération du document (1/2)...");
        try {
            // 1. Generate PDF Blob programmatically
            const blob = await pdf(<ContractPDFDocument contract={contract} profile={profile || null} />).toBlob();

            // 2. Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result?.toString().split(',')[1];
                    if (!base64data) throw new Error("Erreur de conversion PDF");

                    toast.loading("Envoi sécurisé via Firma.dev (2/2)...", { id: toastId });

                    // 3. Call Supabase Edge Function
                    const clientEmail = project?.clients?.email;
                    if (!clientEmail) {
                        throw new Error("Le client n'a pas d'adresse e-mail définie.");
                    }

                    const { data, error } = await supabase.functions.invoke('firma-signature', {
                        headers: {
                            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
                        },
                        body: {
                            pdfBase64: base64data,
                            title: contract.title,
                            clientName: (project?.clients as any)?.contact_name || project?.clients?.name || 'Client',
                            clientEmail: clientEmail
                        }
                    });

                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);

                    // 4. Update status locally to 'sent'
                    await handleUpdateStatus(contract.id, 'sent', data.firmaId);
                    toast.success("Envoyé pour signature avec succès !", { id: toastId });
                } catch (err: any) {
                    console.error("Firma integration error inside onload:", err);
                    toast.error(err.message || "Erreur lors de l'envoi", { id: toastId });
                }
            };

            reader.onerror = () => {
                toast.error("Erreur de lecture du PDF", { id: toastId });
            };
        } catch (err: any) {
            console.error("Firma integration error:", err);
            toast.error(err.message || "Erreur lors de l'envoi", { id: toastId });
        }
    };

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
                            Gérez les documents contractuels pour <strong>{project?.name}</strong>.
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
                                <p className="text-text-muted mb-4">Aucun contrat généré pour ce projet.</p>
                                <Button onClick={() => setGeneratorOpen(true)} className="bg-brand text-white hover:bg-brand-hover">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Créer le premier contrat
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contracts?.map((contract) => (
                                    <div key={contract.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:border-brand/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${contract.status === 'signed' ? 'bg-green-100 text-green-600' :
                                                contract.status === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-surface2 text-text-muted'
                                                }`}>
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-text">{contract.title}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: fr })}
                                                    <span className="mx-1">•</span>
                                                    <span className={`uppercase font-black ${contract.status === 'signed' ? 'text-green-600' :
                                                        contract.status === 'sent' ? 'text-blue-600' : 'text-text-muted'
                                                        }`}>
                                                        {contract.status === 'signed' ? 'Signé' :
                                                            contract.status === 'sent' ? 'En attente de signature' : 'Brouillon'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <PDFDownloadLink
                                                document={<ContractPDFDocument contract={contract} profile={profile || null} />}
                                                fileName={`${contract.title.replace(/\s+/g, '_')}.pdf`}
                                                className="inline-flex items-center justify-center h-8 w-8 text-text-muted hover:text-brand hover:bg-brand-light rounded-md"
                                                title="Télécharger PDF"
                                            >
                                                {({ loading }) => (
                                                    loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />
                                                )}
                                            </PDFDownloadLink>

                                            {contract.status === 'draft' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-[11px] text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleSendToFirma(contract)}
                                                >
                                                    <Send className="h-3 w-3 mr-1" /> Envoyer (Firma)
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-text-muted hover:text-red-500 hover:bg-red-50"
                                                onClick={() => setContractToDelete(contract.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button onClick={() => setGeneratorOpen(true)} variant="outline" className="w-full border-dashed border-2 py-6 border-border hover:border-brand/50 text-text-muted hover:text-brand">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ajouter un autre contrat
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ContractGenerator
                open={generatorOpen}
                onOpenChange={setGeneratorOpen}
                project={project}
            />

            <AlertDialog open={!!contractToDelete} onOpenChange={(open) => !open && setContractToDelete(null)}>
                <AlertDialogContent className="bg-white border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est définitive. Le contrat sera supprimé de votre tableau de bord.
                            (Attention : si le contrat a déjà été envoyé via Firma, il ne sera pas annulé côté client).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                            Oui, supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
