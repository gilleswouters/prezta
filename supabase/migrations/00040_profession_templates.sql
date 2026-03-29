-- ─── Profession templates (system read-only data) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.profession_templates (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      TEXT UNIQUE NOT NULL,
  nom       TEXT NOT NULL,
  categorie TEXT NOT NULL,
  icon      TEXT
);

CREATE TABLE IF NOT EXISTS public.profession_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id UUID REFERENCES public.profession_templates(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  description   TEXT,
  unite         TEXT NOT NULL DEFAULT 'forfait',
  tva_taux      DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  ordre         INTEGER NOT NULL DEFAULT 0
);

-- RLS: public read (system data — no user can mutate)
ALTER TABLE public.profession_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profession_tasks      ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profession_templates' AND policyname = 'public_read_professions'
  ) THEN
    CREATE POLICY "public_read_professions"
      ON public.profession_templates FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profession_tasks' AND policyname = 'public_read_tasks'
  ) THEN
    CREATE POLICY "public_read_tasks"
      ON public.profession_tasks FOR SELECT USING (true);
  END IF;
END $$;

-- ─── Add profession fields to profiles ───────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profession_slug   TEXT,
  ADD COLUMN IF NOT EXISTS profession_custom TEXT;
