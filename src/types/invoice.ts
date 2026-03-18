export const InvoiceStatus = {
    PAID: 'payé',
    PENDING: 'en_attente',
    LATE: 'en_retard',
    ARCHIVED: 'archivé',
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
    last_reminder_date: string | null; // ISO Date String (legacy)
    last_reminder_sent_at: string | null; // ISO Timestamp — updated on each AI reminder send
    reminder_count: number; // incremented on each send
    created_at: string;
}

export type InvoiceFormData = Omit<
    Invoice,
    'id' | 'reference' | 'user_id' | 'created_at' | 'last_reminder_date' | 'last_reminder_sent_at' | 'reminder_count'
>;

export interface InvoiceWithProject extends Invoice {
    projects: {
        name: string;
        clients: {
            name: string;
            email: string | null;
            contact_name: string | null;
        } | null;
    } | null;
}
