-- Migration: 00011_document_pipeline_naming.sql

-- 1. Add reference and status to Quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'; -- draft, sent, accepted, rejected

-- 2. Add reference to Project Contracts (already has status: draft, sent, signed)
ALTER TABLE public.project_contracts ADD COLUMN IF NOT EXISTS reference TEXT;

-- 3. Add reference to Invoices (already has status: payé, en_attente, en_retard via enum)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reference TEXT;

-- 4. Shared trigger function to generate references
CREATE OR REPLACE FUNCTION generate_document_reference_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    prefix TEXT;
    search_pattern TEXT;
    max_num INTEGER;
    next_num INTEGER;
    doc_type TEXT;
BEGIN
    -- Only assign a reference if one isn't already provided
    IF NEW.reference IS NULL THEN
        current_year := to_char(CURRENT_DATE, 'YYYY');
        
        IF TG_TABLE_NAME = 'quotes' THEN
            doc_type := 'DEV';
        ELSIF TG_TABLE_NAME = 'project_contracts' THEN
            doc_type := 'CTR';
        ELSIF TG_TABLE_NAME = 'invoices' THEN
            doc_type := 'FAC';
        END IF;

        prefix := doc_type || '-' || current_year || '-';
        search_pattern := prefix || '%';

        IF TG_TABLE_NAME = 'quotes' THEN
            SELECT COALESCE(MAX(NULLIF(regexp_replace(reference, '^' || prefix, ''), '')::INTEGER), 0)
            INTO max_num FROM public.quotes WHERE user_id = NEW.user_id AND reference LIKE search_pattern;
        ELSIF TG_TABLE_NAME = 'project_contracts' THEN
            SELECT COALESCE(MAX(NULLIF(regexp_replace(reference, '^' || prefix, ''), '')::INTEGER), 0)
            INTO max_num FROM public.project_contracts WHERE user_id = NEW.user_id AND reference LIKE search_pattern;
        ELSIF TG_TABLE_NAME = 'invoices' THEN
            SELECT COALESCE(MAX(NULLIF(regexp_replace(reference, '^' || prefix, ''), '')::INTEGER), 0)
            INTO max_num FROM public.invoices WHERE user_id = NEW.user_id AND reference LIKE search_pattern;
        END IF;

        next_num := max_num + 1;
        NEW.reference := prefix || lpad(next_num::TEXT, 3, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach triggers
DROP TRIGGER IF EXISTS trigger_assign_quote_ref ON public.quotes;
CREATE TRIGGER trigger_assign_quote_ref
    BEFORE INSERT ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION generate_document_reference_trigger();

DROP TRIGGER IF EXISTS trigger_assign_contract_ref ON public.project_contracts;
CREATE TRIGGER trigger_assign_contract_ref
    BEFORE INSERT ON public.project_contracts
    FOR EACH ROW EXECUTE FUNCTION generate_document_reference_trigger();

DROP TRIGGER IF EXISTS trigger_assign_invoice_ref ON public.invoices;
CREATE TRIGGER trigger_assign_invoice_ref
    BEFORE INSERT ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION generate_document_reference_trigger();
