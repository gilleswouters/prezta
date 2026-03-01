export interface Client {
    id: string; // uuid
    user_id: string; // references auth.users
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    vat_number: string | null;
    notes: string | null;
    created_at: string;
}

export type ClientFormData = Omit<Client, 'id' | 'user_id' | 'created_at'>;
