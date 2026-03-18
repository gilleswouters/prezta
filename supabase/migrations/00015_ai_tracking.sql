-- Migration: Create ai_usage_logs table for token tracking

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    action VARCHAR(50) NOT NULL DEFAULT 'chat',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries on a specific user
CREATE INDEX idx_ai_usage_user_id ON public.ai_usage_logs(user_id);

-- Secure AI Usage Logs (RLS)
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view own AI logs" 
ON public.ai_usage_logs FOR SELECT 
USING (user_id = auth.uid());

-- Service role or Edge Functions can insert logs (we bypass RLS from the backend)
-- But we can also allow inserts if user_id matches auth.uid()
CREATE POLICY "Users can insert own AI logs" 
ON public.ai_usage_logs FOR INSERT 
WITH CHECK (user_id = auth.uid());
