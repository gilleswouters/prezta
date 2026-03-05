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
    title: string;
    projectId: string;
    clientId?: string;
    lines: QuoteLine[];
    notes?: string;
}

// Calcul Helper Type
export interface QuoteTotals {
    subtotalHT: number;
    tvaAmounts: Record<string, number>; // Groupes de tva: ex { "21": 500, "6": 20 }
    totalTVA: number;
    totalTTC: number;
}
