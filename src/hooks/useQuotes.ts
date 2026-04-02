import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { QuoteData, QuoteStatus } from '@/types/quote';

/** Typed DB row for a quote. */
export interface Quote {
    id: string;
    user_id: string;
    project_id: string;
    title: string;
    reference: string | null;
    lines: unknown;
    notes: string | null;
    status: QuoteStatus | null;
    sent_at: string | null;
    status_history: unknown;
    version: number | null;
    version_of: string | null;
    signature_id: string | null;
    viewed_at: string | null;
    created_at: string;
    updated_at: string;
}

// ── Read hooks ────────────────────────────────────────────────────────────────

/** Latest quote for a project (highest version). Returns null when none. */
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
                .order('version', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error("Erreur chargement devis:", error);
                throw error;
            }

            return data as Quote | null;
        },
        enabled: !!user?.id && !!projectId,
    });
};

/** All quote versions for a project, ordered newest version first. */
export const useQuotesByProject = (projectId: string | undefined) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['quotes', projectId, user?.id],
        queryFn: async () => {
            if (!user?.id || !projectId) throw new Error("Paramètres manquants");

            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .order('version', { ascending: false });

            if (error) {
                console.error("Erreur chargement devis:", error);
                throw error;
            }

            return (data ?? []) as Quote[];
        },
        enabled: !!user?.id && !!projectId,
    });
};

/** Fetch a single quote by its ID. */
export const useQuoteById = (quoteId: string | undefined) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['quote-by-id', quoteId, user?.id],
        queryFn: async () => {
            if (!user?.id || !quoteId) throw new Error("Paramètres manquants");

            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', quoteId)
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error("Erreur chargement devis:", error);
                throw error;
            }

            return data as Quote;
        },
        enabled: !!user?.id && !!quoteId,
    });
};

// ── Write hooks ───────────────────────────────────────────────────────────────

/** Insert or Update a quote.
 *  - If payload.id is set → UPDATE that row.
 *  - Otherwise            → INSERT a new quote.
 */
export const useSaveQuote = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, payload }: { projectId: string; payload: QuoteData }) => {
            if (!user?.id) throw new Error("Non authentifié");

            if (payload.id) {
                // UPDATE existing quote by ID
                const { data, error } = await supabase
                    .from('quotes')
                    .update({
                        title: payload.title,
                        lines: payload.lines as unknown[],
                        notes: payload.notes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', payload.id)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (error) throw error;
                return data as Quote;
            } else {
                // INSERT new quote
                const { data, error } = await supabase
                    .from('quotes')
                    .insert([{
                        user_id: user.id,
                        project_id: projectId,
                        title: payload.title,
                        lines: payload.lines as unknown[],
                        notes: payload.notes,
                        version: payload.version ?? 1,
                        version_of: payload.version_of ?? null,
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return data as Quote;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quote', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['quotes', variables.projectId] });
            toast.success("Devis enregistré avec succès.");
        },
        onError: (error) => {
            console.error("Erreur sauvegarde devis:", error);
            toast.error("Impossible d'enregistrer le devis.");
        }
    });
};

/** Duplicate an existing quote as a new version (version+1, status=draft). */
export const useDuplicateQuote = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ quoteId }: { quoteId: string }) => {
            if (!user?.id) throw new Error("Non authentifié");

            const { data: original, error: fetchError } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', quoteId)
                .eq('user_id', user.id)
                .single();

            if (fetchError) throw fetchError;

            const newVersion = (original.version ?? 1) + 1;
            const rootId = original.version_of ?? original.id;

            const { data, error } = await supabase
                .from('quotes')
                .insert([{
                    user_id: user.id,
                    project_id: original.project_id,
                    title: original.title,
                    lines: original.lines,
                    notes: original.notes,
                    version: newVersion,
                    version_of: rootId,
                    status: 'draft',
                }])
                .select()
                .single();

            if (error) throw error;
            return data as Quote;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['quotes', data.project_id] });
            queryClient.invalidateQueries({ queryKey: ['quote', data.project_id] });
        },
        onError: (error) => {
            console.error("Erreur duplication devis:", error);
            toast.error("Impossible de créer une nouvelle version.");
        }
    });
};

export const useUpdateQuoteStatus = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            status,
            signatureId,
        }: {
            id: string;
            status: QuoteStatus;
            signatureId?: string;
        }) => {
            if (!user?.id) throw new Error("Non authentifié");

            const updates: Record<string, unknown> = {
                status,
                ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
                ...(signatureId !== undefined ? { signature_id: signatureId } : {}),
            };

            const { data, error } = await supabase
                .from('quotes')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data as Quote;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quote'] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
        onError: (error) => {
            console.error("Erreur mise à jour statut devis:", error);
            toast.error("Impossible de mettre à jour le statut du devis.");
        },
    });
};
