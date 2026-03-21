-- ── Subscription lifecycle columns ───────────────────────────────────────────
-- Adds fields needed to track every LS subscription state change.

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS billing_cycle      TEXT,                  -- 'monthly' | 'annual'
    ADD COLUMN IF NOT EXISTS cancelled_at       TIMESTAMPTZ,           -- when cancellation was requested
    ADD COLUMN IF NOT EXISTS pause_resumes_at   TIMESTAMPTZ,           -- when a paused sub will resume
    ADD COLUMN IF NOT EXISTS trial_ends_at      TIMESTAMPTZ;           -- LS-managed trial end (unused by Prezta but stored)

-- ── Status constraint ─────────────────────────────────────────────────────────
-- Extend to include every status LS can send.

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
    CHECK (status = ANY (ARRAY[
        'active',    -- paying, full access
        'cancelled', -- cancelled but access until current_period_end
        'expired',   -- period ended, no access
        'paused',    -- billing paused, no access
        'past_due',  -- payment failed, grace period active
        'unpaid',    -- payment failed, suspended
        'free'       -- legacy free row (normalised to trial in app)
    ]));

-- ── Plan constraint ───────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan = ANY (ARRAY['free', 'starter', 'pro']));
