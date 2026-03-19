-- Add onboarding_completed flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Mark ALL existing users as completed so they are not trapped in the loop
UPDATE public.profiles
  SET onboarding_completed = true
  WHERE onboarding_completed IS NULL OR onboarding_completed = false;
