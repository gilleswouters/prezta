-- SCRIPT FINAL : RÉPARATION ET TEST DU PROFIL
-- Ce script ajoute les colonnes manquantes et remplit votre profil de test.

-- 1. Ajout des colonnes (si elles n'existent pas encore)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_role TEXT;

-- 2. Mise à jour avec vos données de test
UPDATE public.profiles
SET 
    full_name = 'Gilles Wouters',
    phone = '+32 470 12 34 56',
    company_name = 'Wouters Digital Solutions',
    country = 'BE',
    legal_status = 'srl_be',
    bce_number = '0765.432.109',
    vat_number = 'BE0765432109',
    iban = 'BE68 0012 3456 7890',
    address_street = 'Avenue Louise 500',
    address_zip = '1050',
    address_city = 'Bruxelles',
    legal_representative_name = 'Gilles Wouters',
    legal_representative_role = 'Gérant',
    updated_at = NOW()
WHERE id = auth.uid();
