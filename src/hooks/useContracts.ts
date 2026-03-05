import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { ContractTemplate, ProjectContract, ProjectContractFormData } from '@/types/contract';

// --- CONTRACT TEMPLATES ---

export const useContractTemplates = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['contract-templates', user?.id],
        queryFn: async () => {
            let query = supabase
                .from('contract_templates')
                .select('*');

            if (user?.id) {
                query = query.or(`is_system.eq.true,user_id.eq.${user.id}`);
            } else {
                query = query.eq('is_system', true);
            }

            const { data, error } = await query.order('is_system', { ascending: false });

            if (error) throw error;
            return data as ContractTemplate[];
        },
        enabled: true, // System templates are visible even without auth
    });
};

// --- PROJECT CONTRACTS ---

export const useProjectContracts = (projectId?: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['project-contracts', projectId, user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error("Non authentifié");
            let query = supabase
                .from('project_contracts')
                .select('*')
                .eq('user_id', user.id);

            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data as ProjectContract[];
        },
        enabled: !!user?.id,
    });
};

export const useCreateProjectContract = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (newContract: ProjectContractFormData) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('project_contracts')
                .insert([{ ...newContract, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data as ProjectContract;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project-contracts', variables.project_id, user?.id] });
            toast.success("Contrat généré avec succès.");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Impossible de générer le contrat.");
        }
    });
};

export const useUpdateProjectContract = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<ProjectContract> }) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('project_contracts')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data as ProjectContract;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project-contracts', data.project_id, user?.id] });
            toast.success("Contrat mis à jour.");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Échec de la mise à jour.");
        }
    });
};

export const useDeleteProjectContract = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('project_contracts')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            // Need to invalidate project-contracts cache, but we might not have project_id here.
            // We can just invalidate all project contracts or rely on the caller resolving it
            queryClient.invalidateQueries({ queryKey: ['project-contracts'] });
            toast.success("Contrat supprimé.");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Impossible de supprimer ce contrat.");
        }
    });
};
