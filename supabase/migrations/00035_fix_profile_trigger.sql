-- Migration: 00035_fix_profile_trigger.sql
-- Fix handle_new_user() to be idempotent and set onboarding_completed=true by default
-- Removes forced onboarding flow — users go straight to /dashboard after signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, onboarding_completed)
  VALUES (NEW.id, NEW.email, NOW(), true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for any auth users who don't have one yet
INSERT INTO public.profiles (id, email, created_at, onboarding_completed)
SELECT id, email, created_at, true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Ensure all existing profiles have onboarding_completed = true
-- (so no existing user gets redirected to onboarding)
UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed IS DISTINCT FROM true;
