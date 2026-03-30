import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AchatStatut =
    | 'en_attente'
    | 'commande'
    | 'expedie'
    | 'recu'
    | 'en_retard'
    | 'annule';

export interface Fournisseur {
    id: string;
    user_id: string;
    nom: string;
    contact_nom: string | null;
    email: string | null;
    telephone: string | null;
    site_web: string | null;
    adresse: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export type FournisseurFormData = Omit<Fournisseur, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface FournisseurProduit {
    id: string;
    fournisseur_id: string;
    nom: string;
    description: string | null;
    prix_unitaire: number | null;
    unite: string;
    created_at: string;
}

export type ProduitFormData = Omit<FournisseurProduit, 'id' | 'created_at'>;

export interface AchatFournisseur {
    id: string;
    user_id: string;
    fournisseur_id: string;
    projet_id: string | null;
    description: string;
    montant: number;
    date_achat: string;
    date_livraison_prevue: string | null;
    date_livraison_reelle: string | null;
    statut: AchatStatut;
    rappel_envoye: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export type AchatFormData = Omit<AchatFournisseur, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ── Fournisseurs ──────────────────────────────────────────────────────────────

export const useFournisseurs = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['fournisseurs', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error('Non authentifié');
            const { data, error } = await supabase
                .from('fournisseurs')
                .select('*')
                .eq('user_id', user.id)
                .order('nom');
            if (error) throw error;
            return data as Fournisseur[];
        },
        enabled: !!user?.id,
    });
};

export const useCreateFournisseur = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: FournisseurFormData) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { data, error } = await supabase
                .from('fournisseurs')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return data as Fournisseur;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fournisseurs', user?.id] });
            toast.success('Fournisseur ajouté.');
        },
        onError: () => toast.error("Impossible d'ajouter le fournisseur."),
    });
};

export const useUpdateFournisseur = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: FournisseurFormData & { id: string }) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { data, error } = await supabase
                .from('fournisseurs')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();
            if (error) throw error;
            return data as Fournisseur;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fournisseurs', user?.id] });
            toast.success('Fournisseur mis à jour.');
        },
        onError: () => toast.error('Impossible de modifier le fournisseur.'),
    });
};

export const useDeleteFournisseur = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { error } = await supabase
                .from('fournisseurs')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fournisseurs', user?.id] });
            toast.success('Fournisseur supprimé.');
        },
        onError: () => toast.error('Impossible de supprimer le fournisseur.'),
    });
};

// ── Produits fournisseur ──────────────────────────────────────────────────────

export const useFournisseurProduits = (fournisseurId: string | null) => {
    return useQuery({
        queryKey: ['fournisseur-produits', fournisseurId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('fournisseur_produits')
                .select('*')
                .eq('fournisseur_id', fournisseurId!)
                .order('nom');
            if (error) throw error;
            return data as FournisseurProduit[];
        },
        enabled: !!fournisseurId,
    });
};

export const useCreateFournisseurProduit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: ProduitFormData) => {
            const { data, error } = await supabase
                .from('fournisseur_produits')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return data as FournisseurProduit;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['fournisseur-produits', data.fournisseur_id] });
            toast.success('Produit ajouté.');
        },
        onError: () => toast.error("Impossible d'ajouter le produit."),
    });
};

export const useDeleteFournisseurProduit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, fournisseurId }: { id: string; fournisseurId: string }) => {
            const { error } = await supabase
                .from('fournisseur_produits')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return fournisseurId;
        },
        onSuccess: (fournisseurId) => {
            queryClient.invalidateQueries({ queryKey: ['fournisseur-produits', fournisseurId] });
            toast.success('Produit supprimé.');
        },
        onError: () => toast.error('Impossible de supprimer le produit.'),
    });
};

// ── Achats fournisseur ────────────────────────────────────────────────────────

export const useAchatsFournisseur = (fournisseurId: string | null) => {
    return useQuery({
        queryKey: ['achats-fournisseur', fournisseurId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('achats_fournisseurs')
                .select('*')
                .eq('fournisseur_id', fournisseurId!)
                .order('date_achat', { ascending: false });
            if (error) throw error;
            return data as AchatFournisseur[];
        },
        enabled: !!fournisseurId,
    });
};

export const useCreateAchat = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: AchatFormData) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { data, error } = await supabase
                .from('achats_fournisseurs')
                .insert([{ ...payload, user_id: user.id }])
                .select()
                .single();
            if (error) throw error;
            return data as AchatFournisseur;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['achats-fournisseur', data.fournisseur_id] });
            toast.success('Achat enregistré.');
        },
        onError: () => toast.error("Impossible d'enregistrer l'achat."),
    });
};

export const useUpdateAchat = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            fournisseurId,
            ...updates
        }: Partial<AchatFournisseur> & { id: string; fournisseurId: string }) => {
            const { data, error } = await supabase
                .from('achats_fournisseurs')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { achat: data as AchatFournisseur, fournisseurId };
        },
        onSuccess: ({ fournisseurId }) => {
            queryClient.invalidateQueries({ queryKey: ['achats-fournisseur', fournisseurId] });
        },
        onError: () => toast.error("Impossible de mettre à jour l'achat."),
    });
};
