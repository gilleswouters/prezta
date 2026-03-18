-- Migration: 00022_invoice_reminder_tracking.sql
-- Adds reminder tracking columns to invoices and seeds 4 payment reminder email templates.

ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;

-- ── Reminder email template seeds ────────────────────────────────────────────

INSERT INTO public.email_templates (user_id, is_system, type, subject, body) VALUES

(NULL, TRUE, 'relance_1',
'Rappel de paiement — facture {{reference}}',
'Bonjour {{client_name}},

Je me permets de vous rappeler que la facture réf. **{{reference}}** d''un montant de **{{amount_ttc}} €** est arrivée à échéance il y a {{days_overdue}} jour(s).

Si vous avez déjà procédé au règlement, veuillez ignorer ce message.

Dans le cas contraire, je vous invite à régulariser la situation dans les meilleurs délais.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'relance_2',
'2e relance — facture {{reference}} impayée',
'Bonjour {{client_name}},

Malgré mon précédent message, la facture réf. **{{reference}}** d''un montant de **{{amount_ttc}} €** reste impayée depuis {{days_overdue}} jours.

Je vous recontacte afin de régulariser cette situation dans les plus brefs délais. Si vous rencontrez des difficultés, n''hésitez pas à me contacter pour convenir d''un arrangement.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'relance_3',
'3e relance — règlement urgent requis — {{reference}}',
'Bonjour {{client_name}},

Je me vois dans l''obligation de vous contacter une troisième fois concernant la facture réf. **{{reference}}** d''un montant de **{{amount_ttc}} €**, qui demeure impayée depuis {{days_overdue}} jours.

Sans retour de votre part sous 5 jours ouvrés, je me verrai contraint d''engager les procédures de recouvrement prévues par la loi.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'relance_mise_en_demeure',
'Mise en demeure — facture {{reference}}',
'Bonjour {{client_name}},

Par la présente, je vous mets en demeure de régler la facture réf. **{{reference}}** d''un montant de **{{amount_ttc}} €**, échue depuis {{days_overdue}} jours.

Conformément aux articles L441-6 et D441-5 du Code de Commerce, des pénalités de retard et une indemnité forfaitaire de recouvrement de 40 € sont exigibles de plein droit.

À défaut de règlement sous 8 jours, j''engagerai les poursuites judiciaires appropriées.

Cordialement,
{{freelance_name}}')

ON CONFLICT DO NOTHING;
