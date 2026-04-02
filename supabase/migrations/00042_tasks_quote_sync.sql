-- FIX 8: Quote ↔ Tasks sync
-- Adds source tracking and quote reference to tasks table
-- source: 'manual' (default) | 'quote' (auto-created from a quote line)

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tasks.source IS 'Origin of the task: manual (user-created) or quote (auto-created from a quote line)';
COMMENT ON COLUMN public.tasks.quote_id IS 'The quote this task was generated from, if source = quote';
