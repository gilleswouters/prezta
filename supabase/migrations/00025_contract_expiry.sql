-- Add expiry tracking columns to project_contracts
-- RLS is inherited from the existing row-level security policy on project_contracts

ALTER TABLE public.project_contracts
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expiry_notified_30d BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS expiry_notified_7d BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient daily cron scan
CREATE INDEX IF NOT EXISTS idx_project_contracts_expires_at
    ON public.project_contracts (expires_at)
    WHERE expires_at IS NOT NULL;
