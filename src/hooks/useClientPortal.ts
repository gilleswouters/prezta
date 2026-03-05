import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProjectWithClient } from '@/types/project';

// We fetch everything based on portalLink publicly
export const useClientPortal = (portalLink: string | undefined) => {
    return useQuery({
        queryKey: ['client-portal', portalLink],
        queryFn: async () => {
            if (!portalLink) throw new Error("Lien invalide");

            // 1. Fetch Project & Client
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select(`
                    *,
                    clients (
                        name,
                        email,
                        address,
                        vat_number,
                        phone
                    )
                `)
                .eq('portal_link', portalLink)
                .single();

            if (projectError || !projectData) {
                console.error("Project fetch error:", projectError);
                throw new Error("Projet introuvable ou lien expiré.");
            }

            const projectId = projectData.id;

            // 2. Fetch Quotes
            const { data: quotesData } = await supabase
                .from('quotes')
                .select('*')
                .eq('project_id', projectId);

            // 3. Fetch Invoices
            const { data: invoicesData } = await supabase
                .from('invoices')
                .select('*')
                .eq('project_id', projectId);

            // 4. Fetch Contracts
            const { data: contractsData } = await supabase
                .from('project_contracts')
                .select('*')
                .eq('project_id', projectId);

            // 5. Fetch Freelancer Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', projectData.user_id)
                .single();

            return {
                project: projectData as unknown as ProjectWithClient,
                quotes: quotesData || [],
                invoices: invoicesData || [],
                contracts: contractsData || [],
                profile: profileData || null
            };
        },
        enabled: !!portalLink,
        retry: false, // Don't retry if 404
    });
};
