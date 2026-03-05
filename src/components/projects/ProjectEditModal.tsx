import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ProjectWithClient } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { useUpdateProject } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const editProjectSchema = z.object({
    name: z.string().min(3, "Obligatoire (3 min)."),
    client_id: z.string().optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    status: z.string().refine((val) => Object.values(ProjectStatus).includes(val as ProjectStatus), { message: "Statut invalide" })
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface ProjectEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectWithClient | null;
}

export function ProjectEditModal({ open, onOpenChange, project }: ProjectEditModalProps) {
    const updateProject = useUpdateProject();
    const { data: clients, isLoading: clientsLoading } = useClients();

    const form = useForm<EditProjectFormValues>({
        resolver: zodResolver(editProjectSchema),
        defaultValues: {
            name: '',
            client_id: '',
            description: '',
            status: ProjectStatus.DRAFT
        }
    });

    useEffect(() => {
        if (project && open) {
            form.reset({
                name: project.name,
                client_id: project.client_id || '',
                description: project.description || '',
                status: project.status
            });
        } else if (!open) {
            form.reset();
        }
    }, [project, open, form]);

    const onSubmit = async (data: EditProjectFormValues) => {
        if (!project) return;
        try {
            const finalClientId = data.client_id && data.client_id !== "empty" ? data.client_id : null;

            const payload = {
                name: data.name,
                client_id: finalClientId,
                description: data.description || null,
                status: data.status as ProjectStatus
            };

            await updateProject.mutateAsync({ id: project.id, updates: payload });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white text-text border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Modifier le Projet</DialogTitle>
                    <DialogDescription className="text-text-muted">
                        Mettez à jour les informations du projet.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <FormField control={form.control} name="name" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Nom du projet *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nom du projet" className="bg-surface border-border" {...field} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="client_id" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Client</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={clientsLoading}>
                                        <FormControl>
                                            <SelectTrigger className="bg-surface border-border">
                                                <SelectValue placeholder={clientsLoading ? "Chargement..." : "Aucun client"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="empty">Aucun client</SelectItem>
                                            {!clientsLoading && clients?.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            )} />

                            <FormField control={form.control} name="status" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Statut</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-surface border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={ProjectStatus.DRAFT}>Brouillon</SelectItem>
                                            <SelectItem value={ProjectStatus.IN_PROGRESS}>En cours</SelectItem>
                                            <SelectItem value={ProjectStatus.COMPLETED}>Terminé</SelectItem>
                                            <SelectItem value={ProjectStatus.CANCELLED}>Annulé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Description / Brief</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Brief du projet..." className="bg-surface border-border resize-none h-24" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border hover:bg-surface-hover">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={updateProject.isPending} className="bg-brand text-white hover:bg-brand-hover">
                                {updateProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Mettre à jour
                            </Button>
                        </DialogFooter>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
