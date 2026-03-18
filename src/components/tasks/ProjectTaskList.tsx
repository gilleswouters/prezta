import { useState, useRef } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, CheckSquare, Square } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProjectTaskListProps {
    projectId: string;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
    high: 'Haute',
    medium: 'Normale',
    low: 'Basse',
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
    high: 'bg-danger-light text-danger border border-danger/20',
    medium: 'bg-brand-light text-brand border border-brand/20',
    low: 'bg-surface2 text-text-muted border border-border',
};

function isOverdue(task: Task): boolean {
    if (!task.due_date || task.status === 'done') return false;
    return isBefore(parseISO(task.due_date), startOfDay(new Date()));
}

export function ProjectTaskList({ projectId }: ProjectTaskListProps) {
    const { data: tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(projectId);

    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
    const [newDate, setNewDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = newTitle.trim();
        if (!title) return;
        setIsSubmitting(true);
        try {
            await createTask({
                title,
                priority: newPriority,
                status: 'todo',
                project_id: projectId,
                due_date: newDate || null,
            });
            setNewTitle('');
            setNewDate('');
            setNewPriority('medium');
            inputRef.current?.focus();
        } catch (error) {
            toast.error('Impossible d\'ajouter la tâche', {
                description: error instanceof Error ? error.message : undefined,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (task: Task) => {
        try {
            await updateTask({
                id: task.id,
                updates: { status: task.status === 'done' ? 'todo' : 'done' },
            });
        } catch {
            toast.error('Impossible de mettre à jour la tâche');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTask(id);
        } catch {
            toast.error('Impossible de supprimer la tâche');
        }
    };

    const doneTasks = tasks?.filter(t => t.status === 'done') ?? [];
    const activeTasks = tasks?.filter(t => t.status !== 'done') ?? [];

    return (
        <div className="h-full flex flex-col gap-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">
                    Tâches
                    {tasks && tasks.length > 0 && (
                        <span className="ml-2 text-sm font-semibold text-text-muted bg-surface2 px-2 py-0.5 rounded-full border border-border">
                            {activeTasks.length} en cours
                        </span>
                    )}
                </h3>
            </div>

            {/* Inline Add Form */}
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 bg-surface2/60 border border-border rounded-xl p-3">
                <Input
                    ref={inputRef}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ajouter une tâche... (↵ pour valider)"
                    className="flex-1 bg-white border-border h-9 text-sm"
                    disabled={isSubmitting}
                />
                <Select value={newPriority} onValueChange={(v: TaskPriority) => setNewPriority(v)}>
                    <SelectTrigger className="w-full sm:w-32 h-9 bg-white border-border text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Normale</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full sm:w-40 h-9 bg-white border-border text-sm"
                    disabled={isSubmitting}
                />
                <Button
                    type="submit"
                    disabled={!newTitle.trim() || isSubmitting}
                    className="bg-brand text-white hover:bg-brand-hover h-9 px-4 shrink-0"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                </Button>
            </form>

            {/* Task List */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </div>
            ) : tasks?.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-12 text-text-muted">
                    <CheckSquare className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Aucune tâche pour ce projet.</p>
                    <p className="text-xs mt-1 opacity-60">Ajoutez une tâche ci-dessus pour commencer.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-2">
                    {/* Active tasks */}
                    {activeTasks.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                        />
                    ))}

                    {/* Done tasks — collapsed section */}
                    {doneTasks.length > 0 && (
                        <div className="pt-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-1">
                                Terminées ({doneTasks.length})
                            </p>
                            {doneTasks.map(task => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Task Row ────────────────────────────────────────────────────────────────

interface TaskRowProps {
    task: Task;
    onToggle: (task: Task) => void;
    onDelete: (id: string) => void;
}

function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
    const overdue = isOverdue(task);
    const done = task.status === 'done';

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${
                done
                    ? 'bg-surface2/40 border-border/50 opacity-60'
                    : overdue
                    ? 'bg-warning-light/50 border-warning/30'
                    : 'bg-white border-border hover:border-brand/20 hover:shadow-sm'
            }`}
        >
            {/* Checkbox */}
            <button
                type="button"
                onClick={() => onToggle(task)}
                className="shrink-0 text-text-muted hover:text-brand transition-colors"
                aria-label={done ? 'Marquer comme à faire' : 'Marquer comme terminée'}
            >
                {done ? (
                    <CheckSquare className="h-5 w-5 text-brand" />
                ) : (
                    <Square className="h-5 w-5" />
                )}
            </button>

            {/* Title */}
            <span className={`flex-1 text-sm font-medium truncate ${done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                {task.title}
            </span>

            {/* Priority badge */}
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline ${PRIORITY_BADGE[task.priority]}`}>
                {PRIORITY_LABELS[task.priority]}
            </span>

            {/* Due date */}
            {task.due_date && (
                <span className={`shrink-0 text-xs font-medium hidden md:inline ${overdue ? 'text-danger font-bold' : 'text-text-muted'}`}>
                    {format(parseISO(task.due_date), 'd MMM', { locale: fr })}
                </span>
            )}

            {/* Delete */}
            <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="shrink-0 text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Supprimer"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
