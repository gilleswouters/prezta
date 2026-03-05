export const InvoiceStatus = {
    PAID: 'payé',
    PENDING: 'en_attente',
    LATE: 'en_retard'
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export interface Invoice {
    id: string; // uuid
    reference?: string;
    user_id: string;
    project_id: string | null;
    amount: number;
    status: InvoiceStatus;
    due_date: string | null; // ISO Date String
    paid_date: string | null; // ISO Date String
    notes: string | null;
    last_reminder_date: string | null; // ISO Date String
    created_at: string;
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'reference' | 'user_id' | 'created_at' | 'last_reminder_date'>;

export interface InvoiceWithProject extends Invoice {
    projects: {
        name: string;
    } | null;
}
