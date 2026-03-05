export type Jurisdiction = 'FR' | 'BE' | 'CH';

export interface ContractTemplate {
    id: string;
    user_id: string | null;
    name: string;
    description: string | null;
    content: string;
    jurisdiction: Jurisdiction;
    category: string;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProjectContract {
    id: string;
    user_id: string;
    project_id: string;
    template_id: string | null;
    title: string;
    content: string;
    status: 'draft' | 'sent' | 'signed';
    signed_at: string | null;
    signature_id: string | null;
    created_at: string;
    updated_at: string;
}

export type ContractTemplateFormData = Omit<ContractTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_system'>;
export type ProjectContractFormData = Omit<ProjectContract, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'signed_at' | 'signature_id'>;
