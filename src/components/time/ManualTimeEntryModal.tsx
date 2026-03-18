import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useCreateTimeEntry, useUpdateTimeEntry } from '@/hooks/useTimeEntries';
import type { TimeEntry } from '@/types/time';
import { format, parseISO } from 'date-fns';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
    .object({
        date: z.string().min(1, 'La date est requise'),
        started_time: z.string().min(1, "L'heure de début est requise"),
        ended_time: z.string().min(1, "L'heure de fin est requise"),
        project_id: z.string().optional().nullable(),
        task_id: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
    })
    .superRefine((val, ctx) => {
        const start = new Date(`${val.date}T${val.started_time}`);
        const end = new Date(`${val.date}T${val.ended_time}`);
        const now = new Date();

        if (new Date(val.date) > now) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La date ne peut pas être dans le futur', path: ['date'] });
        }
        if (end <= start) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "L'heure de fin doit être après l'heure de début", path: ['ended_time'] });
        }
        const durationSec = (end.getTime() - start.getTime()) / 1000;
        if (durationSec >= 86400) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La durée ne peut pas dépasser 24h', path: ['ended_time'] });
        }
    });

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    open: boolean;
    onClose: () => void;
    /** Pre-fill with a date (ISO date string YYYY-MM-DD) */
    defaultDate?: string;
    /** Pre-fill with a project */
    defaultProjectId?: string | null;
    /** Editing an existing entry */
    entry?: TimeEntry | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ManualTimeEntryModal({ open, onClose, defaultDate, defaultProjectId, entry }: Props) {
    const { data: projects } = useProjects();
    const { data: tasks } = useTasks();
    const create = useCreateTimeEntry();
    const update = useUpdateTimeEntry();

    const isEditing = !!entry;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            date: defaultDate ?? format(new Date(), 'yyyy-MM-dd'),
            started_time: '09:00',
            ended_time: '10:00',
            project_id: defaultProjectId ?? null,
            task_id: null,
            description: '',
        },
    });

    // Populate form when editing
    useEffect(() => {
        if (entry) {
            const startedAt = parseISO(entry.started_at);
            const endedAt = entry.ended_at ? parseISO(entry.ended_at) : null;
            form.reset({
                date: format(startedAt, 'yyyy-MM-dd'),
                started_time: format(startedAt, 'HH:mm'),
                ended_time: endedAt ? format(endedAt, 'HH:mm') : format(startedAt, 'HH:mm'),
                project_id: entry.project_id,
                task_id: entry.task_id,
                description: entry.description ?? '',
            });
        } else {
            form.reset({
                date: defaultDate ?? format(new Date(), 'yyyy-MM-dd'),
                started_time: '09:00',
                ended_time: '10:00',
                project_id: defaultProjectId ?? null,
                task_id: null,
                description: '',
            });
        }
    }, [entry, defaultDate, defaultProjectId, open]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedProjectId = form.watch('project_id');
    const filteredTasks = (tasks ?? []).filter(
        (t) => !selectedProjectId || t.project_id === selectedProjectId,
    );

    async function onSubmit(values: FormValues) {
        const startedAt = new Date(`${values.date}T${values.started_time}`).toISOString();
        const endedAt = new Date(`${values.date}T${values.ended_time}`).toISOString();
        const durationSeconds = Math.round(
            (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
        );

        if (isEditing && entry) {
            await update.mutateAsync({
                id: entry.id,
                data: {
                    project_id: values.project_id || null,
                    task_id: values.task_id || null,
                    description: values.description || null,
                    ended_at: endedAt,
                    duration_seconds: durationSeconds,
                },
            });
        } else {
            await create.mutateAsync({
                project_id: values.project_id || null,
                task_id: values.task_id || null,
                description: values.description || null,
                started_at: startedAt,
                ended_at: endedAt,
                duration_seconds: durationSeconds,
                is_running: false,
            });
        }

        onClose();
    }

    const isPending = create.isPending || update.isPending;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Modifier une entrée' : 'Ajouter une entrée manuelle'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Start / end times */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="started_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Heure de début</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ended_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Heure de fin</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Project */}
                        <FormField
                            control={form.control}
                            name="project_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Projet</FormLabel>
                                    <Select
                                        value={field.value ?? '__none__'}
                                        onValueChange={(v) => {
                                            field.onChange(v === '__none__' ? null : v);
                                            form.setValue('task_id', null);
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un projet" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="__none__">Sans projet</SelectItem>
                                            {(projects ?? []).map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Task */}
                        {filteredTasks.length > 0 && (
                            <FormField
                                control={form.control}
                                name="task_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tâche (optionnel)</FormLabel>
                                        <Select
                                            value={field.value ?? '__none__'}
                                            onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une tâche" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="__none__">Aucune tâche</SelectItem>
                                                {filteredTasks.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (optionnel)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ce sur quoi vous avez travaillé…"
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                                {isEditing ? 'Enregistrer' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
