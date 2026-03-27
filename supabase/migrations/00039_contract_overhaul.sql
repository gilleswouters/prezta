-- Migration: 00039_contract_overhaul.sql
-- Adds project dates, contract type enum, structured clauses + metadata,
-- and contract ↔ catalogue (products) junction table.

-- ── 1. Project dates ──────────────────────────────────────────────────────────

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- ── 2. Contract type enum ─────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type') THEN
    CREATE TYPE contract_type AS ENUM (
      'prestation_services',
      'regie',
      'maintenance_support',
      'cession_droits',
      'contrat_travail_cdi',
      'contrat_travail_cdd',
      'contrat_alternance'
    );
  END IF;
END$$;

-- ── 3. Extend project_contracts ───────────────────────────────────────────────

ALTER TABLE public.project_contracts
  ADD COLUMN IF NOT EXISTS contract_type contract_type,
  ADD COLUMN IF NOT EXISTS clauses       JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata      JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── 4. Contract ↔ catalogue (products) junction table ────────────────────────
-- Note: catalogue items are stored in the `products` table in this codebase.

CREATE TABLE IF NOT EXISTS public.contract_catalogue_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES public.project_contracts(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES public.products(id)           ON DELETE RESTRICT,
  quantity    NUMERIC,
  unit_price  NUMERIC,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.contract_catalogue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own contract_catalogue_items"
  ON public.contract_catalogue_items
  FOR ALL
  USING (
    contract_id IN (
      SELECT id FROM public.project_contracts WHERE user_id = auth.uid()
    )
  );
