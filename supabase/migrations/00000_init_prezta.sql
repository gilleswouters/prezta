-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. PROFILES & USERS
-- ==========================================
CREATE TYPE user_country AS ENUM ('BE', 'FR', 'CH');
CREATE TYPE legal_status AS ENUM (
    'independant_be', 
    'auto_entrepreneur_fr', 
    'eurl', 
    'sasu', 
    'srl_be', 
    'sa_be', 
    'autre'
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    country user_country,
    legal_status legal_status,
    company_name TEXT,
    bce_number TEXT,
    siret_number TEXT,
    vat_number TEXT,
    iban TEXT,
    address_street TEXT,
    address_city TEXT,
    address_zip TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (id = auth.uid());

-- Trigger to safely create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 2. CLIENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    vat_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- 3. PRODUCTS (Catalogue)
-- ==========================================
CREATE TYPE product_unit AS ENUM ('heure', 'forfait', 'pièce', 'jour');

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    tva_rate NUMERIC(5,2) DEFAULT 0,
    unit product_unit DEFAULT 'forfait',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- 4. PROJECTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    activity_type TEXT,
    status TEXT DEFAULT 'actif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- 5. INVOICES
-- ==========================================
CREATE TYPE invoice_status AS ENUM ('payé', 'en_attente', 'en_retard');

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status invoice_status DEFAULT 'en_attente',
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (user_id = auth.uid());
