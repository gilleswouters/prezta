export type Jurisdiction = 'FR';

/** Full status lifecycle for a project contract. */
export type ContractStatus = 'draft' | 'sent' | 'lu' | 'signed' | 'archived';

export interface StatusHistoryEntry {
    status: ContractStatus;
    at: string; // ISO timestamp
}

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
    reference?: string;
    user_id: string;
    project_id: string;
    template_id: string | null;
    title: string;
    content: string;
    status: ContractStatus;
    /** Set when the document is dispatched for signature via Firma. */
    sent_at: string | null;
    signed_at: string | null;
    signature_id: string | null;
    /** Append-only history: [{ status, at }] managed by webhook + mutations. */
    status_history: StatusHistoryEntry[];
    /** Version number within a version chain. Defaults to 1. */
    version: number;
    /** UUID of the contract this was derived from, or null if this is the root. */
    version_of: string | null;
    /** Optional expiry date — drives J-30 and J-7 cron alerts. */
    expires_at: string | null;
    expiry_notified_30d: boolean;
    expiry_notified_7d: boolean;
    created_at: string;
    updated_at: string;
}

export type ContractTemplateFormData = Omit<
    ContractTemplate,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_system'
>;

export type ProjectContractFormData = Omit<
    ProjectContract,
    | 'id'
    | 'user_id'
    | 'created_at'
    | 'updated_at'
    | 'signed_at'
    | 'signature_id'
    | 'sent_at'
    | 'status_history'
    | 'expires_at'
    | 'expiry_notified_30d'
    | 'expiry_notified_7d'
>;
