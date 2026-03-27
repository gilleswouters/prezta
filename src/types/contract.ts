export type Jurisdiction = 'FR';

/** Full status lifecycle for a project contract. */
export type ContractStatus = 'draft' | 'sent' | 'lu' | 'signed' | 'archived';

export interface StatusHistoryEntry {
    status: ContractStatus;
    at: string; // ISO timestamp
}

// ── Contract type enum ────────────────────────────────────────────────────────

export type ContractType =
    | 'prestation_services'
    | 'regie'
    | 'maintenance_support'
    | 'cession_droits'
    | 'contrat_travail_cdi'
    | 'contrat_travail_cdd'
    | 'contrat_alternance';

// ── Clause types ──────────────────────────────────────────────────────────────

export type ClauseCategory =
    | 'identification'
    | 'objet'
    | 'duree'
    | 'remuneration'
    | 'paiement'
    | 'propriete_intellectuelle'
    | 'confidentialite'
    | 'non_concurrence'
    | 'resiliation'
    | 'livrables'
    | 'sla'
    | 'avertissement_juridique'
    | 'litiges';

export interface ContractClause {
    id: string;
    label: string;           // French display label
    content: string;         // Template text with {{variable}} placeholders
    required: boolean;
    category: ClauseCategory;
    appliesTo: ContractType[];
    editableByUser: boolean;
}

// ── Wizard state ──────────────────────────────────────────────────────────────

export interface SelectedCatalogueItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    note: string;
}

export interface ActiveClause {
    clauseId: string;
    enabled: boolean;
    overriddenContent: string | null; // null = use template default
}

export interface SLAConfig {
    heuresSupport: string;         // ex: "9h-18h, lundi-vendredi"
    tempsReponseUrgent: string;    // ex: "4 heures"
    tempsReponseStandard: string;  // ex: "24 heures"
    niveauxCriticite: string[];
}

export interface ContractMetadata {
    tjm?: number;
    forfait?: number;
    devise: 'EUR' | 'CHF';
    acomptePercent?: number;
    penaliteRetardPercent?: number;
    slaConfig?: SLAConfig;
    piTransferCondition?: string;
    nonConcurrenceDureeMonths?: number;
    nonConcurrenceZone?: string;
    // Travail fields
    salaireBase?: number;
    conventionCollective?: string;
    periodeEssaiMonths?: number;
    cddEndDate?: string;
    alternanceDiplome?: string;
    alternanceCfa?: string;
    alternanceMaitreApprentissage?: string;
}

export interface ContractWizardState {
    contractType: ContractType | null;
    clientId: string | null;
    projectId: string | null;
    startDate: string | null;
    endDate: string | null;
    title: string;
    reference: string;
    useCatalogueItems: boolean;
    catalogueMode: 'project_only' | 'full_catalogue';
    selectedCatalogueItems: SelectedCatalogueItem[];
    clauses: ActiveClause[];
    metadata: ContractMetadata;
}

// ── DB model types ────────────────────────────────────────────────────────────

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
    contract_type: ContractType | null;
    clauses: ActiveClause[];
    metadata: ContractMetadata;
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

export interface ContractCatalogueItem {
    id: string;
    contract_id: string;
    product_id: string;
    quantity: number | null;
    unit_price: number | null;
    note: string | null;
    created_at: string;
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
