-- 00030_time_entries_billed.sql
-- Add billing flag to time entries (Phase 5.4)

ALTER TABLE public.time_entries
    ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT false;
