-- ==========================================
-- Patch: Correction de la contrainte 'status'
-- ==========================================
-- Lors de la création de la table, Supabase a ajouté
-- une règle (check constraint) sur les valeurs autorisées pour 'status'.
-- Ce script s'assure que la règle accepte exactement les valeurs du code :
-- 'payé', 'en_attente', 'en_retard'.

ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('payé', 'en_attente', 'en_retard'));
