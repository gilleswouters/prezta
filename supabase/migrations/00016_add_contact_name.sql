-- Add contact_name column to clients table
-- Stores the individual contact person's name, separate from the company name.
-- Used as the signer name when sending contracts via Firma e-signature.

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_name TEXT;
