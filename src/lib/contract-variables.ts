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

    // ── Prestataire (nom_prestataire, adresse_prestataire, …) ───────────────
    const nomPrestataire = profile?.company_name || profile?.full_name || '{{nom_prestataire}}';

    const addressParts = [
        profile?.address_street,
        profile?.address_zip && profile?.address_city
            ? `${profile.address_zip} ${profile.address_city}`
            : profile?.address_city || null,
    ].filter(Boolean);
    const adressePrestataire = addressParts.length > 0 ? addressParts.join(', ') : '{{adresse_prestataire}}';

    const villePrestataire = profile?.address_city || '{{ville_prestataire}}';
    const siretPrestataire = profile?.bce_number || profile?.siret_number || '{{siret_prestataire}}';
    const tvaPrestataire = profile?.vat_number || '{{tva_prestataire}}';

    // ── Client (nom_client, adresse_client) ─────────────────────────────────
    const nomClient = client?.name || '{{nom_client}}';
    const adresseClient = client?.address || '{{adresse_client}}';

    // ── Projet (nom_projet, date_debut, montant_total) ───────────────────────
    const nomProjet = project?.name || '{{nom_projet}}';
    const dateDebut = project?.start_date
        ? new Date(project.start_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '{{date_debut}}';
    const montantTotal =
        project?.total_price != null ? String(project.total_price) : '{{montant_total}}';

    return content
        .replace(/\{\{nom_prestataire\}\}/g, nomPrestataire)
        .replace(/\{\{adresse_prestataire\}\}/g, adressePrestataire)
        .replace(/\{\{ville_prestataire\}\}/g, villePrestataire)
        .replace(/\{\{siret_prestataire\}\}/g, siretPrestataire)
        .replace(/\{\{tva_prestataire\}\}/g, tvaPrestataire)
        .replace(/\{\{nom_client\}\}/g, nomClient)
        .replace(/\{\{adresse_client\}\}/g, adresseClient)
        .replace(/\{\{nom_projet\}\}/g, nomProjet)
        .replace(/\{\{date_debut\}\}/g, dateDebut)
        .replace(/\{\{montant_total\}\}/g, montantTotal);
}
