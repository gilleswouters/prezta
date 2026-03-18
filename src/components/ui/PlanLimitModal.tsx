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
import { Lock } from 'lucide-react';

interface PlanLimitModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Short label of what is blocked, e.g. "documents", "projets", "signatures FIRMA" */
    limitType: string;
    used: number;
    limit: number;
}

export function PlanLimitModal({ open, onOpenChange, limitType, used, limit }: PlanLimitModalProps) {
    const navigate = useNavigate();

    const handleUpgrade = () => {
        onOpenChange(false);
        navigate('/pricing');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] bg-white border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-text-primary">
                        <Lock className="h-5 w-5 text-amber-500" />
                        Limite du plan atteinte
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary text-sm mt-1">
                        Vous avez atteint la limite de{' '}
                        <span className="font-semibold text-text-primary">{limit} {limitType}</span> de votre plan actuel ({used}/{limit} utilisés).
                        Passez au plan Pro pour un accès illimité.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none"
                    >
                        Plus tard
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        className="flex-1 sm:flex-none bg-brand text-white hover:bg-brand-hover"
                    >
                        Voir les offres →
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
