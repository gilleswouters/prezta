-- Migration: 00020_email_templates.sql
-- Creates the email_templates table with system defaults and user overrides.

CREATE TABLE IF NOT EXISTS public.email_templates (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT        NOT NULL,
    subject     TEXT        NOT NULL,
    body        TEXT        NOT NULL,
    is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one system template per type
CREATE UNIQUE INDEX IF NOT EXISTS email_templates_system_type_idx
    ON public.email_templates (type)
    WHERE is_system = TRUE;

-- Only one user-override per type per user
CREATE UNIQUE INDEX IF NOT EXISTS email_templates_user_type_idx
    ON public.email_templates (user_id, type)
    WHERE is_system = FALSE;

-- RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read system or own templates"
    ON public.email_templates FOR SELECT
    USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Manage own templates"
    ON public.email_templates FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

-- ── System template seeds ─────────────────────────────────────────────────────

INSERT INTO public.email_templates (user_id, is_system, type, subject, body) VALUES

(NULL, TRUE, 'quote_sent',
'Votre devis {{project_name}} est prêt',
'Bonjour {{client_name}},

Je vous transmets votre devis pour le projet **{{project_name}}**.

Vous pouvez le consulter et le télécharger depuis votre espace client sécurisé :
{{portal_link}}

N''hésitez pas à me contacter pour toute question ou ajustement.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'quote_reminder',
'Rappel — votre devis {{project_name}} est en attente',
'Bonjour {{client_name}},

Je me permets de revenir au sujet du devis transmis pour le projet **{{project_name}}**.

Votre espace client reste disponible pour le consulter et me faire part de votre décision :
{{portal_link}}

Je reste disponible pour tout échange ou modification éventuelle.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'invoice_sent',
'Votre facture {{reference}} — {{project_name}}',
'Bonjour {{client_name}},

Veuillez trouver votre facture réf. **{{reference}}** pour le projet **{{project_name}}**.

Montant TTC : {{amount_ttc}} €
Échéance : {{due_date}}

Vous pouvez la consulter et la télécharger via votre espace client :
{{portal_link}}

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'invoice_reminder',
'Relance — facture {{reference}} en attente de règlement',
'Bonjour {{client_name}},

Sauf erreur de ma part, la facture réf. **{{reference}}** d''un montant de **{{amount_ttc}} €**, dont l''échéance était fixée au {{due_date}}, n''a pas encore été réglée.

Je vous invite à procéder au règlement dans les meilleurs délais, ou à me contacter si vous avez la moindre question.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'contract_sent',
'Contrat à signer — {{project_name}}',
'Bonjour {{client_name}},

Je vous adresse le contrat relatif à notre collaboration pour le projet **{{project_name}}**.

Vous pouvez le signer électroniquement depuis votre espace client sécurisé :
{{portal_link}}

Une fois signé, vous recevrez automatiquement un exemplaire certifié.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'project_started',
'Démarrage de notre collaboration — {{project_name}}',
'Bonjour {{client_name}},

J''ai le plaisir de vous confirmer le démarrage officiel du projet **{{project_name}}**.

Vous disposez d''un espace client dédié pour suivre l''avancement et accéder à vos documents :
{{portal_link}}

Je reste disponible à tout moment pour échanger avec vous.

Cordialement,
{{freelance_name}}'),

(NULL, TRUE, 'project_completed',
'Projet {{project_name}} — livraison finale',
'Bonjour {{client_name}},

J''ai le plaisir de vous informer que le projet **{{project_name}}** est terminé et livré dans sa totalité.

Tous vos documents sont disponibles dans votre espace client :
{{portal_link}}

Ce fut un réel plaisir de collaborer avec vous. N''hésitez pas à faire appel à moi pour vos futurs projets.

Cordialement,
{{freelance_name}}')

ON CONFLICT DO NOTHING;
