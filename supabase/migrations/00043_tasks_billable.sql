-- FIX 1: Add billable/prestation fields to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS facturable    BOOLEAN        DEFAULT false,
  ADD COLUMN IF NOT EXISTS prix_estime   DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS inclus_devis  BOOLEAN        DEFAULT false,
  ADD COLUMN IF NOT EXISTS devis_id      UUID           REFERENCES public.quotes(id) ON DELETE SET NULL;

-- FIX 6: Allow multiple quotes per project (enables versioning)
-- The original migration 00001 added UNIQUE(project_id) — drop it.
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_project_id_key;

-- Ensure version column exists (migration 00021 added it, guard just in case)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
