import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/hooks/useTasks';
import type { TaskPriority } from '@/types/task';
import { Loader2, Plus, Euro } from 'lucide-react';
import { toast } from 'sonner';

interface QuickTaskPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
}

export function QuickTaskPopup({ open, onOpenChange, projectId }: QuickTaskPopupProps) {
    const { createTask } = useTasks(projectId);

    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [facturable, setFacturable] = useState(false);
    const [prixEstime, setPrixEstime] = useState('');
    const [inclusDevis, setInclusDevis] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reset = () => {
        setTitle('');
        setPriority('medium');
        setFacturable(false);
        setPrixEstime('');
        setInclusDevis(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const t = title.trim();
        if (!t) return;
        setIsSubmitting(true);
        try {
            await createTask({
                title: t,
                priority,
                status: 'todo',
                project_id: projectId,
                due_date: null,
                facturable,
                prix_estime: facturable && prixEstime ? parseFloat(prixEstime) : null,
                inclus_devis: facturable ? inclusDevis : false,
            });
            toast.success('Tâche ajoutée.');
            reset();
            onOpenChange(false);
        } catch (error) {
            toast.error('Impossible d\'ajouter la tâche', {
                description: error instanceof Error ? error.message : undefined,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[420px] bg-white border-border rounded-2xl p-6">
                <DialogTitle className="text-base font-bold text-text-primary">Nouvelle tâche / prestation</DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-0.5">
                    Ajoutez une tâche au projet. Cochez "Facturable" pour en faire une prestation.
                </DialogDescription>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Title */}
                    <Input
                        autoFocus
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Titre de la tâche..."
                        className="bg-white border-border h-9 text-sm"
                        disabled={isSubmitting}
                    />

                    {/* Priority */}
                    <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                        <SelectTrigger className="bg-white border-border h-9 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high">Priorité haute</SelectItem>
                            <SelectItem value="medium">Priorité normale</SelectItem>
                            <SelectItem value="low">Priorité basse</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Facturable toggle */}
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

                    {/* Billable fields (conditional) */}
                    {facturable && (
                        <div className="space-y-3 pl-2 border-l-2 border-amber-200">
                            <label className="flex items-center gap-2 text-sm text-text-muted">
                                <Euro className="h-4 w-4 shrink-0 text-amber-500" />
                                <span className="w-24 shrink-0">Prix estimé</span>
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
                                Inclure dans le prochain devis
                            </label>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!title.trim() || isSubmitting}
                            className="flex-1 bg-brand text-white hover:bg-brand-hover"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            ) : (
                                <Plus className="h-4 w-4 mr-1.5" />
                            )}
                            Ajouter
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
