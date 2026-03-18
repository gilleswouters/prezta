import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useSubscription() {
    const { session } = useAuth();

    return useQuery({
        queryKey: ['subscription', session?.user.id],
        queryFn: async () => {
            if (!session?.user.id) return { plan: 'trial', isPro: false };

            const { data, error } = await supabase
                .from('subscriptions')
                .select('plan, status, firma_signatures_used, firma_reset_month, current_period_end')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

            const plan = data?.plan || 'trial';
            const isPro = plan === 'pro' && data?.status === 'active';
            const firmaUsed = data?.firma_signatures_used ?? 0;
            const currentPeriodEnd = data?.current_period_end ?? null;

            return { plan, isPro, firmaUsed, currentPeriodEnd };
        },
        enabled: !!session?.user.id,
        staleTime: 1000 * 60 * 5, // Cache 5 minutes
    });
}
