-- Migration: 00005_contract_templates.sql

-- 1. Contract Templates (Standard & User-defined)
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Template with placeholders {{client_name}}, etc.
    jurisdiction user_country NOT NULL DEFAULT 'FR',
    category TEXT DEFAULT 'general',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view system templates" 
    ON public.contract_templates FOR SELECT 
    USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can manage own templates" 
    ON public.contract_templates FOR ALL 
    USING (user_id = auth.uid());

-- 2. Project Contracts (The actual documents generated from templates)
CREATE TABLE IF NOT EXISTS public.project_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- The final text with variables replaced
    status TEXT DEFAULT 'draft', -- draft, sent, signed
    signed_at TIMESTAMPTZ,
    signature_id TEXT, -- For future electronic signature integration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_contracts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own project contracts" 
    ON public.project_contracts FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own project contracts" 
    ON public.project_contracts FOR ALL 
    USING (user_id = auth.uid());
