import { useEffect } from 'react';
import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
    useEffect(() => {
        document.title = 'Prezta — Maintenance en cours';

        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex';
        document.head.appendChild(meta);

        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">

            {/* Wordmark */}
            <p className="text-2xl font-black tracking-tight text-brand mb-10">Prezta</p>

            {/* Icon */}
            <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-8">
                <Wrench className="h-8 w-8 text-brand" />
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-black text-text-primary tracking-tight mb-4">
                Prezta est en maintenance
            </h1>

            {/* Subtext */}
            <p className="text-text-secondary max-w-md text-base leading-relaxed mb-6">
                Nous améliorons votre expérience. Le service sera de retour très prochainement.
            </p>

            {/* Contact */}
            <p className="text-sm text-text-muted">
                Pour toute urgence, contactez-nous :{' '}
                <span className="font-semibold text-text-secondary">support@prezta.eu</span>
            </p>

            {/* Footer */}
            <p className="absolute bottom-6 text-xs text-text-muted">
                © 2026 Prezta · www.prezta.eu
            </p>
        </div>
    );
}
