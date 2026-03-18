-- Migration: 00021_document_versioning.sql
-- Adds version tracking to quotes and project_contracts.

-- Quotes
ALTER TABLE public.quotes
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS version_of UUID REFERENCES public.quotes(id) ON DELETE SET NULL;

-- Project contracts
ALTER TABLE public.project_contracts
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS version_of UUID REFERENCES public.project_contracts(id) ON DELETE SET NULL;
