import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    projectId: string;
}

export function TaskDetailModal({ open, onOpenChange, task, projectId }: TaskDetailModalProps) {
    const { updateTask } = useTasks(projectId);

    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [facturable, setFacturable] = useState(false);
    const [prixEstime, setPrixEstime] = useState('');
    const [inclusDevis, setInclusDevis] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (task && open) {
            setTitle(task.title);
            setNotes(task.description ?? '');
            setStatus(task.status);
            setPriority(task.priority);
            setDueDate(task.due_date ?? '');
            setFacturable(task.facturable ?? false);
            setPrixEstime(task.prix_estime?.toString() ?? '');
            setInclusDevis(task.inclus_devis ?? false);
        }
    }, [task, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;
        const t = title.trim();
        if (!t) return;
        setIsSubmitting(true);
        try {
            await updateTask({
                id: task.id,
                updates: {
                    title: t,
                    description: notes.trim() || null,
                    status,
                    priority,
                    due_date: dueDate || null,
                    facturable,
                    prix_estime: facturable && prixEstime ? parseFloat(prixEstime) : null,
                    inclus_devis: facturable ? inclusDevis : false,
                },
            });
            toast.success('Tâche mise à jour.');
            onOpenChange(false);
        } catch (error) {
            toast.error('Impossible de mettre à jour la tâche', {
                description: error instanceof Error ? error.message : undefined,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-white border-border rounded-2xl p-6">
                <DialogTitle className="text-base font-bold text-text-primary">Modifier la tâche</DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-0.5">
                    Modifiez les détails de cette tâche ou prestation.
                </DialogDescription>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Nom *</label>
                        <Input
                            autoFocus
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Titre de la tâche"
                            className="bg-white border-border h-9 text-sm"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Notes ou détails..."
                            rows={3}
                            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</label>
                            <Select value={status} onValueChange={(v: TaskStatus) => setStatus(v)}>
                                <SelectTrigger className="bg-white border-border h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">À faire</SelectItem>
                                    <SelectItem value="in_progress">En cours</SelectItem>
                                    <SelectItem value="done">Terminé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Priorité</label>
                            <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                                <SelectTrigger className="bg-white border-border h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">🔴 Haute</SelectItem>
                                    <SelectItem value="medium">🟡 Normale</SelectItem>
                                    <SelectItem value="low">🟢 Basse</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Date d'échéance</label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="bg-white border-border h-9 text-sm"
                            disabled={isSubmitting}
                        />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-border hover:border-amber-300 hover:bg-amber-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={facturable}
                            onChange={e => setFacturable(e.target.checked)}
                            className="h-4 w-4 accent-amber-500"
                        />
                        <div>
                            <p className="text-sm font-semibold text-text-primary">Facturable</p>
                            <p className="text-[11px] text-text-muted">Cette tâche peut être incluse dans un devis.</p>
                        </div>
                    </label>

                    {facturable && (
                        <div className="space-y-3 pl-2 border-l-2 border-amber-200">
                            <label className="flex items-center gap-2 text-sm text-text-muted">
                                <span className="w-28 shrink-0 text-xs">Prix estimé</span>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={prixEstime}
                                    onChange={e => setPrixEstime(e.target.value)}
                                    className="flex-1 bg-white border-border h-8 text-sm"
                                />
                                <span className="text-xs text-text-muted shrink-0">€ HT</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-text-muted hover:text-text-primary">
                                <input
                                    type="checkbox"
                                    checked={inclusDevis}
                                    onChange={e => setInclusDevis(e.target.checked)}
                                    className="h-4 w-4 accent-brand"
                                />
                                Inclure dans le devis
                            </label>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!title.trim() || isSubmitting}
                            className="flex-1 bg-brand text-white hover:bg-brand-hover"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            Sauvegarder
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
