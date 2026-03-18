import { HardDrive } from 'lucide-react';
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
import { formatBytes } from '@/lib/storage';

interface StorageLimitModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    used: number;
    limit: number;
}

export function StorageLimitModal({ open, onOpenChange, used, limit }: StorageLimitModalProps) {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <HardDrive className="h-5 w-5 text-red-600" />
                        </div>
                        <DialogTitle className="text-lg">Limite de stockage atteinte</DialogTitle>
                    </div>
                    <DialogDescription className="text-text-secondary">
                        Vous avez utilisé{' '}
                        <span className="font-semibold text-text-primary">{formatBytes(used)}</span>
                        {' '}sur{' '}
                        <span className="font-semibold text-text-primary">{formatBytes(limit)}</span>
                        {' '}de stockage disponible.
                        <br /><br />
                        Passez au plan Pro pour obtenir <strong>10 Go</strong> de stockage et continuer à téléverser vos fichiers.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        className="bg-brand text-white hover:bg-brand-hover"
                        onClick={() => { onOpenChange(false); navigate('/pricing'); }}
                    >
                        Voir les offres
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
