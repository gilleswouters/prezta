import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { subDays } from 'date-fns';

export type AlertSeverity = 'danger' | 'warning' | 'info';

export interface ProjectAlert {
    count: number;
    severity: AlertSeverity;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { danger: 3, warning: 2, info: 1 };

function addAlert(alerts: Map<string, ProjectAlert>, projectId: string, severity: AlertSeverity) {
    const existing = alerts.get(projectId);
    const count = (existing?.count ?? 0) + 1;
    const highestSeverity =
        !existing || SEVERITY_RANK[severity] > SEVERITY_RANK[existing.severity]
            ? severity
            : existing.severity;
    alerts.set(projectId, { count, severity: highestSeverity });
}

type ProjectIdRow = { project_id: string | null };

export function useProjectAlerts() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['project-alerts', user?.id],
        enabled: !!user?.id,
        staleTime: 2 * 60 * 1000, // 2 minutes
        queryFn: async (): Promise<Map<string, ProjectAlert>> => {
            if (!user?.id) return new Map();

            const now = new Date();
            const sevenDaysAgo = subDays(now, 7);
            const fortyEightHoursAgo = subDays(now, 2);

            const [overdueTasksRes, staleContractsRes, viewedQuotesRes, overdueInvoicesRes] =
                await Promise.all([
                    // Red: overdue tasks linked to a project
                    supabase
                        .from('tasks')
                        .select('project_id')
                        .eq('user_id', user.id)
                        .not('status', 'eq', 'done')
                        .not('due_date', 'is', null)
                        .not('project_id', 'is', null)
                        .lt('due_date', now.toISOString()),

                    // Amber: contracts sent for signature 7+ days with no response
                    supabase
                        .from('project_contracts')
                        .select('project_id')
                        .eq('user_id', user.id)
                        .eq('status', 'sent')
                        .not('sent_at', 'is', null)
                        .not('project_id', 'is', null)
                        .lte('sent_at', sevenDaysAgo.toISOString()),

                    // Blue: quote viewed by client within 48h
                    supabase
                        .from('quotes')
                        .select('project_id')
                        .eq('user_id', user.id)
                        .eq('status', 'lu')
                        .not('viewed_at', 'is', null)
                        .not('project_id', 'is', null)
                        .gte('viewed_at', fortyEightHoursAgo.toISOString()),

                    // Red: overdue invoices linked to a project
                    supabase
                        .from('invoices')
                        .select('project_id')
                        .eq('user_id', user.id)
                        .eq('status', 'en_retard')
                        .not('project_id', 'is', null),
                ]);

            const alerts = new Map<string, ProjectAlert>();

            // Process lowest → highest priority so danger always wins
            for (const row of (viewedQuotesRes.data ?? []) as ProjectIdRow[]) {
                if (row.project_id) addAlert(alerts, row.project_id, 'info');
            }
            for (const row of (staleContractsRes.data ?? []) as ProjectIdRow[]) {
                if (row.project_id) addAlert(alerts, row.project_id, 'warning');
            }
            for (const row of (overdueTasksRes.data ?? []) as ProjectIdRow[]) {
                if (row.project_id) addAlert(alerts, row.project_id, 'danger');
            }
            for (const row of (overdueInvoicesRes.data ?? []) as ProjectIdRow[]) {
                if (row.project_id) addAlert(alerts, row.project_id, 'danger');
            }

            return alerts;
        },
    });
}
