import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { CalendarDays, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, View, Clock, FileText, CalendarRange, Grid } from 'lucide-react';
import { format, isSameDay, parseISO, startOfWeek, addDays, subWeeks, addWeeks, subDays, isToday, startOfMonth, eachDayOfInterval, isSameMonth, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarPage() {
    const [baseDate, setBaseDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    const { data: tasks } = useTasks();
    const { data: projects } = useProjects();
    const { data: invoices } = useInvoices();

    // --- Date Calcs ---
    const currentWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    const monthStart = startOfMonth(baseDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: addDays(startDate, 41) }).slice(0, 42);

    const handlePrevious = () => {
        if (viewMode === 'month') setBaseDate(prev => subMonths(prev, 1));
        else if (viewMode === 'week') setBaseDate(prev => subWeeks(prev, 1));
        else setBaseDate(prev => subDays(prev, 1));
    };

    const handleNext = () => {
        if (viewMode === 'month') setBaseDate(prev => addMonths(prev, 1));
        else if (viewMode === 'week') setBaseDate(prev => addWeeks(prev, 1));
        else setBaseDate(prev => addDays(prev, 1));
    };

    const handleToday = () => setBaseDate(new Date());

    // --- Data Aggregation ---
    const allItems = useMemo(() => {
        const items: any[] = [];

        tasks?.forEach(t => {
            if (t.due_date) {
                items.push({
                    type: 'task',
                    id: `task-${t.id}`,
                    date: parseISO(t.due_date),
                    title: t.title,
                    subtitle: t.projects?.name || 'Tâche libre',
                    status: t.status,
                    raw: t
                });
            }
        });

        projects?.filter(p => !['completed', 'cancelled'].includes(p.status)).forEach(p => {
            p.expected_documents?.forEach((d: any) => {
                if (d.deadline) {
                    items.push({
                        type: 'project_doc',
                        id: `doc-${p.id}-${d.id}`,
                        date: parseISO(d.deadline),
                        title: `Rendre : ${d.name}`,
                        subtitle: p.name,
                        status: d.is_completed ? 'done' : 'pending',
                        raw: d
                    });
                }
            });
        });

        invoices?.filter(i => ['en_attente', 'en_retard'].includes(i.status)).forEach(i => {
            if (i.due_date) {
                items.push({
                    type: 'invoice',
                    id: `inv-${i.id}`,
                    date: parseISO(i.due_date),
                    title: `FA-${i.id.split('-')[0].toUpperCase()}`,
                    subtitle: i.projects?.name || 'Libre',
                    status: i.status === 'en_retard' ? 'late' : 'pending',
                    amount: i.amount,
                    raw: i
                });
            }
        });

        return items;
    }, [tasks, projects, invoices]);

    const getItemsForDate = (date: Date) =>
        allItems.filter(item => isSameDay(item.date, date));

    const renderItemCard = (item: any, compact: boolean = false) => {
        const isTask = item.type === 'task';
        const isInvoice = item.type === 'invoice';
        const isProject = item.type === 'project_doc';

        let bgClass = "bg-surface border-border hover:border-[var(--brand-border)]";
        let icon = <CalendarIcon className="h-3 w-3 text-text-muted" />;
        let titleColor = "text-text-primary";

        if (isInvoice) {
            bgClass = item.status === 'late' ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200";
            icon = <AlertCircle className={`h-3 w-3 ${item.status === 'late' ? 'text-red-500' : 'text-orange-500'}`} />;
            titleColor = item.status === 'late' ? "text-red-800" : "text-orange-800";
        } else if (isTask) {
            bgClass = item.status === 'done' ? "bg-emerald-50 border-emerald-200 opacity-60" : "bg-brand-light border-brand-border";
            icon = item.status === 'done' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3 text-brand" />;
            titleColor = item.status === 'done' ? "text-emerald-800 line-through" : "text-brand";
        } else if (isProject) {
            bgClass = item.status === 'done' ? "bg-emerald-50 border-emerald-200 opacity-60" : "bg-blue-50 border-blue-200";
            icon = item.status === 'done' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <FileText className="h-3 w-3 text-blue-500" />;
            titleColor = item.status === 'done' ? "text-emerald-800 line-through" : "text-blue-800";
        }

        if (compact) {
            return (
                <div key={item.id} className={`px-1.5 py-1 mb-1 rounded border text-[10px] shadow-sm flex items-center gap-1.5 cursor-pointer truncate ${bgClass}`}>
                    <div className="shrink-0">{icon}</div>
                    <span className={`font-semibold truncate ${titleColor}`}>{item.title}</span>
                </div>
            );
        }

        return (
            <div key={item.id} className={`p-2 rounded-lg border text-sm shadow-sm transition-all cursor-pointer ${bgClass}`}>
                <div className="flex items-start justify-between gap-1 mb-1">
                    <p className={`font-bold leading-tight ${titleColor}`}>{item.title}</p>
                    <div className="shrink-0 mt-0.5">{icon}</div>
                </div>
                <p className="text-[11px] text-text-muted truncate">{item.subtitle}</p>
                {isInvoice && (
                    <p className="text-xs font-bold mt-1 text-text-primary">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.amount)}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-serif text-text-primary">Calendrier & Tâches</h1>
                    <p className="text-text-muted mt-1">Votre agenda sur-mesure pour votre activité freelance.</p>
                </div>
            </div>

            {/* Calendar panel */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-border rounded-xl shadow-sm">
                {/* Toolbar */}
                <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-surface/50">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleToday} className="text-xs font-semibold h-8 text-text-secondary bg-white hover:bg-surface-hover">
                            Aujourd'hui
                        </Button>
                        <div className="flex items-center bg-white border border-border rounded-md overflow-hidden">
                            <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8 rounded-none hover:bg-surface-hover text-text-secondary">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 rounded-none hover:bg-surface-hover text-text-secondary border-l border-border">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="text-sm font-bold ml-4 text-text-primary capitalize min-w-[200px]">
                            {viewMode === 'month'
                                ? format(baseDate, 'MMMM yyyy', { locale: fr })
                                : viewMode === 'week'
                                    ? `${format(weekDays[0], 'd MMM', { locale: fr })} - ${format(weekDays[6], 'd MMMM yyyy', { locale: fr })}`
                                    : format(baseDate, 'EEEE d MMMM yyyy', { locale: fr })
                            }
                        </h2>
                    </div>
                    <div className="flex items-center bg-surface border border-border rounded-md p-1">
                        <Button
                            variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('month')}
                            className={`h-7 text-xs px-3 ${viewMode === 'month' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            <Grid className="h-3.5 w-3.5 mr-1.5" /> Mois
                        </Button>
                        <Button
                            variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('week')}
                            className={`h-7 text-xs px-3 ${viewMode === 'week' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            <CalendarRange className="h-3.5 w-3.5 mr-1.5" /> Semaine
                        </Button>
                        <Button
                            variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('day')}
                            className={`h-7 text-xs px-3 ${viewMode === 'day' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            <View className="h-3.5 w-3.5 mr-1.5" /> Jour
                        </Button>
                    </div>
                </div>

                {/* MONTH VIEW */}
                {viewMode === 'month' && (
                    <div className="flex-1 overflow-x-auto flex flex-col min-w-[800px] bg-surface">
                        <div className="grid grid-cols-7 border-b border-border bg-white shrink-0">
                            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(dayName => (
                                <div key={dayName} className="py-2 text-center border-r border-border last:border-r-0">
                                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted">
                                        {dayName}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr">
                            {calendarDays.map((day) => {
                                const isCurrentMonth = isSameMonth(day, baseDate);
                                const dayItems = getItemsForDate(day);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => { setBaseDate(day); setViewMode('day'); }}
                                        className={`border-r border-b border-border p-1.5 last:border-r-0 min-h-[100px] cursor-pointer transition-colors
                                            ${isCurrentMonth ? 'bg-white hover:bg-surface-hover/50' : 'bg-surface/50 text-text-muted/50'}
                                            ${isToday(day) ? 'bg-brand-light/10' : ''}
                                        `}
                                    >
                                        <div className="flex flex-col h-full overflow-hidden">
                                            <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-brand text-white' : isCurrentMonth ? 'text-text-primary' : 'text-text-muted/50'}`}>
                                                {format(day, 'd')}
                                            </div>
                                            <div className="flex-1 overflow-y-auto overflow-x-hidden invisible-scrollbar pr-1">
                                                {dayItems.slice(0, 4).map(item => renderItemCard(item, true))}
                                                {dayItems.length > 4 && (
                                                    <div className="text-[10px] text-text-muted font-semibold mt-1 px-1">
                                                        + {dayItems.length - 4} autre(s)
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* WEEK VIEW */}
                {viewMode === 'week' && (
                    <div className="flex-1 overflow-x-auto flex flex-col min-w-[800px]">
                        <div className="grid grid-cols-7 border-b border-border bg-surface shrink-0">
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className={`py-3 text-center border-r border-border last:border-r-0 ${isToday(day) ? 'bg-brand-light/30' : ''}`}>
                                    <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-0.5">
                                        {format(day, 'EEE', { locale: fr })}
                                    </div>
                                    <div className={`text-lg font-extrabold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-brand text-white' : 'text-text-primary'}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
                            {weekDays.map(day => {
                                const dayItems = getItemsForDate(day);
                                return (
                                    <div key={day.toISOString()} className={`border-r border-border p-2 last:border-r-0 min-h-[500px] ${isToday(day) ? 'bg-brand-light/10' : 'bg-white'} hover:bg-surface-hover/50 transition-colors`}>
                                        <div className="flex flex-col gap-2">
                                            {dayItems.length === 0 ? (
                                                <div className="text-center py-4 opacity-0 hover:opacity-100 transition-opacity">
                                                    <p className="text-[10px] text-text-muted italic">Ajouter</p>
                                                </div>
                                            ) : (
                                                dayItems.map(item => renderItemCard(item, false))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* DAY VIEW */}
                {viewMode === 'day' && (
                    <div className="flex-1 overflow-y-auto bg-surface p-6">
                        <div className="max-w-3xl mx-auto bg-white border border-border rounded-xl shadow-sm p-8 min-h-[600px]">
                            <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-text-primary capitalize">{format(baseDate, 'EEEE', { locale: fr })}</h2>
                                    <p className="text-lg text-text-muted font-medium">{format(baseDate, 'd MMMM yyyy', { locale: fr })}</p>
                                </div>
                                {isToday(baseDate) && (
                                    <Badge variant="outline" className="bg-brand-light text-brand border-brand-border font-bold px-3 py-1 text-sm">Aujourd'hui</Badge>
                                )}
                            </div>
                            <div className="space-y-6">
                                {getItemsForDate(baseDate).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted">
                                        <div className="bg-surface2 p-4 rounded-full mb-4">
                                            <CalendarDays className="h-10 w-10 text-text-muted/30" />
                                        </div>
                                        <p className="font-serif text-xl text-text-primary mb-1">Journée libre !</p>
                                        <p className="text-sm">Aucune échéance ou tâche planifiée pour aujourd'hui.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getItemsForDate(baseDate).map(item => renderItemCard(item, false))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
