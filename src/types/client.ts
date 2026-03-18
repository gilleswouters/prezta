export interface Client {
    id: string; // uuid
    user_id: string; // references auth.users
    name: string;
    contact_name: string | null; // individual contact person / signer name
    email: string | null;
    phone: string | null;
    address: string | null;
    vat_number: string | null;
    notes: string | null;
    siret: string | null;
    legal_status: string | null;
    category: string | null;
    created_at: string;
}

export type ClientFormData = Omit<Client, 'id' | 'user_id' | 'created_at'>;

export type ClientEventType = 'note' | 'email' | 'call' | 'system';

export interface ClientEvent {
    id: string; // uuid
    client_id: string; // uuid
    user_id: string; // uuid
    type: ClientEventType;
    content: string;
    created_at: string;
}

export type ClientEventFormData = Pick<ClientEvent, 'client_id' | 'type' | 'content'>;

