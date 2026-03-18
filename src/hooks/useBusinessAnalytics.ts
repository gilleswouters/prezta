import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import {
    differenceInDays,
    parseISO,
    subMonths,
    format,
    startOfMonth,
} from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Internal row types ────────────────────────────────────────────────────────

interface StatusHistoryEntry {
    status: string;
    at: string;
}

interface QuoteRow {
    id: string;
    status: string;
    sent_at: string | null;
    status_history: StatusHistoryEntry[] | null;
}

interface InvoiceRow {
    id: string;
    amount: number | string;
    status: string;
    created_at: string;
    paid_date: string | null;
    projects: { clients: { id: string; name: string } | null } | null;
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TopClientStat {
    clientId: string;
    name: string;
    amount: number;
    pct: number; // % of total CA
}

export interface LatePayerClient {
    clientId: string;
    name: string;
    avgDelay: number; // average days to pay
    latestOverdueInvoiceId: string | null;
}

export interface BusinessAnalyticsData {
    acceptanceRate: number;        // % (0-100)
    prevAcceptanceRate: number;    // prior 3-month window
    avgSignDelay: number | null;   // days quote sent → accepted
    avgPayDelay: number | null;    // days invoice created → paid
    topClients: TopClientStat[];   // top 3 by CA
    latePayerClients: LatePayerClient[]; // avg payment > 30 days
    quietMonths: string[];         // month names where CA < 50% of 12m avg
    hasEnoughData: boolean;        // at least 3 distinct invoice months
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBusinessAnalytics() {
    const { user } = useAuth();

    return useQuery<BusinessAnalyticsData>({
        queryKey: ['business-analytics', user?.id],
        enabled: !!user?.id,
        staleTime: 10 * 60 * 1000,
        queryFn: async (): Promise<BusinessAnalyticsData> => {
            if (!user?.id) throw new Error('Non authentifié');

            const [quotesRes, invoicesRes] = await Promise.all([
                supabase
                    .from('quotes')
                    .select('id, status, sent_at, status_history')
                    .eq('user_id', user.id),
                supabase
                    .from('invoices')
                    .select('id, amount, status, created_at, paid_date, projects(clients(id, name))')
                    .eq('user_id', user.id),
            ]);

            if (quotesRes.error) throw quotesRes.error;
            if (invoicesRes.error) throw invoicesRes.error;

            const quotes = (quotesRes.data ?? []) as unknown as QuoteRow[];
            const invoices = (invoicesRes.data ?? []) as unknown as InvoiceRow[];

            // ── hasEnoughData ─────────────────────────────────────────────
            const invoiceMonths = new Set(invoices.map(i => i.created_at.slice(0, 7)));
            const hasEnoughData = invoiceMonths.size >= 3;

            // ── Acceptance rate ───────────────────────────────────────────
            const SENT_STATUSES = new Set(['sent', 'lu', 'accepted', 'rejected']);
            const now = new Date();
            const threeMonthsAgo = subMonths(now, 3);
            const sixMonthsAgo = subMonths(now, 6);

            const sentQuotes = quotes.filter(q => SENT_STATUSES.has(q.status));
            const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
            const acceptanceRate =
                sentQuotes.length > 0
                    ? Math.round((acceptedQuotes.length / sentQuotes.length) * 100)
                    : 0;

            // Prior 3-month window acceptance rate (based on sent_at)
            const prevSent = quotes.filter(q => {
                if (!q.sent_at || !SENT_STATUSES.has(q.status)) return false;
                const d = parseISO(q.sent_at);
                return d >= sixMonthsAgo && d < threeMonthsAgo;
            });
            const prevAccepted = quotes.filter(q => {
                if (q.status !== 'accepted') return false;
                const history = q.status_history ?? [];
                const entry = history.find(e => e.status === 'accepted');
                if (!entry) return false;
                const d = parseISO(entry.at);
                return d >= sixMonthsAgo && d < threeMonthsAgo;
            });
            const prevAcceptanceRate =
                prevSent.length > 0
                    ? Math.round((prevAccepted.length / prevSent.length) * 100)
                    : 0;

            // ── Avg sign delay ────────────────────────────────────────────
            const signDelays: number[] = [];
            for (const q of quotes) {
                if (q.status !== 'accepted' || !q.sent_at) continue;
                const history = q.status_history ?? [];
                const entry = history.find(e => e.status === 'accepted');
                if (!entry) continue;
                const days = differenceInDays(parseISO(entry.at), parseISO(q.sent_at));
                if (days >= 0) signDelays.push(days);
            }
            const avgSignDelay =
                signDelays.length > 0
                    ? Math.round(signDelays.reduce((a, b) => a + b, 0) / signDelays.length)
                    : null;

            // ── Avg pay delay ─────────────────────────────────────────────
            const payDelays: number[] = [];
            for (const inv of invoices) {
                if (inv.status !== 'payé' || !inv.paid_date) continue;
                const days = differenceInDays(
                    parseISO(inv.paid_date),
                    parseISO(inv.created_at),
                );
                if (days >= 0) payDelays.push(days);
            }
            const avgPayDelay =
                payDelays.length > 0
                    ? Math.round(payDelays.reduce((a, b) => a + b, 0) / payDelays.length)
                    : null;

            // ── Top 3 clients by CA ───────────────────────────────────────
            const clientMap = new Map<string, { name: string; amount: number }>();
            let totalCA = 0;
            for (const inv of invoices) {
                if (inv.status !== 'payé') continue;
                const clientId = inv.projects?.clients?.id ?? '__unknown__';
                const clientName = inv.projects?.clients?.name ?? 'Client inconnu';
                const amount = Number(inv.amount);
                totalCA += amount;
                const cur = clientMap.get(clientId);
                if (cur) {
                    cur.amount += amount;
                } else {
                    clientMap.set(clientId, { name: clientName, amount });
                }
            }
            const topClients: TopClientStat[] = [...clientMap.entries()]
                .map(([clientId, { name, amount }]) => ({
                    clientId,
                    name,
                    amount,
                    pct: totalCA > 0 ? Math.round((amount / totalCA) * 100) : 0,
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);

            // ── Late payer clients (avg payment delay > 30j) ───────────────
            const clientDelays = new Map<
                string,
                { name: string; delays: number[]; latestOverdueInvoiceId: string | null }
            >();
            for (const inv of invoices) {
                if (inv.status !== 'payé' || !inv.paid_date) continue;
                const clientId = inv.projects?.clients?.id ?? '__unknown__';
                const clientName = inv.projects?.clients?.name ?? 'Client inconnu';
                const days = differenceInDays(
                    parseISO(inv.paid_date),
                    parseISO(inv.created_at),
                );
                if (days < 0) continue;
                const cur = clientDelays.get(clientId);
                if (cur) {
                    cur.delays.push(days);
                } else {
                    clientDelays.set(clientId, {
                        name: clientName,
                        delays: [days],
                        latestOverdueInvoiceId: null,
                    });
                }
            }
            // Attach latest overdue invoice id per client
            for (const inv of invoices) {
                if (inv.status !== 'en_retard') continue;
                const clientId = inv.projects?.clients?.id ?? '__unknown__';
                const cur = clientDelays.get(clientId);
                if (cur && cur.latestOverdueInvoiceId === null) {
                    cur.latestOverdueInvoiceId = inv.id;
                }
            }
            const latePayerClients: LatePayerClient[] = [...clientDelays.entries()]
                .map(([clientId, { name, delays, latestOverdueInvoiceId }]) => ({
                    clientId,
                    name,
                    avgDelay: Math.round(delays.reduce((a, b) => a + b, 0) / delays.length),
                    latestOverdueInvoiceId,
                }))
                .filter(c => c.avgDelay > 30)
                .sort((a, b) => b.avgDelay - a.avgDelay);

            // ── Quiet months (last 12m, CA < 50% of avg) ──────────────────
            let quietMonths: string[] = [];
            if (invoiceMonths.size >= 6) {
                const twelveMonthsAgo = subMonths(now, 12);
                const monthCA = new Map<string, number>();
                for (const inv of invoices) {
                    if (inv.status !== 'payé') continue;
                    const d = parseISO(inv.created_at);
                    if (d < twelveMonthsAgo) continue;
                    const key = inv.created_at.slice(0, 7); // 'YYYY-MM'
                    monthCA.set(key, (monthCA.get(key) ?? 0) + Number(inv.amount));
                }
                const months12 = Array.from({ length: 12 }, (_, i) => {
                    const d = subMonths(now, 11 - i);
                    return format(d, 'yyyy-MM');
                });
                const values = months12.map(m => monthCA.get(m) ?? 0);
                const avg12 = values.reduce((a, b) => a + b, 0) / 12;
                quietMonths = months12
                    .filter((_, i) => avg12 > 0 && values[i] < avg12 * 0.5)
                    .map(m => {
                        const raw = format(
                            startOfMonth(parseISO(m + '-01')),
                            'MMMM',
                            { locale: fr },
                        );
                        return raw.charAt(0).toUpperCase() + raw.slice(1);
                    });
            }

            return {
                acceptanceRate,
                prevAcceptanceRate,
                avgSignDelay,
                avgPayDelay,
                topClients,
                latePayerClients,
                quietMonths,
                hasEnoughData,
            };
        },
    });
}
