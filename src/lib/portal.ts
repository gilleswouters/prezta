import { supabase } from '@/lib/supabase';

/** Fallback when the LS API call fails or no subscription ID is available. */
const LS_BILLING_FALLBACK = 'https://app.lemonsqueezy.com/billing';

/**
 * Fetch the personalised customer portal URL from Lemon Squeezy and open it
 * in a new tab. Falls back to the generic billing page on any error.
 */
export async function openPortal(lsId: string | null | undefined): Promise<void> {
    if (lsId) {
        try {
            const { data, error } = await supabase.functions.invoke('get-portal-url', {
                body: { lemon_squeezy_id: lsId },
            });
            if (!error && typeof (data as { url?: unknown })?.url === 'string') {
                window.open((data as { url: string }).url, '_blank');
                return;
            }
        } catch {
            // fall through to fallback
        }
    }
    window.open(LS_BILLING_FALLBACK, '_blank');
}
