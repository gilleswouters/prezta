import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { InvoiceStatus, type Invoice, type InvoiceFormData } from '@/types/invoice';

const invoiceSchema = z.object({
    project_id: z.string().optional().nullable(),
    amount: z.coerce.number().min(0, "Le montant doit être positif"),
    status: z.enum([InvoiceStatus.PAID, InvoiceStatus.PENDING, InvoiceStatus.LATE, InvoiceStatus.ARCHIVED]),
    due_date: z.string().optional().nullable(),
    paid_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice?: Invoice;
    defaultValues?: {
        project_id?: string | null;
        amount?: number;
        notes?: string;
    };
    onCreated?: () => void;
}

export function InvoiceModal({ open, onOpenChange, invoice, defaultValues, onCreated }: InvoiceModalProps) {
    const createInvoice = useCreateInvoice();
    const updateInvoice = useUpdateInvoice();
    const { data: projects } = useProjects();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!invoice;

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            project_id: '',
            amount: 0,
            status: InvoiceStatus.PENDING,
            due_date: '',
            paid_date: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (invoice) {
                form.reset({
                    project_id: invoice.project_id || '',
                    amount: invoice.amount,
                    status: invoice.status,
                    due_date: invoice.due_date || '',
                    paid_date: invoice.paid_date || '',
                    notes: invoice.notes || '',
                });
            } else {
                form.reset({
                    project_id: defaultValues?.project_id ?? 'none',
                    amount: defaultValues?.amount ?? 0,
                    status: InvoiceStatus.PENDING,
                    due_date: '',
                    paid_date: '',
                    notes: defaultValues?.notes ?? '',
                });
            }
        }
    }, [open, invoice, form]);

    const onSubmit = async (values: InvoiceFormValues) => {
        setIsSubmitting(true);
        try {
            const payload: InvoiceFormData = {
                project_id: values.project_id === 'none' ? null : values.project_id || null,
                amount: values.amount,
                status: values.status,
                due_date: values.due_date || null,
                paid_date: values.status === InvoiceStatus.PAID ? (values.paid_date || new Date().toISOString().split('T')[0]) : null,
                notes: values.notes || null,
            };

            if (isEdit && invoice) {
                await updateInvoice.mutateAsync({ id: invoice.id, updates: payload });
            } else {
                await createInvoice.mutateAsync(payload);
                onCreated?.();
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Erreur save facture:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-text-primary">
                        {isEdit ? 'Modifier la facture' : 'Nouvelle entrée au registre'}
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        {isEdit ? 'Mettez à jour le statut du paiement ou le montant.' : 'Enregistrez manuellement un paiement ou une facture en attente.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-text-primary">Montant TTC (€)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} className="border-border focus-visible:ring-brand" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-text-primary">Statut</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-border focus:ring-brand">
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-border">
                                                <SelectItem value={InvoiceStatus.PENDING}>⏳ En attente</SelectItem>
                                                <SelectItem value={InvoiceStatus.LATE}>⚠️ En retard</SelectItem>
                                                <SelectItem value={InvoiceStatus.PAID}>✅ Payé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="project_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-text-primary">Projet rattaché (Optionnel)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                                        <FormControl>
                                            <SelectTrigger className="border-border focus:ring-brand">
                                                <SelectValue placeholder="Sélectionner un projet" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-border">
                                            <SelectItem value="none">Aucun projet (Facture libre)</SelectItem>
                                            {projects?.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="due_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-text-primary">Date d'échéance</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value || ''} className="border-border focus-visible:ring-brand" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch('status') === InvoiceStatus.PAID && (
                                <FormField
                                    control={form.control}
                                    name="paid_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-text-primary">Date de paiement</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ''} className="border-border focus-visible:ring-brand" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-text-primary">Notes internes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ex: Facture d'acompte..."
                                            className="resize-none border-border focus-visible:ring-brand"
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 border-t border-border mt-6">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border hover:bg-surface-hover text-text-primary">
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-brand text-white hover:bg-brand-hover">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Mettre à jour' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
