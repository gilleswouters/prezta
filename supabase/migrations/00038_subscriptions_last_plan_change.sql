-- Migration 00038: add last_plan_change_at to subscriptions
-- Dedicated timestamp for the 24h cooldown check in upgrade-subscription Edge Function.
-- updated_at is overwritten by triggers on every UPDATE; this column is only set
-- explicitly by the Edge Function when the plan itself changes.

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS last_plan_change_at TIMESTAMPTZ;
