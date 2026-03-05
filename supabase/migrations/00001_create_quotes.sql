-- ==========================================
-- 6. QUOTES (Devis)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nouveau Devis',
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_project_quote UNIQUE(project_id)
);

-- Secure Quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own quotes" ON public.quotes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own quotes" ON public.quotes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own quotes" ON public.quotes FOR DELETE USING (user_id = auth.uid());
