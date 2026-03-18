-- Ensure seeded system contract templates (those with no user_id from migration 00017) are marked as system templates
UPDATE public.contract_templates
SET is_system = true
WHERE user_id IS NULL AND is_system IS NOT TRUE;
