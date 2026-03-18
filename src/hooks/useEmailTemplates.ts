import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { EmailTemplate, EmailTemplateType } from '@/types/email';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useEmailTemplates() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetches both system templates and the user's overrides in a single query.
    // RLS policy: `is_system = TRUE OR auth.uid() = user_id`
    const { data: allTemplates = [], isLoading } = useQuery<EmailTemplate[]>({
        queryKey: ['email-templates', user?.id],
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .order('is_system', { ascending: true }); // user templates first
            if (error) throw error;
            return data as EmailTemplate[];
        },
    });

    /** Returns the user's override for `type` if it exists, else the system default. */
    const getTemplate = (type: EmailTemplateType): EmailTemplate | null => {
        const userTpl = allTemplates.find(t => t.type === type && !t.is_system);
        if (userTpl) return userTpl;
        return allTemplates.find(t => t.type === type && t.is_system) ?? null;
    };

    /** Returns true if the user has overridden the system template for `type`. */
    const isOverridden = (type: EmailTemplateType): boolean =>
        allTemplates.some(t => t.type === type && !t.is_system);

    /** Replaces `{{var_name}}` placeholders with values from the vars map. */
    const substituteVars = (text: string, vars: Record<string, string>): string =>
        Object.entries(vars).reduce(
            (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
            text
        );

    // ── Mutations ─────────────────────────────────────────────────────────────

    const upsertTemplate = useMutation({
        mutationFn: async ({ type, subject, body }: { type: EmailTemplateType; subject: string; body: string }) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { error } = await supabase
                .from('email_templates')
                .upsert(
                    { user_id: user.id, type, subject, body, is_system: false },
                    { onConflict: 'user_id,type' }
                );
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates', user?.id] });
        },
    });

    /** Deletes the user override, reverting to the system default. */
    const resetTemplate = useMutation({
        mutationFn: async (type: EmailTemplateType) => {
            if (!user?.id) throw new Error('Non authentifié');
            const { error } = await supabase
                .from('email_templates')
                .delete()
                .eq('user_id', user.id)
                .eq('type', type)
                .eq('is_system', false);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates', user?.id] });
        },
    });

    return {
        allTemplates,
        isLoading,
        getTemplate,
        isOverridden,
        substituteVars,
        upsertTemplate,
        resetTemplate,
    };
}
