-- ── firma_signatures_used tracking on subscriptions ──────────────────────────

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS firma_signatures_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS firma_reset_month      TEXT    DEFAULT to_char(now(), 'YYYY-MM');

-- Auto-increment firma_signatures_used when sent_at transitions NULL → non-NULL
-- Works for both project_contracts and quotes tables.

CREATE OR REPLACE FUNCTION public.increment_firma_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL THEN
        UPDATE public.subscriptions
        SET
            firma_signatures_used = CASE
                WHEN firma_reset_month = to_char(now(), 'YYYY-MM')
                THEN firma_signatures_used + 1
                ELSE 1
            END,
            firma_reset_month = to_char(now(), 'YYYY-MM')
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger on project_contracts
DROP TRIGGER IF EXISTS trg_firma_count_contracts ON public.project_contracts;
CREATE TRIGGER trg_firma_count_contracts
    AFTER UPDATE OF sent_at ON public.project_contracts
    FOR EACH ROW EXECUTE FUNCTION public.increment_firma_count();

-- Trigger on quotes
DROP TRIGGER IF EXISTS trg_firma_count_quotes ON public.quotes;
CREATE TRIGGER trg_firma_count_quotes
    AFTER UPDATE OF sent_at ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.increment_firma_count();

-- ── View: active document counts per user ────────────────────────────────────
-- Uses security_invoker so the calling user's RLS policies apply.

CREATE OR REPLACE VIEW public.user_active_document_counts
WITH (security_invoker = on)
AS
SELECT
    user_id,
    COUNT(*) AS active_count
FROM (
    SELECT user_id FROM public.quotes
    WHERE status NOT IN ('archived', 'rejected')
    UNION ALL
    SELECT user_id FROM public.invoices
    WHERE status != 'archivé'
    UNION ALL
    SELECT pc.user_id FROM public.project_contracts pc
    WHERE pc.status NOT IN ('archived')
) docs
GROUP BY user_id;
