export const Unit = {
    HEURE: 'heure',
    FORFAIT: 'forfait',
    PIECE: 'pièce',
    JOUR: 'jour'
} as const;

export type Unit = typeof Unit[keyof typeof Unit];

export const TVA_RATES = {
    BE: [21, 12, 6, 0],
    FR: [20, 10, 5.5, 0],
    CH: [8.1, 3.8, 2.6, 0]
} as const;

export interface Product {
    id: string; // uuid
    user_id: string; // references auth.users
    name: string;
    description: string | null;
    unit_price: number;
    tva_rate: number;
    unit: Unit;
    is_favorite: boolean;
    category: string | null;
    created_at: string;
}

export type ProductFormData = Omit<Product, 'id' | 'user_id' | 'created_at' | 'is_favorite'>;
