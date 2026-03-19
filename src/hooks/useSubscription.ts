import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useSubscription() {
    const { session } = useAuth();

    return useQuery({
        queryKey: ['subscription', session?.user.id],
        queryFn: async () => {
            if (!session?.user.id) return { plan: 'trial', isPro: false, firmaUsed: 0, currentPeriodEnd: null, status: null };

            // Fetch active OR cancelled rows — cancelled subs still have a valid end date
            const { data, error } = await supabase
                .from('subscriptions')
                .select('plan, status, firma_signatures_used, firma_reset_month, current_period_end')
                .eq('user_id', session.user.id)
                .in('status', ['active', 'cancelled'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            const plan             = data?.plan || 'trial';
            const status           = data?.status ?? null;
            const isPro            = plan === 'pro' && status === 'active';
            const firmaUsed        = data?.firma_signatures_used ?? 0;
            const currentPeriodEnd = data?.current_period_end ?? null;

            return { plan, isPro, firmaUsed, currentPeriodEnd, status };
        },
        enabled: !!session?.user.id,
        staleTime: 30 * 1000, // 30 seconds — fast refresh after LS payment webhook
    });
}
