import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

// All LS subscription statuses we surface in the UI.
// Include expired/unpaid so the app can show upgrade prompts for those states.
const ACTIVE_STATUSES = ['active', 'on_trial', 'past_due', 'paused', 'cancelled', 'unpaid', 'expired'] as const;

export function useSubscription() {
    const { session } = useAuth();

    return useQuery({
        queryKey: ['subscription', session?.user.id],
        queryFn: async () => {
            if (!session?.user.id) return {
                plan: 'trial', isPro: false, firmaUsed: 0,
                currentPeriodEnd: null, status: null,
                billingCycle: 'monthly', isCancelled: false, isPastDue: false,
                isExpired: false, isPaused: false, pauseResumesAt: null, hasAccess: false,
                lemonSqueezyId: null,
            };

            // Fetch any subscription row — cancelled/expired rows still hold useful UI data
            const { data, error } = await supabase
                .from('subscriptions')
                .select('plan, status, firma_signatures_used, firma_reset_month, current_period_end, cancelled_at, billing_cycle, pause_resumes_at, lemon_squeezy_id')
                .eq('user_id', session.user.id)
                .in('status', ACTIVE_STATUSES)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            // Normalize legacy 'free' (DB column default) to 'trial' so all
            // downstream === 'trial' checks work regardless of what the DB stored.
            const rawPlan          = data?.plan || 'trial';
            const plan             = rawPlan === 'free' ? 'trial' : rawPlan;
            const status           = data?.status ?? null;
            const isPro            = plan === 'pro' && status === 'active';
            const firmaUsed        = data?.firma_signatures_used ?? 0;
            const currentPeriodEnd = data?.current_period_end ?? null;
            const isCancelled      = status === 'cancelled';
            const isPastDue        = status === 'past_due' || status === 'unpaid';
            const isExpired        = status === 'expired';
            const isPaused         = status === 'paused';
            const pauseResumesAt   = data?.pause_resumes_at ?? null;
            // hasAccess: active OR cancelled-but-still-in-period for paid plans
            const hasAccess        = (plan === 'starter' || plan === 'pro') &&
                (status === 'active' ||
                 (status === 'cancelled' && !!currentPeriodEnd && new Date(currentPeriodEnd) > new Date()));

            return {
                plan, isPro, firmaUsed, currentPeriodEnd, status,
                billingCycle:    data?.billing_cycle ?? 'monthly',
                isCancelled, isPastDue, isExpired, isPaused,
                pauseResumesAt, hasAccess,
                lemonSqueezyId:  data?.lemon_squeezy_id ?? null,
            };
        },
        enabled: !!session?.user.id,
        staleTime: 0,                // always treat cached data as stale — refetch on every focus/interval
        refetchOnWindowFocus: true,  // re-check when user tabs back after paying
        refetchInterval: 10_000,     // poll every 10 s so plan updates shortly after webhook fires
    });
}
