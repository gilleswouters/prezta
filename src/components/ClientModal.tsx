import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema } from '@/lib/validations/client';
import type { ClientFormValues } from '@/lib/validations/client';
import type { Client } from '@/types/client';
import { useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface ClientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client?: Client | null; // null means create mode
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const isEditing = !!client;

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            vat_number: '',
            notes: ''
        }
    });

    useEffect(() => {
        if (client && open) {
            form.reset({
                name: client.name,
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                vat_number: client.vat_number || '',
                notes: client.notes || ''
            });
        } else if (!open) {
            form.reset();
        }
    }, [client, open, form]);

    const onSubmit = async (data: ClientFormValues) => {
        try {
            const payload = {
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                vat_number: data.vat_number || null,
                notes: data.notes || null,
            };

            if (isEditing && client) {
                await updateClient.mutateAsync({ id: client.id, updates: payload });
            } else {
                await createClient.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    const isPending = createClient.isPending || updateClient.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-surface text-text border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">{isEditing ? 'Modifier Client' : 'Nouveau Client'}</DialogTitle>
                    <DialogDescription className="text-muted">
                        Remplissez les informations du client ci-dessous.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <FormField control={form.control} name="name" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Nom / Entreprise *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Corp" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="contact@acme.com" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />

                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel>Téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+32 400 000 000" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            )} />
                        </div>

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Adresse complète</FormLabel>
                                <FormControl>
                                    <Input placeholder="Avenue de la Toison d'Or 10, 1000 Bruxelles" className="bg-surface2 border-border" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="vat_number" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Numéro TVA</FormLabel>
                                <FormControl>
                                    <Input placeholder="BE0123456789" className="bg-surface2 border-border uppercase" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <div className="space-y-2">
                                <FormLabel>Notes internes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Informations additionnelles..." className="bg-surface2 border-border resize-none" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </div>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-text hover:bg-surface2">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-p3 text-bg hover:opacity-90">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Mettre à jour' : 'Créer le client'}
                            </Button>
                        </DialogFooter>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
