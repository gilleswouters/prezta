-- ── Fournisseurs ──────────────────────────────────────────────────────────────

CREATE TABLE public.fournisseurs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  contact_nom TEXT,
  email       TEXT,
  telephone   TEXT,
  site_web    TEXT,
  adresse     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.fournisseur_produits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fournisseur_id UUID NOT NULL REFERENCES public.fournisseurs(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  description    TEXT,
  prix_unitaire  DECIMAL(10,2),
  unite          TEXT DEFAULT 'unité',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.achats_fournisseurs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_id        UUID NOT NULL REFERENCES public.fournisseurs(id) ON DELETE CASCADE,
  projet_id             UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  description           TEXT NOT NULL,
  montant               DECIMAL(10,2) NOT NULL,
  date_achat            DATE NOT NULL,
  date_livraison_prevue DATE,
  date_livraison_reelle DATE,
  statut                TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'commande', 'expedie', 'recu', 'en_retard', 'annule')),
  rappel_envoye         BOOLEAN DEFAULT false,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.fournisseurs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseur_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achats_fournisseurs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_fournisseurs" ON public.fournisseurs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_fournisseur_produits" ON public.fournisseur_produits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.fournisseurs f
      WHERE f.id = fournisseur_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "user_achats" ON public.achats_fournisseurs
  FOR ALL USING (user_id = auth.uid());
