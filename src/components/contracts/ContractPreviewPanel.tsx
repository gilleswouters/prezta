import { BlobProvider } from '@react-pdf/renderer';
import { ContractPDFDocument } from './pdf/ContractPDFDocument';
import type { Profile } from '@/types/profile';
import type { ProjectContract } from '@/types/contract';

interface ContractPreviewPanelProps {
    content: string;
    title: string;
    profile: Profile | null;
    clientName?: string;
}

function buildMockContract(content: string, title: string): ProjectContract {
    return {
        id: 'preview',
        user_id: '',
        project_id: '',
        template_id: null,
        title,
        content,
        contract_type: null,
        clauses: [],
        metadata: { devise: 'EUR' },
        status: 'draft',
        sent_at: null,
        signed_at: null,
        signature_id: null,
        status_history: [],
        version: 1,
        version_of: null,
        expires_at: null,
        expiry_notified_30d: false,
        expiry_notified_7d: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}

export function ContractPreviewPanel({ content, title, profile, clientName }: ContractPreviewPanelProps) {
    const mockContract = buildMockContract(content || '(Contenu vide)', title || 'Aperçu');

    return (
        <div className="w-full h-full">
            <BlobProvider
                document={
                    <ContractPDFDocument
                        contract={mockContract}
                        profile={profile}
                        clientName={clientName}
                    />
                }
            >
                {({ url, loading, error }) => {
                    if (loading) {
                        return (
                            <div className="flex flex-col items-center justify-center w-full h-full gap-3 text-text-muted">
                                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand" />
                                <span className="text-xs">Génération du PDF…</span>
                            </div>
                        );
                    }
                    if (error || !url) {
                        return (
                            <div className="flex items-center justify-center w-full h-full text-red-500 text-sm">
                                Erreur de génération
                            </div>
                        );
                    }
                    return (
                        <iframe
                            src={url}
                            style={{ width: '100%', height: '100%' }}
                            className="border-0"
                            title="Aperçu du contrat"
                        />
                    );
                }}
            </BlobProvider>
        </div>
    );
}
