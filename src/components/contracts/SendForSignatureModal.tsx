import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send, User, Mail, FileText, ShieldCheck, Lock } from 'lucide-react';

interface SendForSignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    signerName: string;
    signerEmail: string;
    documentTitle: string;
    documentType: string; // e.g. 'Contrat' | 'Devis'
    onConfirm: () => void;
    /** When false, shows an upgrade prompt instead of the confirmation flow */
    canUseFirma?: boolean;
}

export function SendForSignatureModal({
    open,
    onOpenChange,
    signerName,
    signerEmail,
    documentTitle,
    documentType,
    onConfirm,
    canUseFirma = true,
}: SendForSignatureModalProps) {
    const navigate = useNavigate();

    const handleConfirm = () => {
        onOpenChange(false);
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px] bg-white border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-text-primary">
                        {canUseFirma ? (
                            <ShieldCheck className="h-5 w-5 text-brand" />
                        ) : (
                            <Lock className="h-5 w-5 text-amber-500" />
                        )}
                        {canUseFirma ? "Confirmer l'envoi pour signature" : 'Fonctionnalité Pro'}
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary text-sm mt-1">
                        {canUseFirma ? (
                            <>
                                Le document sera envoyé au signataire via{' '}
                                <span className="font-semibold text-text-primary">Firma.dev</span>. Le
                                client recevra un email avec un lien de signature sécurisé.
                            </>
                        ) : (
                            "La signature électronique FIRMA est disponible à partir du plan Pro. Passez au Pro pour envoyer des documents à signer en ligne."
                        )}
                    </DialogDescription>
                </DialogHeader>

                {canUseFirma ? (
                    <div className="space-y-3 py-2">
                        {/* Document info */}
                        <div className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
                            <div className="h-9 w-9 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-brand" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                    {documentType}
                                </p>
                                <p className="font-semibold text-sm text-text-primary truncate">
                                    {documentTitle}
                                </p>
                            </div>
                        </div>

                        {/* Signer info */}
                        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                                Signataire
                            </p>
                            <div className="flex items-center gap-2 text-sm text-text-primary">
                                <User className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                <span className="font-semibold">{signerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <Mail className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                <span>{signerEmail}</span>
                            </div>
                        </div>
                    </div>
                ) : null}

                <DialogFooter className="gap-2 mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none"
                    >
                        {canUseFirma ? 'Annuler' : 'Plus tard'}
                    </Button>
                    {canUseFirma ? (
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 sm:flex-none bg-brand text-white hover:bg-brand-hover"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Confirmer l&apos;envoi
                        </Button>
                    ) : (
                        <Button
                            onClick={() => { onOpenChange(false); navigate('/pricing'); }}
                            className="flex-1 sm:flex-none bg-brand text-white hover:bg-brand-hover"
                        >
                            Voir les offres →
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
