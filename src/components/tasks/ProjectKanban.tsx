import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskStatus } from '@/types/task';
import { Plus, GripVertical, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TaskModal } from './TaskModal';

interface ProjectKanbanProps {
    projectId?: string;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'À faire', color: 'bg-slate-100 text-slate-700' },
    { id: 'in_progress', label: 'En cours', color: 'bg-blue-100 text-blue-700' },
    { id: 'review', label: 'En validation', color: 'bg-amber-100 text-amber-700' },
    { id: 'done', label: 'Terminé', color: 'bg-emerald-100 text-emerald-700' },
];

// Helper to generate a consistent color from a string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700', 'bg-green-100 text-green-700', 'bg-emerald-100 text-emerald-700', 'bg-teal-100 text-teal-700', 'bg-cyan-100 text-cyan-700', 'bg-sky-100 text-sky-700', 'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-purple-100 text-purple-700', 'bg-fuchsia-100 text-fuchsia-700', 'bg-pink-100 text-pink-700', 'bg-rose-100 text-rose-700'];
    return colors[Math.abs(hash) % colors.length];
};

export function ProjectKanban({ projectId }: ProjectKanbanProps) {
    const { data: tasks, isLoading } = useTasks(projectId);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleCreateTask = () => {
        setSelectedTask(null);
        // Defaulting the modal's initial status if needed could be passed via context,
        // but for now, the modal handles new task creation cleanly.
        setIsTaskModalOpen(true);
    };

    // await updateTask({ id: task.id, updates: { status: newStatus } });
    // };

    if (isLoading) {
        return <div className="p-8 text-center animate-pulse text-text-muted">Chargement des tâches...</div>;
    }

    const tasksByColumn = COLUMNS.reduce((acc, col) => {
        acc[col.id] = tasks?.filter(t => t.status === col.id) || [];
        return acc;
    }, {} as Record<TaskStatus, Task[]>);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text-primary">Tableau des tâches</h3>
                <Button onClick={() => handleCreateTask()} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] h-9 text-xs">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Tâche
                </Button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
                {COLUMNS.map(column => (
                    <div key={column.id} className="bg-gray-50/50 border border-border rounded-xl flex flex-col h-full min-h-[500px]">
                        <div className="p-3 border-b border-border flex items-center justify-between bg-white/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${column.color}`}>
                                    {column.label}
                                </span>
                                <span className="text-xs font-semibold text-text-muted bg-gray-100 px-1.5 py-0.5 rounded-full">
                                    {tasksByColumn[column.id].length}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-text-muted" onClick={() => handleCreateTask()}>
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="p-3 flex-1 overflow-y-auto space-y-3">
                            {tasksByColumn[column.id].map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => handleEditTask(task)}
                                    className="bg-white p-3 rounded-lg border border-border shadow-sm cursor-pointer hover:border-[var(--brand-border)] hover:shadow-md transition-all group relative"
                                >
                                    {/* Priority Indicator Line */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${task.priority === 'high' ? 'bg-red-400' :
                                        task.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                                        }`}></div>

                                    <div className="flex items-start justify-between pl-2">
                                        <h4 className="font-semibold text-sm text-text-primary leading-tight line-clamp-2 pr-4">{task.title}</h4>
                                        <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </div>

                                    {task.projects?.name && (
                                        <div className="mt-2 pl-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stringToColor(task.projects.name)}`}>
                                                {task.projects.name}
                                            </span>
                                        </div>
                                    )}

                                    {task.due_date && (
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium pl-2">
                                            <CalendarIcon className={`h-3.5 w-3.5 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-gray-400'}`} />
                                            <span className={new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-600 font-bold' : 'text-gray-500'}>
                                                {format(parseISO(task.due_date), 'd MMM', { locale: fr })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {tasksByColumn[column.id].length === 0 && (
                                <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs font-medium text-gray-400">
                                    Glisser ici
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <TaskModal
                open={isTaskModalOpen}
                onOpenChange={setIsTaskModalOpen}
                task={selectedTask}
                defaultProjectId={projectId}
            />
        </div>
    );
}
