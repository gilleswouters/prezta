import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { PLANS, type PlanKey } from '@/lib/plans';

export function usePlanLimits() {
    const { user } = useAuth();
    const { data: sub } = useSubscription();

    const plan = (sub?.plan ?? 'trial') as PlanKey;
    const limits = PLANS[plan] ?? PLANS.trial;
    const firmaUsed = sub?.firmaUsed ?? 0;

    // Active document count from DB view
    const { data: docCountRow } = useQuery({
        queryKey: ['activeDocCount', user?.id],
        queryFn: async () => {
            if (!user?.id) return { active_count: 0 };
            const { data } = await supabase
                .from('user_active_document_counts')
                .select('active_count')
                .eq('user_id', user.id)
                .maybeSingle();
            return data ?? { active_count: 0 };
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2,
    });

    // Active project count
    const { data: projectCountRow } = useQuery({
        queryKey: ['activeProjectCount', user?.id],
        queryFn: async () => {
            if (!user?.id) return { count: 0 };
            const { count } = await supabase
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .neq('status', 'archived');
            return { count: count ?? 0 };
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 2,
    });

    const documentsUsed = Number(docCountRow?.active_count ?? 0);
    const projectsUsed = projectCountRow?.count ?? 0;
    const firmaLimit = limits.firmaPerMonth;
    const documentsLimit = limits.maxDocuments;
    const projectsLimit = limits.maxProjects;

    return {
        plan,
        // creation gates
        canCreateDocument: documentsUsed < documentsLimit,
        canCreateProject: projectsUsed < projectsLimit,
        canUseFirma: firmaLimit === Infinity ? true : firmaUsed < firmaLimit,
        canUseAI: limits.aiEnabled,
        // counts for UI
        documentsUsed,
        documentsLimit,
        projectsUsed,
        projectsLimit,
        firmaUsed,
        firmaLimit,
        isNearDocumentLimit:
            documentsLimit !== Infinity &&
            documentsUsed >= Math.floor(documentsLimit * 0.8),
    };
}
