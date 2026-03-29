import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ProfessionTemplate {
    id: string;
    slug: string;
    nom: string;
    categorie: string;
    icon: string | null;
}

export interface ProfessionTask {
    id: string;
    profession_id: string;
    nom: string;
    description: string | null;
    unite: string;
    tva_taux: number;
    ordre: number;
}

/** All profession templates, grouped by category — static system data. */
export const useProfessionTemplates = () => {
    return useQuery({
        queryKey: ['profession-templates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profession_templates')
                .select('*')
                .order('categorie')
                .order('nom');
            if (error) throw error;
            return data as ProfessionTemplate[];
        },
        staleTime: 30 * 60 * 1000, // 30 min — static data
    });
};

/** Tasks for a specific profession slug. */
export const useProfessionTasks = (professionSlug: string | null | undefined) => {
    return useQuery({
        queryKey: ['profession-tasks', professionSlug],
        queryFn: async () => {
            const { data: prof, error: profErr } = await supabase
                .from('profession_templates')
                .select('id')
                .eq('slug', professionSlug!)
                .single();
            if (profErr || !prof) throw profErr ?? new Error('Profession introuvable');

            const { data, error } = await supabase
                .from('profession_tasks')
                .select('*')
                .eq('profession_id', prof.id)
                .order('ordre');
            if (error) throw error;
            return data as ProfessionTask[];
        },
        enabled: !!professionSlug && professionSlug !== 'autre',
        staleTime: 30 * 60 * 1000,
    });
};

/** Group a flat profession list by category. */
export function groupProfessionsByCategory(
    professions: ProfessionTemplate[],
): Map<string, ProfessionTemplate[]> {
    const map = new Map<string, ProfessionTemplate[]>();
    for (const p of professions) {
        const list = map.get(p.categorie) ?? [];
        list.push(p);
        map.set(p.categorie, list);
    }
    return map;
}
