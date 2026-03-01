import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useSubscription() {
    const { session } = useAuth();

    return useQuery({
        queryKey: ['subscription', session?.user.id],
        queryFn: async () => {
            if (!session?.user.id) return { plan: 'free', isPro: false };

            const { data, error } = await supabase
                .from('subscriptions')
                .select('plan, status')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

            const plan = data?.plan || 'free';
            const isPro = plan === 'pro' && data?.status === 'active';

            return { plan, isPro };
        },
        enabled: !!session?.user.id,
        staleTime: 1000 * 60 * 5, // Cache 5 minutes
    });
}
