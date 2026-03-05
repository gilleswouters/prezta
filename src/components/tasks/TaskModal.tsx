import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: Task | null;
    defaultProjectId?: string;
}

export function TaskModal({ open, onOpenChange, task, defaultProjectId }: TaskModalProps) {
    const { createTask, updateTask, deleteTask, isCreating, isUpdating, isDeleting } = useTasks(defaultProjectId);
    const { data: projects } = useProjects();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(defaultProjectId || null);

    useEffect(() => {
        if (open) {
            if (task) {
                setTitle(task.title);
                setDescription(task.description || '');
                setStatus(task.status);
                setPriority(task.priority);
                setDueDate(task.due_date ? new Date(task.due_date) : undefined);
                setSelectedProjectId(task.project_id || defaultProjectId || null);
            } else {
                setTitle('');
                setDescription('');
                setStatus('todo');
                setPriority('medium');
                setDueDate(undefined);
                setSelectedProjectId(defaultProjectId || null);
            }
        }
    }, [open, task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            if (task) {
                await updateTask({
                    id: task.id,
                    updates: {
                        title,
                        description: description || null,
                        status,
                        priority,
                        due_date: dueDate ? dueDate.toISOString() : null,
                        project_id: selectedProjectId,
                    }
                });
                toast.success('Tâche mise à jour');
            } else {
                await createTask({
                    title,
                    description: description || null,
                    project_id: selectedProjectId,
                    status,
                    priority,
                    due_date: dueDate ? dueDate.toISOString() : null,
                });
                toast.success('Tâche créée');
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Erreur', { description: error.message });
        }
    };

    const handleDelete = async () => {
        if (!task) return;
        if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
            try {
                await deleteTask(task.id);
                toast.success('Tâche supprimée');
                onOpenChange(false);
            } catch (error: any) {
                toast.error('Erreur', { description: error.message });
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
                    <DialogDescription>
                        {task ? 'Mettez à jour les détails de la tâche.' : 'Créez une nouvelle tâche et assignez-lui une date.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Rédiger le cahier des charges" required />
                    </div>

                    <div className="space-y-2">
                        <Label>Projet Lié (Optionnel)</Label>
                        <Select value={selectedProjectId || "none"} onValueChange={(v) => setSelectedProjectId(v === "none" ? null : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un projet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" className="text-text-muted italic">-- Aucun projet --</SelectItem>
                                {projects?.filter(p => p.status !== 'completed' && p.status !== 'cancelled').map(project => (
                                    <SelectItem key={project.id} value={project.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-brand"></div>
                                            {project.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select value={status} onValueChange={(v: TaskStatus) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">À faire</SelectItem>
                                    <SelectItem value="in_progress">En cours</SelectItem>
                                    <SelectItem value="review">En validation</SelectItem>
                                    <SelectItem value="done">Terminée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priorité</Label>
                            <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Basse</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Haute</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label>Échéance</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dueDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Détails, liens, notes..."
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 pb-2 border-t mt-6">
                        {task ? (
                            <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={isDeleting}>
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </Button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                            <Button type="submit" className="bg-brand text-white hover:bg-brand-hover" disabled={isCreating || isUpdating}>
                                {task ? 'Enregistrer' : 'Créer la tâche'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
