import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { QuoteData, QuoteLine, QuoteTotals } from '@/types/quote';
import type { Product } from '@/types/product';

interface QuoteState {
    data: QuoteData;
    isLoading: boolean;
    pendingTimesheetLines: QuoteLine[] | null;

    // Actions
    initializeQuote: (projectId: string, clientId?: string) => void;
    updateMetadata: (title: string, notes?: string) => void;
    setPendingTimesheetLines: (lines: QuoteLine[] | null) => void;

    // Lignes
    addLine: () => void;
    addProductLine: (product: Product) => void;
    updateLine: (id: string, updates: Partial<QuoteLine>) => void;
    removeLine: (id: string) => void;

    // AI
    setLinesFromAI: (lines: Omit<QuoteLine, 'id'>[]) => void;

    // Re-calcul
    getTotals: () => QuoteTotals;
}

const createEmptyLine = (): QuoteLine => ({
    id: uuidv4(),
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    tvaRate: 20,
    unit: 'heure',
});

export const useQuoteStore = create<QuoteState>((set, get) => ({
    data: {
        title: 'Nouveau Devis',
        projectId: '',
        lines: [createEmptyLine()],
    },
    isLoading: false,
    pendingTimesheetLines: null,

    setPendingTimesheetLines: (lines) => set({ pendingTimesheetLines: lines }),

    initializeQuote: (projectId, clientId) => set({
        data: {
            title: 'Nouveau Devis',
            projectId,
            clientId,
            lines: [createEmptyLine()],
        }
    }),

    updateMetadata: (title, notes) => set((state) => ({
        data: { ...state.data, title, notes }
    })),

    addLine: () => set((state) => ({
        data: { ...state.data, lines: [...state.data.lines, createEmptyLine()] }
    })),

    addProductLine: (product) => set((state) => ({
        data: {
            ...state.data,
            lines: [
                ...state.data.lines,
                {
                    id: uuidv4(),
                    productId: product.id,
                    name: product.name,
                    description: product.description || '',
                    quantity: 1,
                    unitPrice: product.unit_price,
                    tvaRate: product.tva_rate,
                    unit: product.unit,
                }
            ]
        }
    })),

    updateLine: (id, updates) => set((state) => ({
        data: {
            ...state.data,
            lines: state.data.lines.map(line =>
                line.id === id ? { ...line, ...updates } : line
            )
        }
    })),

    removeLine: (id) => set((state) => ({
        data: {
            ...state.data,
            lines: state.data.lines.filter(line => line.id !== id)
        }
    })),

    setLinesFromAI: (newLines) => set((state) => ({
        data: {
            ...state.data,
            lines: newLines.map(line => ({ ...line, id: uuidv4() }))
        }
    })),

    getTotals: () => {
        const lines = get().data.lines;
        let subtotalHT = 0;
        const tvaAmounts: Record<string, number> = {};

        lines.forEach(line => {
            const lineTotalHT = line.quantity * line.unitPrice;
            subtotalHT += lineTotalHT;

            const rateKey = line.tvaRate.toString();
            // tvaRate <= 0 means 0% (auto-entrepreneur) or exonéré → TVA = 0
            const lineTVA = line.tvaRate > 0 ? lineTotalHT * (line.tvaRate / 100) : 0;

            if (!tvaAmounts[rateKey]) tvaAmounts[rateKey] = 0;
            tvaAmounts[rateKey] += lineTVA;
        });

        const totalTVA = Object.values(tvaAmounts).reduce((sum, val) => sum + val, 0);
        const totalTTC = subtotalHT + totalTVA;

        return {
            subtotalHT,
            tvaAmounts,
            totalTVA,
            totalTTC
        };
    }
}));
