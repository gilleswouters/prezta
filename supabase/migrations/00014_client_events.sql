-- Migration: Create client_events table for timeline
CREATE TYPE client_event_type AS ENUM ('note', 'email', 'call', 'system');

CREATE TABLE IF NOT EXISTS public.client_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type client_event_type NOT NULL DEFAULT 'note',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Client Events
ALTER TABLE public.client_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own client events" ON public.client_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own client events" ON public.client_events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own client events" ON public.client_events FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own client events" ON public.client_events FOR DELETE USING (user_id = auth.uid());
