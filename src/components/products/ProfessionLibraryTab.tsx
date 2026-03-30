/**
 * "Depuis ma bibliothèque" tab inside ProductModal.
 * Shows profession tasks for the user's saved profession_slug.
 * Users check tasks, set a price per task, then bulk-import.
 */
import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useProfessionTasks } from '@/hooks/useProfessions';
import { useCreateProductBatch } from '@/hooks/useProducts';
import { Unit } from '@/types/product';
import type { ProductFormData } from '@/types/product';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SelectedTask {
    taskId: string;
    price: string; // raw string input → parsed on submit
}

interface ProfessionLibraryTabProps {
    onImported: () => void;
}

export function ProfessionLibraryTab({ onImported }: ProfessionLibraryTabProps) {
    const navigate = useNavigate();
    const { data: profile, isLoading: profileLoading } = useProfile();
    const professionSlug = profile?.profession_slug ?? null;

    const { data: tasks, isLoading: tasksLoading } = useProfessionTasks(professionSlug);
    const createBatch = useCreateProductBatch();

    const [selected, setSelected] = useState<Record<string, SelectedTask>>({});

    const toggleTask = (taskId: string) => {
        setSelected(prev => {
            if (prev[taskId]) {
                const next = { ...prev };
                delete next[taskId];
                return next;
            }
            return { ...prev, [taskId]: { taskId, price: '' } };
        });
    };

    const setPrice = (taskId: string, price: string) => {
        setSelected(prev => ({
            ...prev,
            [taskId]: { taskId, price },
        }));
    };

    const selectedCount = Object.keys(selected).length;

    const handleImport = async () => {
        if (!tasks) return;
        const products: ProductFormData[] = tasks
            .filter(t => selected[t.id])
            .map(t => {
                const priceRaw = selected[t.id]?.price ?? '';
                const unit_price = parseFloat(priceRaw) || 0;
                const unit: Unit = (t.unite as Unit) in { heure: 1, forfait: 1, 'pièce': 1, jour: 1 }
                    ? (t.unite as Unit)
                    : Unit.FORFAIT;
                return {
                    name:        t.nom,
                    description: t.description ?? null,
                    unit_price,
                    tva_rate:    t.tva_taux,
                    unit,
                };
            });

        await createBatch.mutateAsync(products);
        onImported();
    };

    if (profileLoading || tasksLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
        );
    }

    // No profession set on profile
    if (!professionSlug) {
        return (
            <div className="flex flex-col items-center text-center py-10 px-4 gap-4">
                <BookOpen className="h-10 w-10 text-text-muted" />
                <div>
                    <p className="font-semibold text-text-primary">Aucun métier défini</p>
                    <p className="text-sm text-text-muted mt-1">
                        Ajoutez votre métier dans votre profil pour accéder à la bibliothèque de prestations.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    onClick={() => navigate('/profil')}
                >
                    Compléter mon profil <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
            </div>
        );
    }

    // Profession is set but has no tasks in the library (e.g. "autre")
    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex flex-col items-center text-center py-10 px-4 gap-3">
                <BookOpen className="h-10 w-10 text-text-muted" />
                <p className="text-sm text-text-muted">
                    Aucune prestation pré-configurée pour ce métier.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 py-2">
            <p className="text-xs text-text-muted">
                Sélectionnez les prestations à importer et saisissez votre tarif HT. Les cases sans prix seront importées à 0 €.
            </p>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {tasks.map(task => {
                    const isChecked = !!selected[task.id];
                    return (
                        <div
                            key={task.id}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                                isChecked
                                    ? 'border-brand bg-brand/5'
                                    : 'border-border bg-surface2 hover:bg-surface-hover'
                            }`}
                            onClick={() => toggleTask(task.id)}
                        >
                            {/* Checkbox indicator */}
                            <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                isChecked ? 'border-brand bg-brand' : 'border-border bg-white'
                            }`}>
                                {isChecked && (
                                    <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-white">
                                        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                    </svg>
                                )}
                            </div>

                            {/* Task info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text truncate">{task.nom}</p>
                                {task.description && (
                                    <p className="text-xs text-text-muted truncate">{task.description}</p>
                                )}
                                <p className="text-[10px] text-text-muted mt-0.5">
                                    {task.unite} · TVA {task.tva_taux}%
                                </p>
                            </div>

                            {/* Price input — only when checked */}
                            {isChecked && (
                                <div
                                    className="shrink-0"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            value={selected[task.id]?.price ?? ''}
                                            onChange={e => setPrice(task.id, e.target.value)}
                                            className="w-24 h-7 text-sm pr-6 bg-white border-border"
                                            autoFocus={false}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">€</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || createBatch.isPending}
                className="w-full bg-brand text-white hover:bg-brand-hover"
            >
                {createBatch.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {selectedCount === 0
                    ? 'Sélectionnez au moins une prestation'
                    : `Importer ${selectedCount} prestation${selectedCount > 1 ? 's' : ''}`}
            </Button>
        </div>
    );
}
