import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { ContractPDFDocument } from '@/components/contracts/pdf/ContractPDFDocument';
import type { Profile } from '@/types/profile';
import type { ProjectContract } from '@/types/contract';

function buildMockContract(content: string, title: string): ProjectContract {
    return {
        id: 'download',
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

export function useContractPDF() {
    async function downloadContractPDF(
        content: string,
        title: string,
        profile: Profile | null,
        filename?: string,
        clientName?: string,
    ) {
        const contract = buildMockContract(content, title);
        const element = createElement(ContractPDFDocument, { contract, profile, clientName });
        const blob = await pdf(element).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename ?? `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return { downloadContractPDF };
}
