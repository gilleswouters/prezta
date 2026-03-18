-- Migration: 00018_document_status_history.sql
-- Adds full status lifecycle tracking to quotes and project_contracts.
--
-- status_history: append-only JSONB array of { status, at } entries (managed by
--   the firma-webhook edge function and frontend mutations).
-- sent_at: explicit timestamp set when a document is dispatched for signature /
--   review — used by the dashboard "stale document" alert (7+ days with no reply).

ALTER TABLE public.quotes
    ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

ALTER TABLE public.project_contracts
    ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- No additional RLS policies needed: existing per-user policies on both tables
-- already cover SELECT / INSERT / UPDATE / DELETE for all columns.
