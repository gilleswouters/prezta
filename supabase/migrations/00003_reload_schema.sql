-- ==========================================
-- Patch: Forcer le rechargement du schéma
-- ==========================================
-- Ce script ordonne à l'API Supabase de rafraîchir 
-- sa liste de colonnes pour pouvoir voir 'notes'.

DO $$ 
BEGIN 
  PERFORM pg_notify('pgrst', 'reload schema'); 
END $$;
