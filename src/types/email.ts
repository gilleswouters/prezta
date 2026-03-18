export type EmailTemplateType =
    | 'quote_sent'
    | 'quote_reminder'
    | 'invoice_sent'
    | 'invoice_reminder'
    | 'contract_sent'
    | 'project_started'
    | 'project_completed'
    // Payment reminder levels (seeded in migration 00022)
    | 'relance_1'
    | 'relance_2'
    | 'relance_3'
    | 'relance_mise_en_demeure';

export interface EmailTemplate {
    id: string;
    user_id: string | null;
    type: EmailTemplateType;
    subject: string;
    body: string;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
    quote_sent:                 'Devis envoyé',
    quote_reminder:             'Relance devis',
    invoice_sent:               'Facture envoyée',
    invoice_reminder:           'Relance facture (générique)',
    contract_sent:              'Contrat envoyé',
    project_started:            'Démarrage de projet',
    project_completed:          'Fin de mission',
    relance_1:                  'Relance 1 (1–15j)',
    relance_2:                  'Relance 2 (16–30j)',
    relance_3:                  'Relance 3 (31–60j)',
    relance_mise_en_demeure:    'Mise en demeure (60j+)',
};

export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
    quote_sent:                 ['client_name', 'freelance_name', 'project_name', 'portal_link', 'amount_ht'],
    quote_reminder:             ['client_name', 'freelance_name', 'project_name', 'portal_link', 'amount_ht'],
    invoice_sent:               ['client_name', 'freelance_name', 'project_name', 'portal_link', 'reference', 'amount_ttc', 'due_date'],
    invoice_reminder:           ['client_name', 'freelance_name', 'project_name', 'reference', 'amount_ttc', 'due_date'],
    contract_sent:              ['client_name', 'freelance_name', 'project_name', 'portal_link'],
    project_started:            ['client_name', 'freelance_name', 'project_name', 'portal_link'],
    project_completed:          ['client_name', 'freelance_name', 'project_name', 'portal_link'],
    relance_1:                  ['client_name', 'freelance_name', 'reference', 'amount_ttc', 'days_overdue'],
    relance_2:                  ['client_name', 'freelance_name', 'reference', 'amount_ttc', 'days_overdue'],
    relance_3:                  ['client_name', 'freelance_name', 'reference', 'amount_ttc', 'days_overdue'],
    relance_mise_en_demeure:    ['client_name', 'freelance_name', 'reference', 'amount_ttc', 'days_overdue'],
};
