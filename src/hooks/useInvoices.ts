import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceWithProject, InvoiceFormData } from '@/types/invoice';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
                    projects (
                        name
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
        onError: (error: any) => {
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
        onSuccess: () => {
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
