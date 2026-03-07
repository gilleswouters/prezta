-- Migration: Add siret and legal_status to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS siret TEXT,
ADD COLUMN IF NOT EXISTS legal_status TEXT;
