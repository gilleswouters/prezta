import { Unit } from './product';

/** Full status lifecycle for a quote (devis). */
export type QuoteStatus = 'draft' | 'sent' | 'lu' | 'accepted' | 'rejected' | 'archived';

export interface StatusHistoryEntry {
    status: QuoteStatus;
    at: string; // ISO timestamp
}

export interface QuoteLine {
    id: string; // Temporaire pendant l'édition
    productId?: string; // Si importé depuis catalogue
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    tvaRate: number; // -1 = exonéré
    unit: Unit;
    unite_custom?: string; // when unit = 'autre'
}

export interface QuoteData {
    id?: string;
    reference?: string;
    title: string;
    projectId: string;
    clientId?: string;
    lines: QuoteLine[];
    notes?: string;
    status?: QuoteStatus;
    sent_at?: string | null;
    status_history?: StatusHistoryEntry[];
    /** Version number within a version chain. Defaults to 1. */
    version?: number;
    /** UUID of the quote this was derived from, or null if this is the root. */
    version_of?: string | null;
    created_at?: string;
}

// Calcul Helper Type
export interface QuoteTotals {
    subtotalHT: number;
    tvaAmounts: Record<string, number>; // Groupes de tva: ex { "21": 500, "6": 20 }
    totalTVA: number;
    totalTTC: number;
}
