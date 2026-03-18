-- ── Seasonality alert tracking on profiles ─────────────────────────────────────
--
-- last_seasonality_alert_sent_at: guards against duplicate alerts within a month
-- seasonality_enabled: user opt-out switch (default ON)

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_seasonality_alert_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seasonality_enabled             BOOLEAN NOT NULL DEFAULT true;
