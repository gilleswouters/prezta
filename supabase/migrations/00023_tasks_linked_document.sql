-- Migration 00023: Add linked_document_id to tasks
-- Allows tasks to reference an associated document (quote / contract / invoice).
-- No FK constraint: document type is polymorphic.

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS linked_document_id UUID;
