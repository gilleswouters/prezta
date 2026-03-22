import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SubscriptionHistoryRow {
    from_plan:  string;
    to_plan:    string;
    changed_at: string;
    reason:     string | null;
}

export function useSubscriptionHistory() {
    return useQuery({
        queryKey: ['subscription-history'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_history')
                .select('from_plan, to_plan, changed_at, reason')
                .order('changed_at', { ascending: false })
                .limit(3);
            if (error) throw error;
            return (data ?? []) as SubscriptionHistoryRow[];
        },
        staleTime: 5 * 60 * 1_000,
    });
}
