import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    TrendingUp, TrendingDown, Minus, Euro, Clock, FileText, Target,
    CheckCircle2, AlertTriangle, Users, CalendarX2, Loader2, Send,
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';
import type { PeriodFilter } from '@/hooks/useRevenueDashboard';
import { useRevenueDashboard } from '@/hooks/useRevenueDashboard';
import { useBusinessAnalytics } from '@/hooks/useBusinessAnalytics';
import type { LatePayerClient } from '@/hooks/useBusinessAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { supabase } from '@/lib/supabase';
import type { InvoiceWithProject } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { ReminderPreviewModal } from '@/components/invoices/ReminderPreviewModal';

// ─── Period config ─────────────────────────────────────────────────────────────

const PERIODS: { label: string; value: PeriodFilter }[] = [
    { label: 'Mois en cours',    value: 'month' },
    { label: 'Trimestre',        value: 'quarter' },
    { label: 'Année',            value: 'year' },
    { label: '12 derniers mois', value: '12months' },
];

const CLIENT_COLORS = ['#2563EB', '#10B981', '#A855F7', '#F59E0B', '#EF4444'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RevenueDashboardPage() {
    const [activeTab, setActiveTab] = useState<'revenus' | 'analyse'>('revenus');
    const [period, setPeriod] = useState<PeriodFilter>('month');

    const { data, isLoading } = useRevenueDashboard(period);
    const { data: analytics, isLoading: analyticsLoading } = useBusinessAnalytics();
    const { data: profile } = useProfile();
    const { canUseAI } = usePlanLimits();

    const kpis       = data?.kpis;
    const prev       = data?.previousKpis;
    const monthly    = data?.monthlyRevenue ?? [];
    const topClients = data?.topClients ?? [];

    // Reminder modal state
    const [reminderInvoice, setReminderInvoice] = useState<InvoiceWithProject | null>(null);
    const [reminderLoading, setReminderLoading] = useState<string | null>(null); // clientId being fetched

    const handleRelancer = async (client: LatePayerClient) => {
        if (!client.latestOverdueInvoiceId) return;
        setReminderLoading(client.clientId);
        const { data: inv } = await supabase
            .from('invoices')
            .select(`
                id, reference, user_id, project_id, amount, status, due_date,
                paid_date, notes, last_reminder_date, last_reminder_sent_at,
                reminder_count, created_at,
                projects(name, clients(name, email, contact_name))
            `)
            .eq('id', client.latestOverdueInvoiceId)
            .single();
        setReminderLoading(null);
        if (inv) setReminderInvoice(inv as unknown as InvoiceWithProject);
    };

    const freelanceName = profile?.full_name ?? profile?.email ?? 'Vous';

    return (
        <div className="space-y-6">

            {/* Top-level tab switcher */}
            <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1 w-fit">
                {(['revenus', 'analyse'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                            activeTab === tab
                                ? 'bg-brand text-white'
                                : 'text-text-secondary hover:bg-surface-hover'
                        }`}
                    >
                        {tab === 'revenus' ? 'Revenus' : 'Analyse'}
                    </button>
                ))}
            </div>

            {/* ── REVENUS tab ──────────────────────────────────────────────── */}
            {activeTab === 'revenus' && (
                <>
                    {/* Period filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    period === p.value
                                        ? 'bg-brand text-white'
                                        : 'bg-white border border-border text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* KPI row */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white border border-border rounded-xl p-5 h-28 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                label="CA de la période"
                                value={formatEur(kpis?.caPeriod ?? 0)}
                                icon={<Euro className="h-4 w-4" />}
                                delta={computeDelta(kpis?.caPeriod, prev?.caPeriod)}
                                iconColor="text-emerald-600"
                                iconBg="bg-emerald-50"
                            />
                            <KpiCard
                                label="En attente"
                                value={formatEur(kpis?.enAttente ?? 0)}
                                icon={<Clock className="h-4 w-4" />}
                                delta={null}
                                iconColor="text-amber-600"
                                iconBg="bg-amber-50"
                            />
                            <KpiCard
                                label="Factures émises"
                                value={String(kpis?.emises ?? 0)}
                                icon={<FileText className="h-4 w-4" />}
                                delta={computeDelta(kpis?.emises, prev?.emises)}
                                iconColor="text-blue-600"
                                iconBg="bg-blue-50"
                            />
                            <KpiCard
                                label="Taux de recouvrement"
                                value={`${kpis?.tauxRecouvrement ?? 0} %`}
                                icon={<Target className="h-4 w-4" />}
                                delta={computeDelta(kpis?.tauxRecouvrement, prev?.tauxRecouvrement)}
                                iconColor="text-violet-600"
                                iconBg="bg-violet-50"
                            />
                        </div>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                        {/* CA mensuel */}
                        <div className="bg-white border border-border rounded-xl p-5">
                            <h2 className="font-bold text-sm text-text-primary mb-4">CA encaissé</h2>
                            <div className="h-64">
                                {isLoading ? (
                                    <div className="h-full animate-pulse bg-gray-50 rounded-lg" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#64748B' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#64748B' }}
                                                tickFormatter={(v: number) => `${v} €`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F8FAFC' }}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                                formatter={(value: number | undefined) => [
                                                    formatEur(value ?? 0),
                                                    'CA encaissé',
                                                ]}
                                            />
                                            <Bar dataKey="ca" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Top 5 clients */}
                        <div className="bg-white border border-border rounded-xl p-5">
                            <h2 className="font-bold text-sm text-text-primary mb-4">Top 5 clients</h2>
                            <div className="h-64">
                                {isLoading ? (
                                    <div className="h-full animate-pulse bg-gray-50 rounded-lg" />
                                ) : topClients.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-text-muted text-sm">
                                        Aucune donnée sur la période
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topClients}
                                            layout="vertical"
                                            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis
                                                type="number"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748B' }}
                                                tickFormatter={(v: number) => `${v} €`}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={100}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#374151' }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F8FAFC' }}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                                formatter={(value: number | undefined) => [formatEur(value ?? 0), 'CA']}
                                            />
                                            <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={24}>
                                                {topClients.map((_entry, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={CLIENT_COLORS[index % CLIENT_COLORS.length]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── ANALYSE tab ──────────────────────────────────────────────── */}
            {activeTab === 'analyse' && (
                <>
                    {analyticsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white border border-border rounded-xl p-5 h-28 animate-pulse" />
                            ))}
                        </div>
                    ) : !analytics?.hasEnoughData ? (
                        /* Placeholder — not enough data */
                        <div className="bg-white border border-border rounded-xl p-10 text-center max-w-lg mx-auto">
                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                <Target className="h-6 w-6 text-brand" />
                            </div>
                            <h3 className="font-bold text-text-primary mb-2">Analyses en cours de constitution</h3>
                            <p className="text-text-muted text-sm leading-relaxed">
                                Ces analyses seront disponibles après 3 mois d'utilisation.
                                Continuez à enregistrer vos devis et factures.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Row 1: acceptance + sign delay + pay delay */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                {/* Acceptance rate */}
                                <div className="bg-white border border-border rounded-xl p-5 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <DeltaBadge delta={computeDelta(analytics.acceptanceRate, analytics.prevAcceptanceRate)} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-extrabold text-text-primary">
                                            {analytics.acceptanceRate} %
                                        </div>
                                        <div className="text-xs text-text-muted mt-0.5">Taux d'acceptation des devis</div>
                                    </div>
                                    {analytics.acceptanceRate < 50 && (
                                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            Votre taux d'acceptation est faible
                                        </div>
                                    )}
                                </div>

                                {/* Avg sign delay */}
                                <div className="bg-white border border-border rounded-xl p-5 space-y-3">
                                    <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-extrabold text-text-primary">
                                            {analytics.avgSignDelay !== null
                                                ? `${analytics.avgSignDelay} j`
                                                : '—'}
                                        </div>
                                        <div className="text-xs text-text-muted mt-0.5">Délai moyen de signature</div>
                                    </div>
                                    {analytics.avgSignDelay === null && (
                                        <p className="text-xs text-text-muted italic">Aucun devis accepté enregistré</p>
                                    )}
                                </div>

                                {/* Avg pay delay */}
                                <div className="bg-white border border-border rounded-xl p-5 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                                            <Euro className="h-4 w-4" />
                                        </div>
                                        {analytics.avgPayDelay !== null && analytics.avgPayDelay > 30 && (
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="h-3 w-3" /> &gt; 30j
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-2xl font-extrabold text-text-primary">
                                            {analytics.avgPayDelay !== null
                                                ? `${analytics.avgPayDelay} j`
                                                : '—'}
                                        </div>
                                        <div className="text-xs text-text-muted mt-0.5">Délai moyen de paiement</div>
                                    </div>
                                    {analytics.avgPayDelay === null && (
                                        <p className="text-xs text-text-muted italic">Aucune facture payée enregistrée</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: top 3 clients */}
                            {analytics.topClients.length > 0 && (
                                <div className="bg-white border border-border rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Users className="h-4 w-4 text-brand" />
                                        <h3 className="font-bold text-sm text-text-primary">Top 3 clients par CA</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {analytics.topClients.map((c, i) => (
                                            <div key={c.clientId} className="flex items-center gap-4">
                                                <span
                                                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                                                    style={{ backgroundColor: CLIENT_COLORS[i] }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-semibold text-text-primary truncate">{c.name}</span>
                                                        <span className="text-sm font-bold text-text-primary ml-2 shrink-0">{formatEur(c.amount)}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{ width: `${c.pct}%`, backgroundColor: CLIENT_COLORS[i] }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold text-text-muted w-10 text-right shrink-0">{c.pct} %</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Row 3: late payers */}
                            {analytics.latePayerClients.length > 0 && (
                                <div className="bg-white border border-border rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                        <h3 className="font-bold text-sm text-text-primary">Clients qui paient en retard</h3>
                                        <span className="text-xs text-text-muted">(moyenne &gt; 30 jours)</span>
                                    </div>
                                    <div className="space-y-2">
                                        {analytics.latePayerClients.map(c => (
                                            <div
                                                key={c.clientId}
                                                className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-100"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                                                    <p className="text-xs text-amber-700 mt-0.5">
                                                        Délai moyen : <strong>{c.avgDelay} jours</strong>
                                                    </p>
                                                </div>
                                                {c.latestOverdueInvoiceId && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                                                        onClick={() => handleRelancer(c)}
                                                        disabled={reminderLoading === c.clientId}
                                                    >
                                                        {reminderLoading === c.clientId ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <><Send className="h-3.5 w-3.5 mr-1.5" />Relancer</>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Row 4: quiet months */}
                            {analytics.quietMonths.length > 0 && (
                                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                                    <CalendarX2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800">Mois creux détectés</p>
                                        <p className="text-sm text-blue-700 mt-0.5">
                                            Vos mois creux :{' '}
                                            <strong>{analytics.quietMonths.join(', ')}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Reminder modal */}
            {reminderInvoice && (
                <ReminderPreviewModal
                    open={!!reminderInvoice}
                    onOpenChange={open => { if (!open) setReminderInvoice(null); }}
                    invoice={reminderInvoice}
                    freelanceName={freelanceName}
                    canUseAI={canUseAI}
                />
            )}
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, delta, iconColor, iconBg }: {
    label: string;
    value: string;
    icon: ReactNode;
    delta: number | null;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
                    {icon}
                </div>
                <DeltaBadge delta={delta} />
            </div>
            <div className="text-2xl font-extrabold text-text-primary leading-none">{value}</div>
            <div className="text-xs text-text-muted mt-1">{label}</div>
        </div>
    );
}

// ─── Delta Badge ───────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
    if (delta === null) return null;
    if (delta > 0) {
        return (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" /> +{delta}%
            </span>
        );
    }
    if (delta < 0) {
        return (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <TrendingDown className="h-3 w-3" /> {delta}%
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted bg-surface px-2 py-0.5 rounded-full">
            <Minus className="h-3 w-3" /> 0%
        </span>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(v: number): string {
    return v.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
}

function computeDelta(current: number | undefined, previous: number | undefined): number | null {
    if (previous === undefined || current === undefined || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}
