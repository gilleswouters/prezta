import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    addDays,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    format,
    isSameDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Clock, TrendingUp, BarChart2, CheckCircle2, FileText, Receipt, CalendarDays, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { useWeeklySummary, useMonthlySummary, useDeleteTimeEntry, useBillTimeEntries, formatHours } from '@/hooks/useTimeEntries';
import { useProducts } from '@/hooks/useProducts';
import { ManualTimeEntryModal } from '@/components/time/ManualTimeEntryModal';
import { InvoiceModal } from '@/components/invoices/InvoiceModal';
import { useQuoteStore } from '@/stores/useQuoteStore';
import { buildQuoteLines } from '@/lib/time-to-billing';
import { toast } from 'sonner';
import type { TimeEntry } from '@/types/time';
import type { Product } from '@/types/product';
import { ChevronDown } from 'lucide-react';
import { parseISO } from 'date-fns';

type ViewMode = 'week' | 'month' | 'calendar';
type GroupMode = 'project' | 'date';

// Deterministic project colors
const PROJECT_COLORS = ['#2563EB', '#9333EA', '#16A34A', '#EA580C', '#0891B2', '#DC2626', '#7C3AED', '#D97706'];
function projectColor(idx: number) { return PROJECT_COLORS[idx % PROJECT_COLORS.length]; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimesheetPage() {
    const navigate = useNavigate();
    const store = useQuoteStore();
    const [view, setView] = useState<ViewMode>('week');
    const [groupMode, setGroupMode] = useState<GroupMode>('project');
    const [selectedCalDay, setSelectedCalDay] = useState<Date | null>(null);

    // Week navigation
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 }),
    );
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    // Month navigation
    const [monthDate, setMonthDate] = useState<Date>(() => new Date());
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;

    // Modal state
    const [manualOpen, setManualOpen] = useState(false);
    const [manualDate, setManualDate] = useState<string | undefined>();
    const [manualProjectId, setManualProjectId] = useState<string | null>(null);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoiceDefaults, setInvoiceDefaults] = useState<{ project_id?: string | null; amount?: number; notes?: string }>({});

    // Data
    const { data: weekly, isLoading: weekLoading } = useWeeklySummary(weekStart);
    const { data: monthly, isLoading: monthLoading } = useMonthlySummary(year, month);
    const { data: products = [] } = useProducts();
    const deleteEntry = useDeleteTimeEntry();
    const billEntries = useBillTimeEntries();

    const isLoading = view === 'week' ? weekLoading : monthLoading;

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // All visible entries in current view
    const allVisibleEntries = useMemo(() => {
        if (view === 'week') return weekly?.entries ?? [];
        return (monthly?.byProject ?? []).flatMap((r) => r.entries);
    }, [view, weekly, monthly]);

    // Selected entries (from allVisibleEntries, matching selectedIds)
    const selectedEntries = useMemo(
        () => allVisibleEntries.filter((e) => selectedIds.has(e.id)),
        [allVisibleEntries, selectedIds],
    );

    const selectedTotalSeconds = selectedEntries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);

    function openManual(date?: string, projectId?: string | null) {
        setManualDate(date);
        setManualProjectId(projectId ?? null);
        setEditingEntry(null);
        setManualOpen(true);
    }

    function openEdit(entry: TimeEntry) {
        setEditingEntry(entry);
        setManualOpen(true);
    }

    async function confirmDelete() {
        if (deleteTarget) {
            await deleteEntry.mutateAsync(deleteTarget);
            setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteTarget); return next; });
            setDeleteTarget(null);
        }
    }

    // ─── Selection helpers ────────────────────────────────────────────────────

    function toggleEntry(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleProjectWeek(projectId: string | null) {
        const projectEntries = (weekly?.entries ?? []).filter(
            (e) => e.project_id === projectId,
        );
        const allSelected = projectEntries.every((e) => selectedIds.has(e.id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const e of projectEntries) {
                if (allSelected) next.delete(e.id);
                else next.add(e.id);
            }
            return next;
        });
    }

    function toggleProjectMonth(projectId: string | null) {
        const projectEntries = (monthly?.byProject ?? [])
            .find((r) => r.projectId === projectId)
            ?.entries ?? [];
        const allSelected = projectEntries.every((e) => selectedIds.has(e.id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const e of projectEntries) {
                if (allSelected) next.delete(e.id);
                else next.add(e.id);
            }
            return next;
        });
    }

    // ─── Billing actions ──────────────────────────────────────────────────────

    function handleCreateQuote() {
        if (selectedEntries.length === 0) return;
        const lines = buildQuoteLines(selectedEntries, products as Product[]);
        store.setPendingTimesheetLines(lines);
        billEntries.mutate(Array.from(selectedIds));
        setSelectedIds(new Set());
        navigate('/projets');
        toast.info('Sélectionnez le projet pour lequel créer le devis.');
    }

    function handleCreateInvoice() {
        if (selectedEntries.length === 0) return;
        const lines = buildQuoteLines(selectedEntries, products as Product[]);
        const totalHT = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

        // Determine project if all entries belong to the same one
        const projectIds = [...new Set(selectedEntries.map((e) => e.project_id).filter(Boolean))];
        const singleProject = projectIds.length === 1 ? projectIds[0] : null;

        const descParts = lines.map((l) => `${l.name} (${l.quantity}h)`).join(', ');

        setInvoiceDefaults({
            project_id: singleProject,
            amount: parseFloat(totalHT.toFixed(2)),
            notes: `Temps facturé : ${descParts}`,
        });
        setInvoiceModalOpen(true);
    }

    function handleInvoiceCreated() {
        billEntries.mutate(Array.from(selectedIds));
        setSelectedIds(new Set());
    }

    // Summary stats
    const totalSeconds = view === 'week' ? (weekly?.totalSeconds ?? 0) : (monthly?.totalSeconds ?? 0);
    const chartData = view === 'week'
        ? (weekly?.byProject ?? []).map((r, i) => ({ name: r.projectName, hours: parseFloat((r.totalSeconds / 3600).toFixed(1)), color: projectColor(i) }))
        : (monthly?.byProject ?? []).map((r, i) => ({ name: r.projectName, hours: parseFloat((r.totalSeconds / 3600).toFixed(1)), color: projectColor(i) }));

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Suivi du temps</h2>
                    <p className="text-sm text-text-muted mt-0.5">Suivi du temps par projet</p>
                </div>
                <Button
                    className="bg-brand text-white hover:bg-brand/90 gap-2"
                    onClick={() => openManual()}
                >
                    <Plus className="h-4 w-4" />
                    Ajouter une entrée
                </Button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Total heures</p>
                        <p className="text-2xl font-bold text-text-primary">{formatHours(totalSeconds)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Projets actifs</p>
                        <p className="text-2xl font-bold text-text-primary">
                            {view === 'week' ? (weekly?.byProject ?? []).length : (monthly?.byProject ?? []).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <BarChart2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Moy / jour</p>
                        <p className="text-2xl font-bold text-text-primary">
                            {view === 'week'
                                ? formatHours(Math.round(totalSeconds / 7))
                                : formatHours(Math.round(totalSeconds / new Date(year, month, 0).getDate()))
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Distribution bar chart */}
            {chartData.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold text-text-primary mb-3">Répartition par projet</p>
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                            <XAxis type="number" unit="h" tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(val: number | undefined) => [`${val ?? 0}h`, 'Heures']}
                                labelFormatter={(label) => String(label)}
                            />
                            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, idx) => (
                                    <Cell key={entry.name} fill={projectColor(idx)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* View toggle + navigation */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        {/* View toggle */}
                        <div className="flex rounded-lg border border-border overflow-hidden">
                            {(['week', 'month', 'calendar'] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => { setView(v); setSelectedIds(new Set()); setSelectedCalDay(null); }}
                                    className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                                        view === v
                                            ? 'bg-brand text-white'
                                            : 'text-text-secondary hover:bg-surface'
                                    }`}
                                >
                                    {v === 'week' ? 'Semaine' : v === 'month' ? 'Mois' : <><CalendarDays className="h-3.5 w-3.5" /> Calendrier</>}
                                </button>
                            ))}
                        </div>

                        {/* Group toggle (month only) */}
                        {view === 'month' && (
                            <div className="flex rounded-lg border border-border overflow-hidden">
                                {(['project', 'date'] as const).map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setGroupMode(g)}
                                        className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                                            groupMode === g
                                                ? 'bg-surface2 text-text-primary'
                                                : 'text-text-muted hover:bg-surface'
                                        }`}
                                    >
                                        {g === 'project' ? <><BarChart2 className="h-3 w-3" /> Par projet</> : <><List className="h-3 w-3" /> Par date</>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => view === 'week'
                                ? setWeekStart((d) => subWeeks(d, 1))
                                : setMonthDate((d) => subMonths(d, 1))
                            }
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold text-text-primary min-w-[160px] text-center">
                            {view === 'week'
                                ? `${format(weekStart, 'd MMM', { locale: fr })} – ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
                                : format(monthDate, 'MMMM yyyy', { locale: fr })
                            }
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => view === 'week'
                                ? setWeekStart((d) => addWeeks(d, 1))
                                : setMonthDate((d) => addMonths(d, 1))
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => view === 'week'
                                ? setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
                                : setMonthDate(new Date())
                            }
                        >
                            Aujourd'hui
                        </Button>
                    </div>
                </div>

                {/* ─── Weekly grid ─── */}
                {view === 'week' && (
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-text-muted text-sm">Chargement…</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-surface">
                                        <th className="text-left px-4 py-2 font-semibold text-text-muted text-xs uppercase tracking-wider w-40">
                                            Projet
                                        </th>
                                        {weekDays.map((day) => (
                                            <th
                                                key={day.toISOString()}
                                                className={`text-center px-2 py-2 font-semibold text-xs uppercase tracking-wider ${
                                                    isSameDay(day, new Date()) ? 'text-brand' : 'text-text-muted'
                                                }`}
                                            >
                                                <div>{format(day, 'EEE', { locale: fr })}</div>
                                                <div className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-brand' : 'text-text-primary'}`}>
                                                    {format(day, 'd')}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="text-right px-4 py-2 font-semibold text-text-muted text-xs uppercase tracking-wider">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(weekly?.byProject ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-8 text-text-muted text-sm">
                                                Aucune entrée cette semaine
                                            </td>
                                        </tr>
                                    ) : (
                                        (weekly?.byProject ?? []).map((row, pIdx) => {
                                            const projectEntries = (weekly?.entries ?? []).filter(
                                                (e) => e.project_id === row.projectId,
                                            );
                                            const allBilled = projectEntries.length > 0 && projectEntries.every((e) => e.is_billed);
                                            const allSelected = projectEntries.length > 0 && projectEntries.every((e) => selectedIds.has(e.id));
                                            const someSelected = projectEntries.some((e) => selectedIds.has(e.id));

                                            return (
                                                <tr key={row.projectId ?? '__none__'} className={`hover:bg-surface/50 ${someSelected ? 'bg-brand-light/10' : ''}`}>
                                                    <td className="px-4 py-3 font-medium text-text-primary">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                checked={allSelected}
                                                                onCheckedChange={() => toggleProjectWeek(row.projectId)}
                                                                className="shrink-0"
                                                                aria-label={`Sélectionner ${row.projectName}`}
                                                            />
                                                            <span
                                                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                                                style={{ background: projectColor(pIdx) }}
                                                            />
                                                            <span className="truncate max-w-[100px]">{row.projectName}</span>
                                                            {allBilled && (
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" aria-label="Facturé" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    {row.dailySeconds.map((secs, dayIdx) => (
                                                        <td
                                                            key={dayIdx}
                                                            className={`text-center px-2 py-3 cursor-pointer hover:bg-brand-light/50 transition-colors ${
                                                                isSameDay(weekDays[dayIdx], new Date()) ? 'bg-blue-50/30' : ''
                                                            }`}
                                                            onClick={() =>
                                                                openManual(
                                                                    format(weekDays[dayIdx], 'yyyy-MM-dd'),
                                                                    row.projectId,
                                                                )
                                                            }
                                                            title="Cliquer pour ajouter une entrée"
                                                        >
                                                            {secs > 0 ? (
                                                                <span className="font-mono text-xs font-semibold text-text-primary">
                                                                    {formatHours(secs)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-border">–</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                                                        {formatHours(row.totalSeconds)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                {/* Daily totals row */}
                                {(weekly?.byProject ?? []).length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-border bg-surface font-bold">
                                            <td className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                Total
                                            </td>
                                            {(weekly?.dailyTotals ?? []).map((secs, i) => (
                                                <td key={i} className="text-center px-2 py-2 font-mono text-sm">
                                                    {secs > 0 ? formatHours(secs) : <span className="text-border">–</span>}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2 text-right font-mono text-sm text-brand">
                                                {formatHours(weekly?.totalSeconds ?? 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        )}
                    </div>
                )}

                {/* ─── Monthly list ─── */}
                {view === 'month' && groupMode === 'project' && (
                    <div className="divide-y divide-border">
                        {isLoading ? (
                            <div className="p-8 text-center text-text-muted text-sm">Chargement…</div>
                        ) : (monthly?.byProject ?? []).length === 0 ? (
                            <div className="p-8 text-center text-text-muted text-sm">Aucune entrée ce mois</div>
                        ) : (
                            (monthly?.byProject ?? []).map((row, pIdx) => {
                                const allSelected = row.entries.length > 0 && row.entries.every((e) => selectedIds.has(e.id));
                                const someSelected = row.entries.some((e) => selectedIds.has(e.id));

                                return (
                                    <Collapsible key={row.projectId ?? '__none__'} defaultOpen={pIdx === 0}>
                                        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface/50 transition-colors">
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={allSelected}
                                                    onCheckedChange={() => toggleProjectMonth(row.projectId)}
                                                    className="shrink-0"
                                                    aria-label={`Sélectionner tout ${row.projectName}`}
                                                />
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                                    style={{ background: projectColor(pIdx) }}
                                                />
                                                <span className={`font-semibold text-text-primary ${someSelected ? 'text-brand' : ''}`}>{row.projectName}</span>
                                                <span className="text-xs text-text-muted">({row.entries.length} entrée{row.entries.length > 1 ? 's' : ''})</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold text-text-primary">{formatHours(row.totalSeconds)}</span>
                                                <ChevronDown className="h-4 w-4 text-text-muted transition-transform [[data-state=open]>&]:rotate-180" />
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="divide-y divide-border bg-surface/30">
                                                {row.entries.map((entry) => {
                                                    const isSelected = selectedIds.has(entry.id);
                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            className={`flex items-center justify-between px-6 py-2.5 ${isSelected ? 'bg-brand-light/20' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleEntry(entry.id)}
                                                                    className="shrink-0"
                                                                    aria-label="Sélectionner cette entrée"
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-text-muted font-mono">
                                                                            {format(parseISO(entry.started_at), 'dd/MM')}
                                                                        </span>
                                                                        {entry.description && (
                                                                            <span className="text-sm text-text-primary truncate max-w-[280px]">
                                                                                {entry.description}
                                                                            </span>
                                                                        )}
                                                                        {entry.tasks && (
                                                                            <span className="text-xs px-1.5 py-0.5 bg-surface rounded text-text-muted">
                                                                                {entry.tasks.title}
                                                                            </span>
                                                                        )}
                                                                        {entry.is_billed && (
                                                                            <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" aria-label="Facturé" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-text-muted mt-0.5">
                                                                        {format(parseISO(entry.started_at), 'HH:mm', { locale: fr })}
                                                                        {entry.ended_at && ` – ${format(parseISO(entry.ended_at), 'HH:mm', { locale: fr })}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                                <span className="font-mono text-sm font-semibold text-text-primary">
                                                                    {entry.duration_seconds !== null ? formatHours(entry.duration_seconds) : '–'}
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-text-muted hover:text-text-primary"
                                                                    onClick={() => openEdit(entry)}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-text-muted hover:text-danger hover:bg-danger-light"
                                                                    onClick={() => setDeleteTarget(entry.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            })
                        )}
                        {/* Month total */}
                        {(monthly?.byProject ?? []).length > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-surface font-bold border-t-2 border-border">
                                <span className="text-text-muted text-sm uppercase tracking-wider">Total du mois</span>
                                <span className="font-mono text-brand">{formatHours(monthly?.totalSeconds ?? 0)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Monthly by date ─── */}
                {view === 'month' && groupMode === 'date' && (() => {
                    const allEntries = (monthly?.byProject ?? []).flatMap(r => r.entries);
                    // Group by day
                    const byDay = new Map<string, typeof allEntries>();
                    allEntries.forEach(e => {
                        const day = format(parseISO(e.started_at), 'yyyy-MM-dd');
                        const prev = byDay.get(day) ?? [];
                        byDay.set(day, [...prev, e]);
                    });
                    const sortedDays = Array.from(byDay.keys()).sort().reverse();

                    return (
                        <div className="divide-y divide-border">
                            {isLoading ? (
                                <div className="p-8 text-center text-text-muted text-sm">Chargement…</div>
                            ) : sortedDays.length === 0 ? (
                                <div className="p-8 text-center text-text-muted text-sm">Aucune entrée ce mois</div>
                            ) : sortedDays.map(day => {
                                const dayEntries = byDay.get(day)!;
                                const daySecs = dayEntries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);
                                return (
                                    <Collapsible key={day} defaultOpen>
                                        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface/50 transition-colors">
                                            <span className="font-semibold text-text-primary capitalize">
                                                {format(parseISO(day), 'EEEE d MMMM', { locale: fr })}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold text-text-primary">{formatHours(daySecs)}</span>
                                                <ChevronDown className="h-4 w-4 text-text-muted transition-transform [[data-state=open]>&]:rotate-180" />
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="divide-y divide-border bg-surface/30">
                                                {dayEntries.map(entry => (
                                                    <div key={entry.id} className="flex items-center justify-between px-6 py-2.5">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    {entry.projects && (
                                                                        <span className="text-xs px-1.5 py-0.5 bg-brand-light text-brand rounded font-medium">
                                                                            {entry.projects.name}
                                                                        </span>
                                                                    )}
                                                                    {entry.description && (
                                                                        <span className="text-sm text-text-primary truncate max-w-[280px]">
                                                                            {entry.description}
                                                                        </span>
                                                                    )}
                                                                    {entry.is_billed && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                                                                </div>
                                                                <p className="text-xs text-text-muted mt-0.5">
                                                                    {format(parseISO(entry.started_at), 'HH:mm', { locale: fr })}
                                                                    {entry.ended_at && ` – ${format(parseISO(entry.ended_at), 'HH:mm', { locale: fr })}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                                            <span className="font-mono text-sm font-semibold text-text-primary">
                                                                {entry.duration_seconds !== null ? formatHours(entry.duration_seconds) : '–'}
                                                            </span>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-text-primary" onClick={() => openEdit(entry)}>
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-danger hover:bg-danger-light" onClick={() => setDeleteTarget(entry.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            })}
                            {sortedDays.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 bg-surface font-bold border-t-2 border-border">
                                    <span className="text-text-muted text-sm uppercase tracking-wider">Total du mois</span>
                                    <span className="font-mono text-brand">{formatHours(monthly?.totalSeconds ?? 0)}</span>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* ─── Calendar view ─── */}
                {view === 'calendar' && (() => {
                    const allEntries = (monthly?.byProject ?? []).flatMap(r => r.entries);
                    const daySecsMap = new Map<string, number>();
                    const dayEntriesMap = new Map<string, typeof allEntries>();
                    allEntries.forEach(e => {
                        const day = format(parseISO(e.started_at), 'yyyy-MM-dd');
                        daySecsMap.set(day, (daySecsMap.get(day) ?? 0) + (e.duration_seconds ?? 0));
                        dayEntriesMap.set(day, [...(dayEntriesMap.get(day) ?? []), e]);
                    });

                    const monthStart = startOfMonth(monthDate);
                    const monthEnd = endOfMonth(monthDate);
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                    // Pad start to Monday
                    const startPad = (getDay(monthStart) + 6) % 7; // 0=Mon
                    const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

                    const dayColorClass = (secs: number) => {
                        const h = secs / 3600;
                        if (h === 0) return 'bg-white';
                        if (h < 1) return 'bg-blue-50';
                        if (h < 4) return 'bg-blue-100';
                        if (h < 8) return 'bg-blue-400 text-white';
                        return 'bg-blue-700 text-white';
                    };

                    const selectedDayKey = selectedCalDay ? format(selectedCalDay, 'yyyy-MM-dd') : null;
                    const selectedDayEntries = selectedDayKey ? (dayEntriesMap.get(selectedDayKey) ?? []) : [];

                    return (
                        <div className="flex gap-0">
                            {/* Calendar grid */}
                            <div className="flex-1 p-4">
                                {isLoading ? (
                                    <div className="p-8 text-center text-text-muted text-sm">Chargement…</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-7 mb-1">
                                            {DAY_LABELS.map(d => (
                                                <div key={d} className="text-center text-[11px] font-bold text-text-muted uppercase tracking-wider py-1">{d}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: startPad }).map((_, i) => (
                                                <div key={`pad-${i}`} />
                                            ))}
                                            {days.map(day => {
                                                const key = format(day, 'yyyy-MM-dd');
                                                const secs = daySecsMap.get(key) ?? 0;
                                                const isToday = isSameDay(day, new Date());
                                                const isSelected = selectedCalDay ? isSameDay(day, selectedCalDay) : false;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => setSelectedCalDay(isSelected ? null : day)}
                                                        className={`relative flex flex-col items-center justify-center h-14 rounded-lg text-xs font-medium transition-all border ${
                                                            isSelected
                                                                ? 'border-brand ring-2 ring-brand/30'
                                                                : isToday
                                                                ? 'border-brand/40'
                                                                : 'border-border/40'
                                                        } ${dayColorClass(secs)} hover:opacity-80`}
                                                    >
                                                        <span className={`text-[13px] font-bold ${isToday ? 'text-brand' : ''}`}>{format(day, 'd')}</span>
                                                        {secs > 0 && (
                                                            <span className="text-[10px] font-mono mt-0.5 opacity-90">{formatHours(secs)}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {/* Legend */}
                                        <div className="flex items-center gap-3 mt-4 text-[11px] text-text-muted">
                                            <span>Intensité :</span>
                                            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-white border border-border" /> 0h</span>
                                            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-100" /> 1-4h</span>
                                            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-400" /> 4-8h</span>
                                            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-700" /> 8h+</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Day side panel */}
                            {selectedCalDay && (
                                <div className="w-72 border-l border-border flex flex-col shrink-0">
                                    <div className="px-4 py-3 border-b border-border bg-surface">
                                        <p className="font-semibold text-text-primary capitalize text-sm">
                                            {format(selectedCalDay, 'EEEE d MMMM', { locale: fr })}
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {formatHours(daySecsMap.get(format(selectedCalDay, 'yyyy-MM-dd')) ?? 0)} enregistrée(s)
                                        </p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto divide-y divide-border">
                                        {selectedDayEntries.length === 0 ? (
                                            <div className="p-4 text-sm text-text-muted text-center">Aucune entrée</div>
                                        ) : selectedDayEntries.map(entry => (
                                            <div key={entry.id} className="px-4 py-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        {entry.projects && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-brand-light text-brand rounded font-medium">
                                                                {entry.projects.name}
                                                            </span>
                                                        )}
                                                        {entry.description && (
                                                            <p className="text-sm text-text-primary mt-1 truncate">{entry.description}</p>
                                                        )}
                                                        <p className="text-xs text-text-muted mt-0.5">
                                                            {format(parseISO(entry.started_at), 'HH:mm')}
                                                            {entry.ended_at && ` – ${format(parseISO(entry.ended_at), 'HH:mm')}`}
                                                        </p>
                                                    </div>
                                                    <span className="font-mono text-sm font-bold text-text-primary shrink-0">
                                                        {entry.duration_seconds ? formatHours(entry.duration_seconds) : '–'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-border">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-xs h-8"
                                            onClick={() => openManual(format(selectedCalDay, 'yyyy-MM-dd'))}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Ajouter une entrée
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Manual entry modal */}
            <ManualTimeEntryModal
                open={manualOpen}
                onClose={() => { setManualOpen(false); setEditingEntry(null); }}
                defaultDate={manualDate}
                defaultProjectId={manualProjectId}
                entry={editingEntry}
            />

            {/* Invoice modal */}
            <InvoiceModal
                open={invoiceModalOpen}
                onOpenChange={setInvoiceModalOpen}
                defaultValues={invoiceDefaults}
                onCreated={handleInvoiceCreated}
            />

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette entrée de temps ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-danger text-white hover:bg-danger/90"
                            onClick={confirmDelete}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ─── Sticky selection action bar ─── */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-0 left-[240px] right-0 z-40 bg-white border-t border-border shadow-lg px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text-primary">
                            {selectedIds.size} entrée{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-text-muted font-mono bg-surface px-2 py-0.5 rounded">
                            {formatHours(selectedTotalSeconds)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5 border-brand/30 text-brand hover:bg-brand-light"
                            onClick={handleCreateQuote}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Créer un devis
                        </Button>
                        <Button
                            size="sm"
                            className="text-xs h-8 gap-1.5 bg-success text-white hover:bg-success/90"
                            onClick={handleCreateInvoice}
                        >
                            <Receipt className="h-3.5 w-3.5" />
                            Créer une facture
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
