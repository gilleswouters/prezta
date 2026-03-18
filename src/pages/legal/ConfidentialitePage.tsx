import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfidentialitePage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-white px-6 py-16 max-w-2xl mx-auto">
            <Button variant="ghost" className="mb-8 -ml-2 text-text-muted hover:text-text-primary" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <h1 className="text-3xl font-extrabold text-text-primary mb-4">Politique de confidentialité</h1>
            <p className="text-text-secondary mb-6">Ce document est en cours de rédaction.</p>
            <p className="text-text-secondary text-sm">
                Pour toute question : <a href="mailto:support@prezta.eu" className="text-brand hover:underline">support@prezta.eu</a>
            </p>
        </div>
    );
}
