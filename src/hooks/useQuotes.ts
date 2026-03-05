import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { QuoteData } from '@/types/quote';

// Fetch quote for a specific project
export const useQuoteByProject = (projectId: string | undefined) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['quote', projectId, user?.id],
        queryFn: async () => {
            if (!user?.id || !projectId) throw new Error("Paramètres manquants");

            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error("Erreur chargement devis:", error);
                throw error;
            }

            return data; // Returns the quote row or null if it doesn't exist yet
        },
        enabled: !!user?.id && !!projectId,
    });
};

// Insert or Update the Quote
export const useSaveQuote = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, payload }: { projectId: string, payload: QuoteData }) => {
            if (!user?.id) throw new Error("Non authentifié");

            // Check if quote exists to decide insert vs update uniquely handling project_id uniqueness
            const { data: existing } = await supabase
                .from('quotes')
                .select('id')
                .eq('project_id', projectId)
                .maybeSingle();

            if (existing) {
                // UPDATE
                const { data, error } = await supabase
                    .from('quotes')
                    .update({
                        title: payload.title,
                        lines: payload.lines as any,
                        notes: payload.notes,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('quotes')
                    .insert([{
                        user_id: user.id,
                        project_id: projectId,
                        title: payload.title,
                        lines: payload.lines as any,
                        notes: payload.notes
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quote', variables.projectId, user?.id] });
            toast.success("Devis enregistré avec succès.");
        },
        onError: (error) => {
            console.error("Erreur sauvegarde devis:", error);
            toast.error("Impossible d'enregistrer le devis.");
        }
    });
};
