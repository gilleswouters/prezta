import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product, ProductFormData } from '@/types/product';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useProducts = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['products', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', user.id)
                .order('is_favorite', { ascending: false })
                .order('name', { ascending: true });

            if (error) {
                console.error("Erreur chargement prestations:", error);
                throw error;
            }
            return data as Product[];
        },
        enabled: !!user?.id,
    });
};

export const useCreateProduct = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newProduct: ProductFormData) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('products')
                .insert([{ ...newProduct, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data as Product;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
            toast.success("Prestation ajoutée au catalogue.");
        },
        onError: (error) => {
            console.error("Erreur création prestation:", error);
            toast.error("Impossible d'ajouter la prestation.");
        }
    });
};

export const useCreateProductBatch = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newProducts: ProductFormData[]) => {
            if (!user?.id) throw new Error("Non authentifié");
            const productsWithUserId = newProducts.map(p => ({ ...p, user_id: user.id }));

            const { data, error } = await supabase
                .from('products')
                .insert(productsWithUserId)
                .select();

            if (error) throw error;
            return data as Product[];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
            toast.success("Catalogue généré avec succès.");
        },
        onError: (error) => {
            console.error("Erreur génération catalogue:", error);
            toast.error("Impossible d'importer le catalogue.");
        }
    });
};

export const useUpdateProduct = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<ProductFormData> }) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data as Product;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
            toast.success("Prestation mise à jour.");
        },
        onError: (error) => {
            console.error("Erreur modification prestation:", error);
            toast.error("Impossible de modifier la prestation.");
        }
    });
};

export const useDeleteProduct = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
            toast.success("Prestation supprimée.");
        },
        onError: (error) => {
            console.error("Erreur suppression prestation:", error);
            toast.error("Impossible de supprimer la prestation.");
        }
    });
};

export const useToggleFavorite = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, is_favorite }: { id: string, is_favorite: boolean }) => {
            if (!user?.id) throw new Error("Non authentifié");
            const { error } = await supabase
                .from('products')
                .update({ is_favorite: !is_favorite })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onMutate: async ({ id, is_favorite }) => {
            if (!user?.id) return;

            // Mettre en pause toutes les requêtes en cours
            await queryClient.cancelQueries({ queryKey: ['products', user.id] });

            // Check data existing
            const previousProducts = queryClient.getQueryData<Product[]>(['products', user.id]);

            // Optimistic update
            if (previousProducts) {
                queryClient.setQueryData<Product[]>(['products', user.id], old => {
                    if (!old) return old;
                    return old.map(p => p.id === id ? { ...p, is_favorite: !is_favorite } : p)
                        // Re-sort to show favorite instantly on top if favored, optional but cool UI wise
                        .sort((a, b) => {
                            // sort by favorite
                            if (b.is_favorite !== a.is_favorite) {
                                return b.is_favorite ? 1 : -1;
                            }
                            // sort by name
                            return a.name.localeCompare(b.name);
                        });
                });
            }

            return { previousProducts };
        },
        onError: (_err, _newTodo, context) => {
            toast.error("Échec de l'action.");
            if (context?.previousProducts && user?.id) {
                queryClient.setQueryData(['products', user.id], context.previousProducts);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
        },
    });
};
