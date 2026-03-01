import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Project, ProjectWithClient, ProjectFormData } from '@/types/project';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useProjects = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['projects', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('projects')
                .select(`
          *,
          clients (
            name
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erreur chargement projets:", error);
                throw error;
            }
            return data as ProjectWithClient[];
        },
        enabled: !!user?.id,
    });
};

export const useCreateProject = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newProject: ProjectFormData) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('projects')
                .insert([{ ...newProject, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data as Project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
            toast.success("Projet créé avec succès.");
        },
        onError: (error) => {
            console.error("Erreur création projet:", error);
            toast.error("Impossible de créer le projet.");
        }
    });
};

export const useUpdateProject = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<ProjectFormData> }) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data as Project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
            toast.success("Projet mis à jour.");
        },
        onError: (error) => {
            console.error("Erreur modification projet:", error);
            toast.error("Impossible de modifier le projet.");
        }
    });
};

export const useDeleteProject = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
            toast.success("Projet supprimé.");
        },
        onError: (error) => {
            console.error("Erreur suppression projet:", error);
            toast.error("Impossible de supprimer le projet.");
        }
    });
};
