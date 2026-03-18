import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTimerStore } from '@/stores/timerStore';
import { Plus, ChevronLeft, ChevronRight, Play, AlertTriangle } from 'lucide-react';
import { isBefore, parseISO, startOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; accent: string; bg: string; border: string }[] = [
    { status: 'todo',        label: 'À faire',     accent: 'bg-gray-400',    bg: 'bg-gray-50',    border: 'border-gray-200' },
    { status: 'in_progress', label: 'En cours',    accent: 'bg-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200' },
    { status: 'review',      label: 'En révision', accent: 'bg-amber-400',   bg: 'bg-amber-50',   border: 'border-amber-200' },
    { status: 'done',        label: 'Terminé',     accent: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

const PRIORITY_DOT: Record<TaskPriority, string> = {
    high:   'bg-red-500',
    medium: 'bg-blue-400',
    low:    'bg-gray-400',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
    high:   'Haute',
    medium: 'Normale',
    low:    'Basse',
};

function isOverdue(task: Task): boolean {
    if (!task.due_date || task.status === 'done') return false;
    return isBefore(parseISO(task.due_date), startOfDay(new Date()));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanningPage() {
    const { data: tasks, isLoading, updateTask, createTask } = useTasks();
    const { data: projects } = useProjects();

    const [filterProject, setFilterProject]   = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    // Create task dialog
    const [createOpen, setCreateOpen]       = useState(false);
    const [createStatus, setCreateStatus]   = useState<TaskStatus>('todo');
    const [newTitle, setNewTitle]           = useState('');
    const [newProject, setNewProject]       = useState<string>('none');
    const [newPriority, setNewPriority]     = useState<TaskPriority>('medium');
    const [newDueDate, setNewDueDate]       = useState('');
    const [isSubmitting, setIsSubmitting]   = useState(false);

    const filteredTasks = (tasks ?? []).filter(t => {
        if (filterProject !== 'all' && t.project_id !== filterProject) return false;
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
        return true;
    });

    const getColumnTasks = (status: TaskStatus): Task[] =>
        filteredTasks.filter(t => t.status === status);

    const moveTask = async (task: Task, direction: 'prev' | 'next') => {
        const currentIdx = STATUS_ORDER.indexOf(task.status);
        const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
        if (newIdx < 0 || newIdx >= STATUS_ORDER.length) return;
        await updateTask({ id: task.id, updates: { status: STATUS_ORDER[newIdx] } });
    };

    const openCreate = (status: TaskStatus = 'todo') => {
        setCreateStatus(status);
        setNewTitle('');
        setNewProject('none');
        setNewPriority('medium');
        setNewDueDate('');
        setCreateOpen(true);
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setIsSubmitting(true);
        try {
            await createTask({
                title:      newTitle.trim(),
                project_id: newProject === 'none' ? null : newProject,
                priority:   newPriority,
                status:     createStatus,
                due_date:   newDueDate || null,
            });
            setCreateOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight">Planning</h1>
                    <p className="text-text-secondary mt-1">Vue Kanban de toutes vos tâches.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="h-9 text-xs w-44 bg-white border-border">
                            <SelectValue placeholder="Tous les projets" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les projets</SelectItem>
                            {projects?.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="h-9 text-xs w-36 bg-white border-border">
                            <SelectValue placeholder="Toutes priorités" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes priorités</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="medium">Normale</SelectItem>
                            <SelectItem value="low">Basse</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        className="h-9 bg-brand text-white hover:bg-brand-hover text-xs font-semibold"
                        onClick={() => openCreate('todo')}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Nouvelle tâche
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            {isLoading ? (
                <div className="py-20 text-center text-text-muted animate-pulse">
                    Chargement des tâches...
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {COLUMNS.map((col) => {
                        const colTasks = getColumnTasks(col.status);
                        return (
                            <div
                                key={col.status}
                                className={`rounded-xl border ${col.border} ${col.bg} flex flex-col min-h-[480px]`}
                            >
                                {/* Column header */}
                                <div className="px-4 py-3 flex items-center gap-2 border-b border-black/5 shrink-0">
                                    <span className={`h-2.5 w-2.5 rounded-full ${col.accent} shrink-0`} />
                                    <span className="text-sm font-bold text-text-primary">{col.label}</span>
                                    <span className="ml-auto text-xs font-semibold bg-white border border-border/60 text-text-muted px-2 py-0.5 rounded-full">
                                        {colTasks.length}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-text-muted hover:text-brand"
                                        onClick={() => openCreate(col.status)}
                                        title="Ajouter une tâche"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Task cards */}
                                <div className="p-2 flex flex-col gap-2 flex-1 overflow-y-auto">
                                    {colTasks.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-xs text-text-muted italic">Aucune tâche</p>
                                        </div>
                                    ) : (
                                        colTasks.map(task => (
                                            <KanbanCard
                                                key={task.id}
                                                task={task}
                                                onMove={moveTask}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Task Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nouvelle tâche</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Titre *</label>
                            <Input
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Ex. Rédiger le brief client"
                                className="h-9 text-sm"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Projet</label>
                                <Select value={newProject} onValueChange={setNewProject}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Sans projet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sans projet</SelectItem>
                                        {projects?.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Priorité</label>
                                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as TaskPriority)}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">Haute</SelectItem>
                                        <SelectItem value="medium">Normale</SelectItem>
                                        <SelectItem value="low">Basse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Échéance</label>
                                <Input
                                    type="date"
                                    value={newDueDate}
                                    onChange={e => setNewDueDate(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Statut</label>
                                <Select value={createStatus} onValueChange={(v) => setCreateStatus(v as TaskStatus)}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COLUMNS.map(c => (
                                            <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                                Annuler
                            </Button>
                            <Button
                                size="sm"
                                className="bg-brand text-white hover:bg-brand-hover"
                                onClick={handleCreate}
                                disabled={!newTitle.trim() || isSubmitting}
                            >
                                {isSubmitting ? 'Création...' : 'Créer'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────

function KanbanCard({ task, onMove }: {
    task: Task;
    onMove: (task: Task, direction: 'prev' | 'next') => void;
}) {
    const overdue = isOverdue(task);
    const timer = useTimerStore();
    const currentIdx = STATUS_ORDER.indexOf(task.status);

    function handleStartTimer(e: React.MouseEvent) {
        e.stopPropagation();
        timer.startTimer({
            projectId:   task.project_id,
            taskId:      task.id,
            description: task.title,
        });
    }

    return (
        <div className={`bg-white rounded-lg border p-3 shadow-sm group transition-shadow hover:shadow-md ${
            overdue ? 'border-red-200' : 'border-border'
        }`}>
            {/* Priority dot + title */}
            <div className="flex items-start gap-2 mb-2">
                <span
                    className={`h-2 w-2 rounded-full shrink-0 mt-[5px] ${PRIORITY_DOT[task.priority]}`}
                    title={PRIORITY_LABELS[task.priority]}
                />
                <p className={`text-sm font-semibold leading-tight flex-1 ${
                    task.status === 'done' ? 'line-through text-text-muted' : 'text-text-primary'
                }`}>
                    {task.title}
                </p>
            </div>

            {/* Project + due date */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3 pl-4">
                {task.projects?.name && (
                    <span className="text-[10px] font-bold bg-brand-light text-brand px-1.5 py-0.5 rounded-full border border-brand/20">
                        {task.projects.name}
                    </span>
                )}
                {task.due_date && (
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${
                        overdue ? 'text-red-600' : 'text-text-muted'
                    }`}>
                        {overdue && <AlertTriangle className="h-2.5 w-2.5" />}
                        {format(parseISO(task.due_date), 'd MMM', { locale: fr })}
                    </span>
                )}
            </div>

            {/* Footer: move arrows + timer */}
            <div className="flex items-center justify-between pl-4">
                <div className="flex gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30"
                        onClick={() => onMove(task, 'prev')}
                        disabled={currentIdx === 0}
                        title="Colonne précédente"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30"
                        onClick={() => onMove(task, 'next')}
                        disabled={currentIdx === STATUS_ORDER.length - 1}
                        title="Colonne suivante"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
                {task.status !== 'done' && (
                    <button
                        onClick={handleStartTimer}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded flex items-center justify-center hover:bg-brand/10 text-brand"
                        title="Démarrer le chronomètre"
                        aria-label="Démarrer le chronomètre"
                    >
                        <Play className="h-3 w-3 fill-brand" />
                    </button>
                )}
            </div>
        </div>
    );
}
