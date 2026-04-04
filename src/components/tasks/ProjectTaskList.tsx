import { useState, useRef } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskDetailModal } from './TaskDetailModal';
import type { Task, TaskPriority, TaskStatus, TaskFormData } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, CheckSquare, Pencil } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProjectTaskListProps {
    projectId: string;
}

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
    const [editingTask, setEditingTask] = useState<Task | null>(null);
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

    const handleUpdate = async (id: string, updates: Partial<TaskFormData>) => {
        try {
            await updateTask({ id, updates });
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
                <p className="text-xs text-text-muted hidden sm:block">
                    Cochez <span className="font-semibold text-brand">☑</span> pour inclure dans le devis
                </p>
            </div>

            {/* Inline Add Form */}
            <form onSubmit={handleAdd} className="flex gap-2 bg-surface2/60 border border-border rounded-xl p-3">
                <Input
                    ref={inputRef}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ajouter une tâche... (↵ pour valider)"
                    className="flex-1 bg-white border-border h-9 text-sm"
                    disabled={isSubmitting}
                />
                <Select value={newPriority} onValueChange={(v: TaskPriority) => setNewPriority(v)}>
                    <SelectTrigger className="w-32 h-9 bg-white border-border text-sm shrink-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="high">🔴 Haute</SelectItem>
                        <SelectItem value="medium">🟡 Normale</SelectItem>
                        <SelectItem value="low">🟢 Basse</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-40 h-9 bg-white border-border text-sm hidden sm:block shrink-0"
                    disabled={isSubmitting}
                />
                <Button
                    type="submit"
                    disabled={!newTitle.trim() || isSubmitting}
                    className="bg-brand text-white hover:bg-brand-hover h-9 px-4 shrink-0"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
            </form>

            {/* Column labels */}
            {tasks && tasks.length > 0 && (
                <div className="hidden sm:grid grid-cols-[16px_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    <span title="Inclure dans le devis">☑</span>
                    <span>Tâche</span>
                    <span className="w-[120px]">Statut</span>
                    <span className="w-[100px] hidden md:block">Priorité</span>
                    <span className="w-[60px] hidden lg:block">Échéance</span>
                    <span className="w-[28px]" />
                    <span className="w-[28px]" />
                </div>
            )}

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
                <div className="flex-1 overflow-y-auto space-y-1.5">
                    {activeTasks.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onEdit={setEditingTask}
                        />
                    ))}

                    {doneTasks.length > 0 && (
                        <div className="pt-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 px-1">
                                Terminées ({doneTasks.length})
                            </p>
                            {doneTasks.map(task => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                    onEdit={setEditingTask}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <TaskDetailModal
                open={!!editingTask}
                onOpenChange={(open) => { if (!open) setEditingTask(null); }}
                task={editingTask}
                projectId={projectId}
            />
        </div>
    );
}

// ─── Task Row ────────────────────────────────────────────────────────────────

interface TaskRowProps {
    task: Task;
    onUpdate: (id: string, updates: Partial<TaskFormData>) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
}

function TaskRow({ task, onUpdate, onDelete, onEdit }: TaskRowProps) {
    const overdue = isOverdue(task);
    const done = task.status === 'done';
    const inDevis = task.inclus_devis ?? false;

    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all group ${
                inDevis
                    ? 'bg-blue-50/60 border-blue-200/70 hover:border-blue-300'
                    : done
                    ? 'bg-surface2/40 border-border/50 opacity-60'
                    : overdue
                    ? 'bg-warning-light/50 border-warning/30'
                    : 'bg-white border-border hover:border-brand/20 hover:shadow-sm'
            }`}
        >
            {/* Inclus devis checkbox */}
            <div title="Inclure dans le devis" className="shrink-0">
                <input
                    type="checkbox"
                    checked={inDevis}
                    onChange={e => onUpdate(task.id, { inclus_devis: e.target.checked })}
                    className="h-4 w-4 accent-brand rounded cursor-pointer"
                />
            </div>

            {/* Title — click opens edit modal */}
            <button
                type="button"
                onClick={() => onEdit(task)}
                className={`flex-1 text-sm font-medium truncate text-left ${done ? 'line-through text-text-muted' : 'text-text-primary hover:text-brand'}`}
                title={task.title}
            >
                {task.title}
                {task.facturable && (
                    <span className="ml-2 text-[10px] font-bold text-amber-600 opacity-80">
                        {task.prix_estime ? `${task.prix_estime.toFixed(0)}€` : '€'}
                    </span>
                )}
            </button>

            {/* Status dropdown */}
            <Select value={task.status} onValueChange={(v: TaskStatus) => onUpdate(task.id, { status: v })}>
                <SelectTrigger className="w-[120px] h-7 text-xs bg-white border-border shrink-0 hidden sm:flex">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
            </Select>

            {/* Priority dropdown */}
            <Select value={task.priority} onValueChange={(v: TaskPriority) => onUpdate(task.id, { priority: v })}>
                <SelectTrigger className="w-[100px] h-7 text-xs bg-white border-border shrink-0 hidden md:flex">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="high">🔴 Haute</SelectItem>
                    <SelectItem value="medium">🟡 Normale</SelectItem>
                    <SelectItem value="low">🟢 Basse</SelectItem>
                </SelectContent>
            </Select>

            {/* Due date */}
            <span className={`shrink-0 text-xs font-medium w-[60px] text-right hidden lg:block ${overdue ? 'text-danger font-bold' : 'text-text-muted'}`}>
                {task.due_date ? format(parseISO(task.due_date), 'd MMM', { locale: fr }) : ''}
            </span>

            {/* Edit icon */}
            <button
                type="button"
                onClick={() => onEdit(task)}
                className="shrink-0 text-text-muted hover:text-brand transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Modifier"
            >
                <Pencil className="h-3.5 w-3.5" />
            </button>

            {/* Delete icon */}
            <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="shrink-0 text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Supprimer"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
