-- Migration 00037: subscription_history table
-- Tracks plan changes (upgrade / downgrade / cancel / resume) for display in ProfilePage.

CREATE TABLE IF NOT EXISTS public.subscription_history (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_plan        TEXT        NOT NULL,
    to_plan          TEXT        NOT NULL,
    changed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    lemon_squeezy_id TEXT,
    reason           TEXT        -- 'upgrade' | 'downgrade' | 'cancel' | 'resume' | 'webhook'
);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_history"
    ON public.subscription_history
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "service_role_insert_history"
    ON public.subscription_history
    FOR INSERT
    WITH CHECK (true);
