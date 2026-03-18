-- Migration: 00019_quote_viewed_at.sql
-- Adds viewed_at timestamp to track when clients first open the portal with a sent quote.

ALTER TABLE public.quotes
    ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
