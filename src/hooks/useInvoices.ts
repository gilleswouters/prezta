import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceWithProject, InvoiceFormData } from '@/types/invoice';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/plausible';

export const useInvoices = (projectId?: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['invoices', user?.id, projectId],
        queryFn: async () => {
            if (!user?.id) throw new Error("Non authentifié");
            let query = supabase
                .from('invoices')
                .select(`
                    id,
                    reference,
                    user_id,
                    project_id,
                    amount,
                    status,
                    due_date,
                    paid_date,
                    notes,
                    created_at,
                    last_reminder_sent_at,
                    reminder_count,
                    projects (
                        name,
                        clients (
                            name,
                            email,
                            contact_name
                        )
                    )
                `)
                .eq('user_id', user.id);

            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error("Erreur chargement factures:", error);
                throw error;
            }
            return data as unknown as InvoiceWithProject[];
        },
        enabled: !!user?.id,
    });
};

export const useCreateInvoice = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newInvoice: InvoiceFormData) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('invoices')
                .insert([{ ...newInvoice, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data as Invoice;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
            toast.success("Facture enregistrée.");
        },
        onError: (error: Error) => {
            console.error("Erreur création facture:", error);
            toast.error(`Impossible d'enregistrer la facture: ${error.message || 'Erreur inconnue'}`);
        }
    });
};

export const useUpdateInvoice = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<InvoiceFormData> }) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('invoices')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data as Invoice;
        },
        onSuccess: (_data, { updates }) => {
            if (updates.status === 'payé') trackEvent('invoice_paid');
            queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
            toast.success("Facture mise à jour.");
        },
        onError: (error) => {
            console.error("Erreur modification facture:", error);
            toast.error("Impossible de modifier la facture.");
        }
    });
};

export const useDeleteInvoice = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
            toast.info("Facture supprimée du registre.");
        },
        onError: (error) => {
            console.error("Erreur suppression facture:", error);
            toast.error("Impossible de supprimer la facture.");
        }
    });
};

export const useArchiveInvoice = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('invoices')
                .update({ status: 'archivé' })
                .eq('id', id)
                .eq('user_id', user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['activeDocCount', user?.id] });
            toast.info("Facture archivée.");
        },
        onError: () => toast.error("Impossible d'archiver la facture."),
    });
};

export const useUnarchiveInvoice = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('invoices')
                .update({ status: 'en_attente' })
                .eq('id', id)
                .eq('user_id', user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['activeDocCount', user?.id] });
            toast.success("Facture désarchivée.");
        },
        onError: () => toast.error("Impossible de désarchiver la facture."),
    });
};

/** Increments reminder_count and updates last_reminder_sent_at after a reminder is sent. */
export const useUpdateInvoiceReminder = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, currentCount }: { id: string; currentCount: number }) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { error } = await supabase
                .from('invoices')
                .update({
                    last_reminder_sent_at: new Date().toISOString(),
                    reminder_count: currentCount + 1,
                })
                .eq('id', id)
                .eq('user_id', user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] });
        },
    });
};
