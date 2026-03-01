import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useProfile = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Erreur chargement profil:", error);
                throw error;
            }
            return data as Profile;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};

export const useUpdateProfile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: Partial<Profile>) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data as Profile;
        },
        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(['profile', user?.id], updatedProfile);
            toast.success("Profil mis à jour avec succès.");
        },
        onError: (error) => {
            console.error("Erreur sauvegarde profil:", error);
            toast.error("Impossible de sauvegarder le profil.");
        }
    });
};

export const useUploadLogo = () => {
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (file: File) => {
            if (!user?.id) throw new Error("Non authentifié");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public') // Assuming a public bucket named 'public' with logos folder, or just 'logos'
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            return publicUrl;
        },
        onError: (error) => {
            console.error("Erreur upload logo:", error);
            toast.error("Erreur lors de l'envoi de l'image.");
        }
    });
};
