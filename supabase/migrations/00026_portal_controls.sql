-- Add portal control columns to projects
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS portal_enabled    BOOLEAN   NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS portal_expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days');
