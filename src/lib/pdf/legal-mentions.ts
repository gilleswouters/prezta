import { Country, LegalStatus } from '@/types/profile';
import type { Profile } from '@/types/profile';

/**
 * Returns an array of legal strings that must appear at the bottom of a quote or invoice,
 * depending on the user's country and legal status.
 */
export function getLegalMentions(profile: Profile | null): string[] {
    if (!profile) return ['Mentions légales non configurées.'];

    const mentions: string[] = [];

    // 1. Identification de base (valable pour tous)
    const companyInfo = [
        profile.company_name || profile.full_name,
        profile.address_street,
        profile.address_zip ? `${profile.address_zip} ${profile.address_city || ''}` : profile.address_city
    ].filter(Boolean).join(' - ');

    if (companyInfo) {
        mentions.push(companyInfo);
    }

    const regInfo = [];
    if (profile.bce_number) regInfo.push(`BCE: ${profile.bce_number}`);
    if (profile.siret_number) regInfo.push(`SIRET: ${profile.siret_number}`);
    if (profile.vat_number) regInfo.push(`TVA: ${profile.vat_number}`);

    if (regInfo.length > 0) {
        mentions.push(regInfo.join(' | '));
    }

    // 2. Mentions spécifiques par franchise/statut
    if (profile.vat_number === '' || !profile.vat_number) {
        // Hypothèse: Pas de numéro de TVA renseigné = Franchise en base
        if (profile.country === Country.FR || profile.legal_status === LegalStatus.AUTO_ENTREPRENEUR_FR) {
            mentions.push('TVA non applicable, art. 293 B du CGI.');
        } else if (profile.country === Country.BE) {
            mentions.push('Petite entreprise soumise au régime de la franchise de la taxe. TVA non applicable.');
        }
    }

    // 3. Pénalités de retard (obligatoires en B2B)
    if (profile.country === Country.FR) {
        mentions.push('En cas de retard de paiement, une pénalité égale à 3 fois le taux d\'intérêt légal sera exigible (Article L. 441-10 du Code de commerce), ainsi qu\'une indemnité forfaitaire pour frais de recouvrement de 40 euros.');
    } else if (profile.country === Country.BE) {
        mentions.push('Tout retard de paiement entraînera de plein droit et sans mise en demeure préalable l\'exigibilité d\'un intérêt de retard conventionnel de 10% l\'an, ainsi qu\'une indemnité forfaitaire de 10% du montant impayé avec un minimum de 40 euros.');
    }

    // 4. Validité du devis
    mentions.push('Ce devis est valable 30 jours à compter de sa date d\'émission. La signature vaut acceptation des conditions.');

    // 5. Coordonnées bancaires
    if (profile.iban) {
        mentions.push(`Coordonnées bancaires (IBAN) : ${profile.iban}`);
    }

    return mentions;
}
