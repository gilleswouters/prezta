import { useState } from 'react';
import type { Task, TaskStatus } from '@/types/task';

type GanttScale = 'day' | 'week' | 'month';

interface GanttChartProps {
    tasks: Task[];
    scale: GanttScale;
}

interface TooltipData {
    task: Task;
    x: number;
    y: number;
}

const STATUS_COLORS: Record<TaskStatus, { bar: string; label: string }> = {
    todo:        { bar: '#94a3b8', label: 'À faire' },
    in_progress: { bar: 'var(--brand, #2563EB)', label: 'En cours' },
    review:      { bar: '#f59e0b', label: 'En révision' },
    done:        { bar: '#22c55e', label: 'Terminé' },
};

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // Monday
    return startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff));
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number): Date {
    return new Date(d.getTime() + n * 86400000);
}

function addWeeks(d: Date, n: number): Date {
    return addDays(d, n * 7);
}

function addMonths(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function formatColLabel(d: Date, scale: GanttScale): string {
    if (scale === 'day') {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
    if (scale === 'week') {
        const end = addDays(d, 6);
        return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: '2-digit' })}`;
    }
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

function buildColumns(start: Date, end: Date, scale: GanttScale): Date[] {
    const cols: Date[] = [];
    let cur = scale === 'day' ? startOfDay(start)
            : scale === 'week' ? startOfWeek(start)
            : startOfMonth(start);
    while (cur <= end) {
        cols.push(cur);
        cur = scale === 'day'  ? addDays(cur, 1)
            : scale === 'week' ? addWeeks(cur, 1)
            : addMonths(cur, 1);
    }
    return cols;
}

function positionBar(
    taskStart: Date,
    taskEnd: Date,
    rangeStart: Date,
    rangeEnd: Date,
): { left: number; width: number } {
    const total = rangeEnd.getTime() - rangeStart.getTime();
    if (total <= 0) return { left: 0, width: 100 };
    const left  = Math.max(0, (taskStart.getTime() - rangeStart.getTime()) / total) * 100;
    const right = Math.min(1, (taskEnd.getTime()   - rangeStart.getTime()) / total) * 100;
    const width = Math.max(right - left, 0.5);
    return { left, width };
}

export function GanttChart({ tasks, scale }: GanttChartProps) {
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const today = startOfDay(new Date());

    // Compute date range from tasks
    const dates = tasks.flatMap(t => [
        t.start_date ? new Date(t.start_date) : new Date(t.created_at),
        t.due_date   ? new Date(t.due_date)   : null,
    ]).filter(Boolean) as Date[];

    const rawStart = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : addDays(today, -3);
    const rawEnd   = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : addDays(today, 14);

    // Pad by one unit each side
    const pad = scale === 'day' ? 1 : scale === 'week' ? 7 : 30;
    const rangeStart = startOfDay(addDays(rawStart, -pad));
    const rangeEnd   = startOfDay(addDays(rawEnd,    pad));

    const columns = buildColumns(rangeStart, rangeEnd, scale);

    // Today marker position
    const totalMs   = rangeEnd.getTime() - rangeStart.getTime();
    const todayLeft = totalMs > 0
        ? ((today.getTime() - rangeStart.getTime()) / totalMs) * 100
        : -1;

    const TASK_COL_W = 140; // px, fixed left column

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted text-sm gap-2">
                <span>Aucune tâche à afficher dans ce projet.</span>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            {/* Scrollable Gantt area */}
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 360, border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-lg)' }}>
                <table style={{ borderCollapse: 'collapse', minWidth: columns.length * 80 + TASK_COL_W, width: '100%', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: TASK_COL_W }} />
                        {columns.map((_, i) => <col key={i} />)}
                    </colgroup>

                    {/* Header */}
                    <thead>
                        <tr style={{ background: 'var(--color-bg-2, #F8F9FA)', position: 'sticky', top: 0, zIndex: 2 }}>
                            <th style={{
                                padding: '6px 10px',
                                textAlign: 'left',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--color-text-2)',
                                borderBottom: '1px solid var(--color-border-2)',
                                borderRight: '1px solid var(--color-border-2)',
                                background: 'var(--color-bg-2, #F8F9FA)',
                                position: 'sticky',
                                left: 0,
                                zIndex: 3,
                            }}>
                                Tâche
                            </th>
                            {columns.map((col, i) => {
                                const isToday = scale === 'day' && col.getTime() === today.getTime();
                                return (
                                    <th key={i} style={{
                                        padding: '6px 4px',
                                        textAlign: 'center',
                                        fontSize: 10,
                                        fontWeight: isToday ? 700 : 500,
                                        color: isToday ? 'var(--brand, #2563EB)' : 'var(--color-text-2)',
                                        borderBottom: '1px solid var(--color-border-2)',
                                        borderRight: '1px solid var(--color-border-1)',
                                        whiteSpace: 'nowrap',
                                        background: isToday ? 'var(--p-50, #eff6ff)' : 'var(--color-bg-2, #F8F9FA)',
                                    }}>
                                        {formatColLabel(col, scale)}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    {/* Rows */}
                    <tbody>
                        {tasks.map((task, rowIdx) => {
                            const taskStart = task.start_date
                                ? startOfDay(new Date(task.start_date))
                                : startOfDay(new Date(task.created_at));
                            const taskEnd = task.due_date
                                ? startOfDay(new Date(task.due_date))
                                : addDays(taskStart, scale === 'day' ? 1 : scale === 'week' ? 7 : 30);

                            const { left, width } = positionBar(taskStart, taskEnd, rangeStart, rangeEnd);
                            const color = STATUS_COLORS[task.status]?.bar ?? '#94a3b8';
                            const isEven = rowIdx % 2 === 0;

                            return (
                                <tr key={task.id} style={{ height: 34, background: isEven ? '#fff' : 'var(--color-bg-2, #F8F9FA)' }}>
                                    {/* Task name cell — sticky left */}
                                    <td style={{
                                        padding: '0 10px',
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: 'var(--color-text-1)',
                                        borderRight: '1px solid var(--color-border-2)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: TASK_COL_W,
                                        position: 'sticky',
                                        left: 0,
                                        background: isEven ? '#fff' : 'var(--color-bg-2, #F8F9FA)',
                                        zIndex: 1,
                                    }}>
                                        {task.title}
                                    </td>

                                    {/* Timeline cell spanning all columns */}
                                    <td
                                        colSpan={columns.length}
                                        style={{ position: 'relative', padding: 0, verticalAlign: 'middle' }}
                                    >
                                        {/* Column separators */}
                                        {columns.map((_, i) => (
                                            <div key={i} style={{
                                                position: 'absolute',
                                                top: 0, bottom: 0,
                                                left: `${(i / columns.length) * 100}%`,
                                                width: 1,
                                                background: 'var(--color-border-1)',
                                                opacity: 0.5,
                                            }} />
                                        ))}

                                        {/* Today line */}
                                        {todayLeft >= 0 && todayLeft <= 100 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, bottom: 0,
                                                left: `${todayLeft}%`,
                                                width: 2,
                                                background: 'var(--brand, #2563EB)',
                                                opacity: 0.4,
                                                zIndex: 1,
                                            }} />
                                        )}

                                        {/* Task bar */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                height: 18,
                                                background: color,
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                zIndex: 2,
                                                minWidth: 6,
                                                opacity: task.status === 'done' ? 0.6 : 1,
                                            }}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltip({ task, x: rect.left, y: rect.top });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {(Object.entries(STATUS_COLORS) as [TaskStatus, { bar: string; label: string }][]).map(([, { bar, label }]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-2)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: bar, flexShrink: 0 }} />
                        {label}
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-2)' }}>
                    <div style={{ width: 2, height: 10, background: 'var(--brand, #2563EB)', opacity: 0.4, flexShrink: 0 }} />
                    Aujourd'hui
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    style={{
                        position: 'fixed',
                        left: tooltip.x + 12,
                        top: tooltip.y - 8,
                        zIndex: 9999,
                        background: '#fff',
                        border: '1px solid var(--color-border-2)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        minWidth: 180,
                        pointerEvents: 'none',
                    }}
                >
                    <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: 'var(--color-text-1)' }}>{tooltip.task.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-2)', marginBottom: 2 }}>
                        Statut : {STATUS_COLORS[tooltip.task.status]?.label}
                    </p>
                    {tooltip.task.start_date && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-2)', marginBottom: 2 }}>
                            Début : {new Date(tooltip.task.start_date).toLocaleDateString('fr-FR')}
                        </p>
                    )}
                    {tooltip.task.due_date && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-2)', marginBottom: 2 }}>
                            Échéance : {new Date(tooltip.task.due_date).toLocaleDateString('fr-FR')}
                        </p>
                    )}
                    {tooltip.task.prix_estime != null && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-2)' }}>
                            Prix estimé : {tooltip.task.prix_estime} €{tooltip.task.quantite_tache != null ? ` × ${tooltip.task.quantite_tache}` : ''}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
