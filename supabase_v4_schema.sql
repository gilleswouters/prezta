-- PREZTA — SCHÉMA SUPABASE V4 
-- Exécutez ce script intégralement dans l'éditeur SQL de Supabase
-- Il crée les tables manquantes (IF NOT EXISTS), et configure les RLS pour les abonnements.

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  country text CHECK (country IN ('BE', 'FR', 'CH')),
  legal_status text,
  company_name text,
  bce_number text,
  siret_number text,
  vat_number text,
  iban text,
  address_street text,
  address_city text,
  address_zip text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  vat_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. PRODUCTS (CATALOGUE)
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  unit_price numeric(10,2) NOT NULL,
  tva_rate numeric(4,2) NOT NULL,
  unit text CHECK (unit IN ('heure', 'forfait', 'pièce', 'jour')),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  status text CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
  expected_documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients ON DELETE SET NULL,
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  amount text,
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status text CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. TIME ENTRIES
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects ON DELETE SET NULL,
  description text,
  duration_minutes integer NOT NULL,
  entry_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. SUBSCRIPTIONS (Lemon Squeezy integration)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  plan text CHECK (plan IN ('free', 'pro')) DEFAULT 'free',
  status text CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')) DEFAULT 'active',
  lemon_squeezy_id text,
  lemon_squeezy_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activez RLS sur les nouvelles tables de la roadmap
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Ajout des Policies Supabase si elles n'existent pas pour les abonnements
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
CREATE POLICY "Users can read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Fonction de vérification de statuts pour the Backend Edge Function
CREATE OR REPLACE FUNCTION get_user_plan(uid uuid)
RETURNS text AS $$
  SELECT plan FROM subscriptions 
  WHERE user_id = uid AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger Automatique : Attribution du statut "Free" à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();

-- =========================================================================
-- ATTENTION : ACCÈS PRO MANUEL POUR TEST
-- Remplacez 'TON-USER-ID-ICI' par votre ID utilisateur copié depuis Auth -> Users
-- =========================================================================

-- INSERT INTO subscriptions (user_id, plan, status) 
-- VALUES ('TON-USER-ID-ICI', 'pro', 'active')
-- ON CONFLICT (user_id) 
-- DO UPDATE SET plan = 'pro', status = 'active';
