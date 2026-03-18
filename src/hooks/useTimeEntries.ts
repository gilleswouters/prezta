import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
    endOfWeek,
    startOfMonth,
    endOfMonth,
    parseISO,
    getDay,
    format,
} from 'date-fns';
import type { TimeEntry, TimeEntryInsert, TimeEntryUpdate } from '@/types/time';

const STALE_TIME = 60_000; // 1 minute

const TIME_ENTRY_SELECT = '*, projects(id, name), tasks(id, title)';

// ─── Raw query ────────────────────────────────────────────────────────────────

export const useTimeEntriesForPeriod = (startDate: Date, endDate: Date) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['time_entries', user?.id, startDate.toISOString(), endDate.toISOString()],
        queryFn: async () => {
            if (!user?.id) throw new Error('Non authentifié');
            const { data, error } = await supabase
                .from('time_entries')
                .select(TIME_ENTRY_SELECT)
                .eq('user_id', user.id)
                .gte('started_at', startDate.toISOString())
                .lte('started_at', endDate.toISOString())
                .eq('is_running', false)
                .order('started_at', { ascending: false });

            if (error) throw error;
            return data as TimeEntry[];
        },
        enabled: !!user?.id,
        staleTime: STALE_TIME,
    });
};

// ─── Weekly summary ───────────────────────────────────────────────────────────

export interface WeeklyProjectRow {
    projectId: string | null;
    projectName: string;
    dailySeconds: number[]; // index 0=Mon … 6=Sun
    totalSeconds: number;
}

export interface WeeklySummary {
    byProject: WeeklyProjectRow[];
    dailyTotals: number[]; // 7 values
    totalSeconds: number;
    entries: TimeEntry[];
}

export const useWeeklySummary = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const { data: entries, ...rest } = useTimeEntriesForPeriod(weekStart, weekEnd);

    const summary: WeeklySummary = {
        byProject: [],
        dailyTotals: Array(7).fill(0) as number[],
        totalSeconds: 0,
        entries: entries ?? [],
    };

    if (entries) {
        const projectMap = new Map<string, WeeklyProjectRow>();

        for (const entry of entries) {
            const dur = entry.duration_seconds ?? 0;
            const dayOfWeek = getDay(parseISO(entry.started_at)); // 0=Sun
            // Convert to Mon-based index
            const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            const key = entry.project_id ?? '__none__';
            if (!projectMap.has(key)) {
                projectMap.set(key, {
                    projectId: entry.project_id,
                    projectName: entry.projects?.name ?? 'Sans projet',
                    dailySeconds: Array(7).fill(0) as number[],
                    totalSeconds: 0,
                });
            }
            const row = projectMap.get(key)!;
            row.dailySeconds[dayIdx] += dur;
            row.totalSeconds += dur;

            summary.dailyTotals[dayIdx] += dur;
            summary.totalSeconds += dur;
        }

        summary.byProject = Array.from(projectMap.values()).sort(
            (a, b) => b.totalSeconds - a.totalSeconds,
        );
    }

    return { data: summary, ...rest };
};

// ─── Monthly summary ──────────────────────────────────────────────────────────

export interface MonthlyProjectRow {
    projectId: string | null;
    projectName: string;
    totalSeconds: number;
    entries: TimeEntry[];
}

export interface MonthlySummary {
    byProject: MonthlyProjectRow[];
    totalSeconds: number;
}

export const useMonthlySummary = (year: number, month: number) => {
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);
    const { data: entries, ...rest } = useTimeEntriesForPeriod(monthStart, monthEnd);

    const summary: MonthlySummary = { byProject: [], totalSeconds: 0 };

    if (entries) {
        const projectMap = new Map<string, MonthlyProjectRow>();

        for (const entry of entries) {
            const dur = entry.duration_seconds ?? 0;
            const key = entry.project_id ?? '__none__';
            if (!projectMap.has(key)) {
                projectMap.set(key, {
                    projectId: entry.project_id,
                    projectName: entry.projects?.name ?? 'Sans projet',
                    totalSeconds: 0,
                    entries: [],
                });
            }
            const row = projectMap.get(key)!;
            row.totalSeconds += dur;
            row.entries.push(entry);
            summary.totalSeconds += dur;
        }

        summary.byProject = Array.from(projectMap.values()).sort(
            (a, b) => b.totalSeconds - a.totalSeconds,
        );
    }

    return { data: summary, ...rest };
};

// ─── Today's recent entries (for TimerPanel) ──────────────────────────────────

export const useTodayEntries = () => {
    const { user } = useAuth();
    const today = format(new Date(), 'yyyy-MM-dd');

    return useQuery({
        queryKey: ['time_entries_today', user?.id, today],
        queryFn: async () => {
            if (!user?.id) throw new Error('Non authentifié');
            const { data, error } = await supabase
                .from('time_entries')
                .select(TIME_ENTRY_SELECT)
                .eq('user_id', user.id)
                .gte('started_at', `${today}T00:00:00`)
                .lte('started_at', `${today}T23:59:59`)
                .eq('is_running', false)
                .order('started_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data as TimeEntry[];
        },
        enabled: !!user?.id,
        staleTime: STALE_TIME,
    });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateTimeEntry = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (entry: Omit<TimeEntryInsert, 'user_id'>) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { data } = await supabase
                .from('time_entries')
                .insert({ ...entry, user_id: user.id })
                .select(TIME_ENTRY_SELECT)
                .throwOnError()
                .single();
            return data as TimeEntry;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time_entries'] });
            queryClient.invalidateQueries({ queryKey: ['time_entries_today'] });
            toast.success('Entrée de temps ajoutée.');
        },
        onError: () => toast.error("Impossible d'ajouter l'entrée."),
    });
};

export const useUpdateTimeEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: TimeEntryUpdate }) => {
            const { data: updated } = await supabase
                .from('time_entries')
                .update(data)
                .eq('id', id)
                .select(TIME_ENTRY_SELECT)
                .throwOnError()
                .single();
            return updated as TimeEntry;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time_entries'] });
            queryClient.invalidateQueries({ queryKey: ['time_entries_today'] });
            toast.success('Entrée modifiée.');
        },
        onError: () => toast.error("Impossible de modifier l'entrée."),
    });
};

export const useDeleteTimeEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await supabase.from('time_entries').delete().eq('id', id).throwOnError();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time_entries'] });
            queryClient.invalidateQueries({ queryKey: ['time_entries_today'] });
            toast.success('Entrée supprimée.');
        },
        onError: () => toast.error("Impossible de supprimer l'entrée."),
    });
};

export const useBillTimeEntries = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            await supabase
                .from('time_entries')
                .update({ is_billed: true })
                .in('id', ids)
                .throwOnError();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time_entries'] });
        },
        onError: () => toast.error('Impossible de marquer les entrées comme facturées.'),
    });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHours(seconds: number): string {
    const h = (seconds / 3600).toFixed(1);
    return `${h}h`;
}
