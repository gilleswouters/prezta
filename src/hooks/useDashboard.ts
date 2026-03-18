import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import {
    subMonths,
    subDays,
    parseISO,
    isBefore,
    addHours,
    addDays,
    differenceInDays,
    differenceInHours,
} from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KpiData {
    overdueInvoicesCount: number; // Count of invoices with status = 'en_retard'
    activeProjectsCount: number;  // Projects where status != 'archived' && != 'completed'
    docsASignerCount: number;     // project_contracts where status = 'sent'
}

export interface OverdueInvoice {
    id: string;
    reference: string | null;
    amount: number;
    due_date: string;
    projectName: string | null;
    projectId: string | null;
}

export interface UnsignedContract {
    id: string;
    title: string;
    projectName: string | null;
    projectId: string | null;
    created_at: string;
}

export interface UrgentTask {
    id: string;
    title: string;
    due_date: string;
    priority: 'high';
    projectName: string | null;
    projectId: string | null;
}

/** Quote viewed by the client within the last 48 hours (status changed to 'lu'). */
export interface ViewedQuote {
    id: string;
    title: string;
    projectName: string | null;
    projectId: string | null;
    viewed_at: string;
    hoursAgo: number;
}

/** Task that is past its due date and not done. */
export interface OverdueTask {
    id: string;
    title: string;
    due_date: string;
    projectName: string | null;
    projectId: string | null;
}

/** Contract sent for signature 7+ days ago with no status change. */
export interface StaleSignedDocument {
    id: string;
    title: string;
    projectName: string | null;
    projectId: string | null;
    sent_at: string;
    daysSinceSent: number;
}

export interface RecentProject {
    id: string;
    name: string;
    status: string;
    clientName: string | null;
}

/** Contract expiring within the next 30 days. */
export interface ExpiringContract {
    id: string;
    title: string;
    expires_at: string;
    daysUntilExpiry: number;
    projectName: string | null;
    projectId: string | null;
}

export interface DashboardData {
    kpi: KpiData;
    overdueInvoices: OverdueInvoice[];
    unsignedContracts: UnsignedContract[];
    urgentTasks: UrgentTask[];
    overdueTasks: OverdueTask[];
    recentProjects: RecentProject[];
    staleSignedDocs: StaleSignedDocument[];
    viewedQuotes: ViewedQuote[];
    expiringContracts: ExpiringContract[];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDashboard() {
    const { user } = useAuth();

    return useQuery<DashboardData>({
        queryKey: ['dashboard', user?.id],
        enabled: !!user?.id,
        staleTime: 60 * 1000, // 1 minute
        queryFn: async (): Promise<DashboardData> => {
            if (!user?.id) throw new Error('Non authentifié');

            const now = new Date();
            const thirtyDaysAgo = subMonths(now, 1);
            const in48h = addHours(now, 48);
            const sevenDaysAgo = subDays(now, 7);
            const fortyEightHoursAgo = subDays(now, 2);
            const in30d = addDays(now, 30);

            // Parallel queries for performance
            const [
                invoicesResult,
                activeProjectsResult,
                docsASignerResult,
                unsignedContractsResult,
                urgentTasksResult,
                overdueTasksResult,
                recentProjectsResult,
                staleSignedResult,
                viewedQuotesResult,
                expiringContractsResult,
            ] = await Promise.all([
                // All invoices (for KPIs + chart)
                supabase
                    .from('invoices')
                    .select('id, reference, amount, status, due_date, paid_date, created_at, projects(id, name)')
                    .eq('user_id', user.id),

                // Active projects count (not archived, not cancelled)
                supabase
                    .from('projects')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .not('status', 'in', '("archived","cancelled","completed")'),

                // Docs à signer: project_contracts with status 'sent'
                supabase
                    .from('project_contracts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('status', 'sent'),

                // Unsigned contracts details for "Actions Requises"
                supabase
                    .from('project_contracts')
                    .select('id, title, created_at, projects(id, name)')
                    .eq('user_id', user.id)
                    .eq('status', 'sent')
                    .order('created_at', { ascending: true })
                    .limit(3),

                // High-priority tasks due within 48h, not done
                supabase
                    .from('tasks')
                    .select('id, title, due_date, priority, projects(id, name)')
                    .eq('user_id', user.id)
                    .eq('priority', 'high')
                    .not('status', 'eq', 'done')
                    .not('due_date', 'is', null)
                    .lte('due_date', in48h.toISOString())
                    .order('due_date', { ascending: true })
                    .limit(3),

                // Overdue tasks: any priority, past due date, not done
                supabase
                    .from('tasks')
                    .select('id, title, due_date, projects(id, name)')
                    .eq('user_id', user.id)
                    .not('status', 'eq', 'done')
                    .not('due_date', 'is', null)
                    .lt('due_date', now.toISOString())
                    .order('due_date', { ascending: true })
                    .limit(3),

                // Recent projects (last 3)
                supabase
                    .from('projects')
                    .select('id, name, status, clients(name)')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(3),

                // Stale signed docs: contracts with status='sent' AND sent_at older than 7 days
                supabase
                    .from('project_contracts')
                    .select('id, title, sent_at, projects(id, name)')
                    .eq('user_id', user.id)
                    .eq('status', 'sent')
                    .not('sent_at', 'is', null)
                    .lte('sent_at', sevenDaysAgo.toISOString())
                    .order('sent_at', { ascending: true })
                    .limit(3),

                // Quotes recently viewed by the client (status='lu' within 48h)
                supabase
                    .from('quotes')
                    .select('id, title, viewed_at, projects(id, name)')
                    .eq('user_id', user.id)
                    .eq('status', 'lu')
                    .not('viewed_at', 'is', null)
                    .gte('viewed_at', fortyEightHoursAgo.toISOString())
                    .order('viewed_at', { ascending: false })
                    .limit(3),

                // Contracts expiring within the next 30 days
                supabase
                    .from('project_contracts')
                    .select('id, title, expires_at, projects(id, name)')
                    .eq('user_id', user.id)
                    .not('expires_at', 'is', null)
                    .gt('expires_at', now.toISOString())
                    .lte('expires_at', in30d.toISOString())
                    .order('expires_at', { ascending: true })
                    .limit(5),
            ]);

            // Error handling
            if (invoicesResult.error) throw invoicesResult.error;

            // ── KPI calculations ──────────────────────────────────────────

            type InvoiceRow = {
                id: string;
                reference: string | null;
                amount: number;
                status: string;
                due_date: string | null;
                paid_date: string | null;
                created_at: string;
                projects: { id: string; name: string } | null;
            };

            const invoices: InvoiceRow[] = (invoicesResult.data ?? []) as unknown as InvoiceRow[];

            const overdueInvoicesCount = invoices.filter(i => i.status === 'en_retard').length;
            const activeProjectsCount = activeProjectsResult.count ?? 0;
            const docsASignerCount = docsASignerResult.count ?? 0;

            // ── Overdue invoices for "Actions Requises" ───────────────────
            const overdueInvoices: OverdueInvoice[] = invoices
                .filter(i => {
                    if (i.status !== 'en_retard' && i.status !== 'en_attente') return false;
                    if (!i.due_date) return false;
                    return isBefore(parseISO(i.due_date), thirtyDaysAgo);
                })
                .slice(0, 3)
                .map(i => ({
                    id: i.id,
                    reference: i.reference,
                    amount: Number(i.amount),
                    due_date: i.due_date!,
                    projectName: i.projects?.name ?? null,
                    projectId: i.projects?.id ?? null,
                }));

            // ── Unsigned contracts ────────────────────────────────────────
            type UnsignedRow = { id: string; title: string; created_at: string; projects: { id: string; name: string } | null };
            const unsignedContracts: UnsignedContract[] = ((unsignedContractsResult.data ?? []) as unknown as UnsignedRow[]).map(c => ({
                id: c.id,
                title: c.title,
                projectName: c.projects?.name ?? null,
                projectId: c.projects?.id ?? null,
                created_at: c.created_at,
            }));

            // ── Urgent tasks ──────────────────────────────────────────────
            type UrgentTaskRow = { id: string; title: string; due_date: string | null; priority: string; projects: { id: string; name: string } | null };
            const urgentTasks: UrgentTask[] = ((urgentTasksResult.data ?? []) as unknown as UrgentTaskRow[])
                .filter(t => t.due_date !== null)
                .map(t => ({
                    id: t.id,
                    title: t.title,
                    due_date: t.due_date!,
                    priority: 'high' as const,
                    projectName: t.projects?.name ?? null,
                    projectId: t.projects?.id ?? null,
                }));

            // ── Overdue tasks ─────────────────────────────────────────────
            type OverdueTaskRow = { id: string; title: string; due_date: string | null; projects: { id: string; name: string } | null };
            const overdueTasks: OverdueTask[] = ((overdueTasksResult.data ?? []) as unknown as OverdueTaskRow[])
                .filter(t => t.due_date !== null)
                .map(t => ({
                    id: t.id,
                    title: t.title,
                    due_date: t.due_date!,
                    projectName: t.projects?.name ?? null,
                    projectId: t.projects?.id ?? null,
                }));

            // ── Recent projects ───────────────────────────────────────────
            type RecentProjectRow = { id: string; name: string; status: string; clients: { name: string } | null };
            const recentProjects: RecentProject[] = ((recentProjectsResult.data ?? []) as unknown as RecentProjectRow[]).map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                clientName: p.clients?.name ?? null,
            }));

            // ── Stale signed documents ────────────────────────────────────
            type StaleRow = { id: string; title: string; sent_at: string; projects: { id: string; name: string } | null };
            const staleSignedDocs: StaleSignedDocument[] = ((staleSignedResult.data ?? []) as unknown as StaleRow[]).map(c => ({
                id: c.id,
                title: c.title,
                projectName: c.projects?.name ?? null,
                projectId: c.projects?.id ?? null,
                sent_at: c.sent_at,
                daysSinceSent: differenceInDays(now, parseISO(c.sent_at)),
            }));

            // ── Viewed quotes ─────────────────────────────────────────────
            type ViewedQuoteRow = { id: string; title: string; viewed_at: string; projects: { id: string; name: string } | null };
            const viewedQuotes: ViewedQuote[] = ((viewedQuotesResult.data ?? []) as unknown as ViewedQuoteRow[]).map(q => ({
                id: q.id,
                title: q.title,
                projectName: q.projects?.name ?? null,
                projectId: q.projects?.id ?? null,
                viewed_at: q.viewed_at,
                hoursAgo: differenceInHours(now, parseISO(q.viewed_at)),
            }));

            // ── Expiring contracts ────────────────────────────────────────
            type ExpiringRow = { id: string; title: string; expires_at: string; projects: { id: string; name: string } | null };
            const expiringContracts: ExpiringContract[] = ((expiringContractsResult.data ?? []) as unknown as ExpiringRow[]).map(c => ({
                id: c.id,
                title: c.title,
                expires_at: c.expires_at,
                daysUntilExpiry: differenceInDays(parseISO(c.expires_at), now),
                projectName: c.projects?.name ?? null,
                projectId: c.projects?.id ?? null,
            }));

            return {
                kpi: { overdueInvoicesCount, activeProjectsCount, docsASignerCount },
                overdueInvoices,
                unsignedContracts,
                urgentTasks,
                overdueTasks,
                recentProjects,
                staleSignedDocs,
                viewedQuotes,
                expiringContracts,
            };
        },
    });
}
