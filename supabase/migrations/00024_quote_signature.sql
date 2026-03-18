-- Add signature_id to quotes to store the Firma signing request ID
ALTER TABLE public.quotes
    ADD COLUMN IF NOT EXISTS signature_id TEXT;
