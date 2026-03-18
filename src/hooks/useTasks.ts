import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Task, TaskFormData } from '@/types/task';
import { useAuth } from './useAuth';

export function useTasks(projectId?: string) {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const fetchTasks = async () => {
        if (!user) throw new Error('User not authenticated');
        let query = supabase
            .from('tasks')
            .select(`
                *,
                projects (
                    name,
                    clients (name, address)
                )
            `)
            .eq('user_id', user.id)
            .order('due_date', { ascending: true, nullsFirst: false });

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Task[];
    };

    const queryInfo = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: fetchTasks,
        enabled: !!user,
    });

    const createTaskMutation = useMutation({
        mutationFn: async (newTask: TaskFormData) => {
            if (!user) throw new Error('User not authenticated');
            const { data, error } = await supabase
                .from('tasks')
                .insert([{ ...newTask, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskFormData> }) => {
            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    return {
        ...queryInfo,
        createTask: createTaskMutation.mutateAsync,
        updateTask: updateTaskMutation.mutateAsync,
        deleteTask: deleteTaskMutation.mutateAsync,
        isCreating: createTaskMutation.isPending,
        isUpdating: updateTaskMutation.isPending,
        isDeleting: deleteTaskMutation.isPending,
    };
}
