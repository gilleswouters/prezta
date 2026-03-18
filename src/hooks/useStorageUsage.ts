import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { getStorageUsage, FREE_LIMIT } from '@/lib/storage';

export interface StorageUsageResult {
    used: number;
    limit: number;
    percent: number;
    /** true when ≥ 60% used — progress bar turns amber */
    isNearLimit: boolean;
    /** true when ≥ 80% used — shows upgrade banner */
    isAtLimit: boolean;
    isLoading: boolean;
}

export function useStorageUsage(): StorageUsageResult {
    const { user } = useAuth();
    const { data: subscription } = useSubscription();

    const { data, isLoading } = useQuery({
        queryKey: ['storage-usage', user?.id, subscription?.isPro],
        queryFn: () => getStorageUsage(user!.id, subscription?.isPro ?? false),
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const percent = data?.percent ?? 0;

    return {
        used: data?.used ?? 0,
        limit: data?.limit ?? FREE_LIMIT,
        percent,
        isNearLimit: percent >= 60,
        isAtLimit: percent >= 80,
        isLoading,
    };
}
