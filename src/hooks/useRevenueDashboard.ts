import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import {
    startOfMonth,
    startOfYear,
    subMonths,
    subYears,
    addMonths,
    parseISO,
    isSameMonth,
    format,
    startOfQuarter,
    subQuarters,
} from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodFilter = 'month' | 'quarter' | 'year' | '12months';

export interface RevenueKpi {
    caPeriod: number;           // sum of paid invoices in period
    enAttente: number;          // sum of pending/overdue in period
    emises: number;             // total invoices issued in period
    tauxRecouvrement: number;   // paid count / issued count (%)
}

export interface MonthlyRevenuePoint {
    month: string;
    ca: number;
}

export interface TopClient {
    name: string;
    amount: number;
}

export interface RevenueDashboardData {
    kpis: RevenueKpi;
    previousKpis: RevenueKpi;
    monthlyRevenue: MonthlyRevenuePoint[];
    topClients: TopClient[];
}

// ─── Internal types ────────────────────────────────────────────────────────────

type InvoiceRow = {
    id: string;
    amount: number;
    status: string;
    paid_date: string | null;
    created_at: string;
    projects: {
        name: string;
        clients: { name: string } | null;
    } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeKpis(invoices: InvoiceRow[], start: Date, end: Date): RevenueKpi {
    const inPeriod = invoices.filter(i => {
        const d = parseISO(i.created_at);
        return d >= start && d <= end;
    });
    const paid = inPeriod.filter(i => i.status === 'payé');
    const pending = inPeriod.filter(
        i => i.status === 'en_attente' || i.status === 'en_retard'
    );
    const caPeriod = paid.reduce((s, i) => s + Number(i.amount), 0);
    const enAttente = pending.reduce((s, i) => s + Number(i.amount), 0);
    const emises = inPeriod.length;
    const tauxRecouvrement =
        emises > 0 ? Math.round((paid.length / emises) * 100) : 0;
    return { caPeriod, enAttente, emises, tauxRecouvrement };
}

function getPeriodConfig(period: PeriodFilter, now: Date): {
    start: Date;
    end: Date;
    prevStart: Date;
    prevEnd: Date;
    chartDates: Date[];
} {
    switch (period) {
        case 'month': {
            const start = startOfMonth(now);
            const prevStart = startOfMonth(subMonths(now, 1));
            const prevEnd = new Date(start.getTime() - 1);
            return { start, end: now, prevStart, prevEnd, chartDates: [start] };
        }
        case 'quarter': {
            const start = startOfQuarter(now);
            const prevQStart = startOfQuarter(subQuarters(now, 1));
            const prevEnd = new Date(start.getTime() - 1);
            const chartDates = [0, 1, 2].map(i => addMonths(start, i));
            return { start, end: now, prevStart: prevQStart, prevEnd, chartDates };
        }
        case 'year': {
            const start = startOfYear(now);
            const prevYStart = startOfYear(subYears(now, 1));
            const prevEnd = new Date(start.getTime() - 1);
            const chartDates = Array.from({ length: 12 }, (_, i) => addMonths(start, i));
            return { start, end: now, prevStart: prevYStart, prevEnd, chartDates };
        }
        case '12months': {
            const start = subMonths(now, 12);
            const prevEnd = new Date(start.getTime() - 1);
            const prevStart = subMonths(now, 24);
            const chartDates = Array.from({ length: 12 }, (_, i) => addMonths(start, i));
            return { start, end: now, prevStart, prevEnd, chartDates };
        }
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRevenueDashboard(period: PeriodFilter) {
    const { user } = useAuth();

    return useQuery<RevenueDashboardData>({
        queryKey: ['revenue-dashboard', user?.id, period],
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        queryFn: async (): Promise<RevenueDashboardData> => {
            if (!user?.id) throw new Error('Non authentifié');

            const now = new Date();
            const { start, end, prevStart, prevEnd, chartDates } = getPeriodConfig(period, now);

            const { data: rawData, error } = await supabase
                .from('invoices')
                .select('id, amount, status, paid_date, created_at, projects(name, clients(name))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const invoices = (rawData ?? []) as unknown as InvoiceRow[];

            // KPIs
            const kpis = computeKpis(invoices, start, end);
            const previousKpis = computeKpis(invoices, prevStart, prevEnd);

            // Monthly bar chart (CA encaissé par mois)
            const monthlyRevenue: MonthlyRevenuePoint[] = chartDates.map(date => {
                const ca = invoices
                    .filter(
                        i =>
                            i.status === 'payé' &&
                            isSameMonth(parseISO(i.created_at), date)
                    )
                    .reduce((s, i) => s + Number(i.amount), 0);
                const raw = format(date, 'MMM', { locale: fr });
                return {
                    month: raw.charAt(0).toUpperCase() + raw.slice(1),
                    ca,
                };
            });

            // Top 5 clients (CA encaissé dans la période courante)
            const periodPaid = invoices.filter(i => {
                const d = parseISO(i.created_at);
                return d >= start && d <= end && i.status === 'payé';
            });
            const clientMap = new Map<string, number>();
            for (const inv of periodPaid) {
                const name = inv.projects?.clients?.name ?? 'Inconnu';
                clientMap.set(name, (clientMap.get(name) ?? 0) + Number(inv.amount));
            }
            const topClients: TopClient[] = [...clientMap.entries()]
                .map(([name, amount]) => ({ name, amount }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5);

            return { kpis, previousKpis, monthlyRevenue, topClients };
        },
    });
}
