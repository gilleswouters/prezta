import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getProfileCompleteness } from '@/lib/pdf/legal-mentions';
import type { Profile } from '@/types/profile';

interface ProfileCompleteBannerProps {
    profile: Profile | null | undefined;
}

export function ProfileCompleteBanner({ profile }: ProfileCompleteBannerProps) {
    const navigate = useNavigate();
    const { isComplete, missingFields } = getProfileCompleteness(profile ?? null);

    if (isComplete) return null;

    return (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <div className="flex-1 min-w-0">
                <span className="font-semibold">Profil incomplet — </span>
                <span>les PDFs générés pourraient manquer de mentions légales obligatoires. </span>
                <span className="text-amber-700">
                    Champs manquants : {missingFields.join(', ')}.
                </span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-amber-700 hover:bg-amber-100 hover:text-amber-900 shrink-0"
                onClick={() => navigate('/profil')}
            >
                Compléter
            </Button>
        </div>
    );
}
