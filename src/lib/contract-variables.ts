import type { Profile } from '@/types/profile';
import type { Client } from '@/types/client';

interface ProjectVariables {
    name?: string | null;
    start_date?: string | null;
    total_price?: number | string | null;
}

interface ContractVariables {
    profile?: Profile | null;
    client?: Client | null;
    project?: ProjectVariables | null;
}

/**
 * Replaces all {{placeholder}} tokens in a contract template content string
 * with values from profile, client and project data.
 * Unreplaced placeholders are left as-is (double braces preserved).
 */
export function applyVariables(content: string, vars: ContractVariables): string {
    const { profile, client, project } = vars;

    // ── Prestataire (my_*) ──────────────────────────────────────────────────
    const myName = profile?.company_name || profile?.full_name || '{{my_name}}';

    const addressParts = [
        profile?.address_street,
        profile?.address_zip && profile?.address_city
            ? `${profile.address_zip} ${profile.address_city}`
            : profile?.address_city || null,
    ].filter(Boolean);
    const myAddress = addressParts.length > 0 ? addressParts.join(', ') : '{{my_address}}';

    const myCity = profile?.address_city || '{{my_city}}';
    const myBce = profile?.bce_number || profile?.siret_number || '{{my_bce}}';
    const myVat = profile?.vat_number || '{{my_vat}}';

    // ── Client (client_*) ───────────────────────────────────────────────────
    const clientName = client?.name || '{{client_name}}';
    const clientAddress = client?.address || '{{client_address}}';

    // ── Projet (project_*) ──────────────────────────────────────────────────
    const projectName = project?.name || '{{project_name}}';
    const startDate = project?.start_date
        ? new Date(project.start_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '{{start_date}}';
    const totalPrice =
        project?.total_price != null ? String(project.total_price) : '{{total_price}}';

    return content
        .replace(/\{\{my_name\}\}/g, myName)
        .replace(/\{\{my_address\}\}/g, myAddress)
        .replace(/\{\{my_city\}\}/g, myCity)
        .replace(/\{\{my_bce\}\}/g, myBce)
        .replace(/\{\{my_vat\}\}/g, myVat)
        .replace(/\{\{client_name\}\}/g, clientName)
        .replace(/\{\{client_address\}\}/g, clientAddress)
        .replace(/\{\{project_name\}\}/g, projectName)
        .replace(/\{\{start_date\}\}/g, startDate)
        .replace(/\{\{total_price\}\}/g, totalPrice);
}
