-- Migration: 00006_profile_legal_rep.sql
-- Add fields for the legal representative of the company/freelancer

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_role TEXT;

-- Update the trigger function if it explicitly listed columns (in Prezta it usually uses * or just inserts auth user data, but good practice to note)
-- The existing profiles table is mostly updated via the UI, so adding columns is sufficient.
