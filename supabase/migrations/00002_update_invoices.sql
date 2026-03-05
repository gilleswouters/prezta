-- ==========================================
-- Patch: Mise à jour de la table Invoices
-- ==========================================
-- Cette migration s'assure que les nouvelles colonnes nécessaires
-- pour le Registre de Facturation existent bien dans la base de données.

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Forcer le rafraîchissement du cache de Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
