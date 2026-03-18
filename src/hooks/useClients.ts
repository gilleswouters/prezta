import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Client, ClientFormData, ClientEvent, ClientEventFormData } from '@/types/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useClients = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['clients', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (error) {
                console.error("Erreur chargement clients:", error);
                throw error;
            }
            return data as Client[];
        },
        enabled: !!user?.id,
    });
};

export const useCreateClient = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newClient: ClientFormData) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('clients')
                .insert([{ ...newClient, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data as Client;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
            toast.success("Client ajouté avec succès.");
        },
        onError: (error) => {
            console.error("Erreur création client:", error);
            toast.error("Impossible d'ajouter le client.");
        }
    });
};

export const useUpdateClient = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<ClientFormData> }) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data as Client;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
            toast.success("Client mis à jour.");
        },
        onError: (error) => {
            console.error("Erreur modification client:", error);
            toast.error("Impossible de modifier le client.");
        }
    });
};

export const useDeleteClient = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
            toast.success("Client supprimé.");
        },
        onError: (error) => {
            console.error("Erreur suppression client:", error);
            toast.error("Impossible de supprimer le client.");
        }
    });
};

// ==========================================
// CLIENT EVENTS (Timeline)
// ==========================================

export const useClientEvents = (clientId: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['client_events', clientId],
        queryFn: async () => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('client_events')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erreur chargement événements client:", error);
                throw error;
            }
            return data as ClientEvent[];
        },
        enabled: !!user?.id && !!clientId,
    });
};

export const useCreateClientEvent = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newEvent: ClientEventFormData) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('client_events')
                .insert([{ ...newEvent, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data as ClientEvent;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['client_events', data.client_id] });
            toast.success("Note ajoutée à l'historique.");
        },
        onError: (error) => {
            console.error("Erreur création événement:", error);
            toast.error("Impossible d'ajouter la note.");
        }
    });
};
