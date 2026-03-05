import { Unit } from './product';

export interface QuoteLine {
    id: string; // Temporaire pendant l'édition
    productId?: string; // Si importé depuis catalogue
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    tvaRate: number;
    unit: Unit;
}

export interface QuoteData {
    id?: string;
    reference?: string;
    title: string;
    projectId: string;
    clientId?: string;
    lines: QuoteLine[];
    notes?: string;
    status?: 'draft' | 'sent' | 'accepted' | 'rejected';
}

// Calcul Helper Type
export interface QuoteTotals {
    subtotalHT: number;
    tvaAmounts: Record<string, number>; // Groupes de tva: ex { "21": 500, "6": 20 }
    totalTVA: number;
    totalTTC: number;
}
