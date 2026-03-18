import { Country, LegalStatus } from '@/types/profile';
import type { Profile } from '@/types/profile';

export type LegalDocType = 'quote' | 'invoice' | 'contract';

export interface LegalMentionsBlock {
    identity: string;
    registration: string | null;
    vat_status: string | null;
    late_payment: string | null;
    /** Quote validity line — null for invoices and contracts. */
    validity: string | null;
    iban: string | null;
}

export interface ProfileCompleteness {
    isComplete: boolean;
    missingFields: string[];
}

/**
 * Returns a structured block of legal mentions for PDF documents.
 * Use `docType` to tailor the content (e.g. validity only on quotes).
 */
export function generateLegalMentions(
    profile: Profile | null,
    docType: LegalDocType = 'quote',
): LegalMentionsBlock {
    if (!profile) {
        return {
            identity: 'Mentions légales non configurées.',
            registration: null,
            vat_status: null,
            late_payment: null,
            validity: null,
            iban: null,
        };
    }

    // 1. Identity
    const identity = [
        profile.company_name || profile.full_name,
        profile.address_street,
        profile.address_zip
            ? `${profile.address_zip} ${profile.address_city || ''}`.trim()
            : profile.address_city,
    ]
        .filter(Boolean)
        .join(' — ');

    // 2. Registration numbers
    const regParts: string[] = [];
    if (profile.siret_number) regParts.push(`SIRET : ${profile.siret_number}`);
    if (profile.bce_number)   regParts.push(`BCE : ${profile.bce_number}`);
    if (profile.vat_number)   regParts.push(`N° TVA : ${profile.vat_number}`);
    const registration = regParts.length > 0 ? regParts.join(' | ') : null;

    // 3. TVA status
    let vat_status: string | null = null;
    if (!profile.vat_number) {
        if (profile.country === Country.FR || profile.legal_status === LegalStatus.AUTO_ENTREPRENEUR_FR) {
            vat_status = 'TVA non applicable, art. 293 B du CGI.';
        } else if (profile.country === Country.BE) {
            vat_status = 'Petite entreprise soumise au régime de la franchise de la taxe. TVA non applicable.';
        }
    }

    // 4. Late payment penalties (B2B obligation)
    let late_payment: string | null = null;
    if (docType !== 'contract') {
        if (profile.country === Country.FR) {
            late_payment =
                'En cas de retard de paiement, une pénalité égale à 3 fois le taux d\'intérêt légal sera exigible ' +
                '(Art. L. 441-10 C. com.), ainsi qu\'une indemnité forfaitaire de 40 € pour frais de recouvrement.';
        } else if (profile.country === Country.BE) {
            late_payment =
                'Tout retard de paiement entraînera de plein droit un intérêt de retard de 10 % l\'an, ' +
                'ainsi qu\'une indemnité forfaitaire de 10 % du montant impayé (min. 40 €).';
        }
    }

    // 5. Validity — quotes only
    const validity =
        docType === 'quote'
            ? 'Devis valable 30 jours à compter de sa date d\'émission. La signature vaut acceptation des conditions générales.'
            : null;

    // 6. IBAN — invoices only
    const iban =
        docType === 'invoice' && profile.iban
            ? `Règlement par virement : IBAN ${profile.iban}`
            : null;

    return { identity, registration, vat_status, late_payment, validity, iban };
}

/**
 * Flatten a `LegalMentionsBlock` into the string array used by PDF footers.
 * Preserves backward compatibility with existing PDF documents.
 */
export function getLegalMentions(
    profile: Profile | null,
    docType: LegalDocType = 'quote',
): string[] {
    const block = generateLegalMentions(profile, docType);
    return [
        block.identity,
        block.registration,
        block.vat_status,
        block.late_payment,
        block.validity,
        block.iban,
    ].filter((s): s is string => Boolean(s));
}

/**
 * Returns which required profile fields are missing for compliant PDF generation.
 */
export function getProfileCompleteness(profile: Profile | null): ProfileCompleteness {
    if (!profile) return { isComplete: false, missingFields: ['profil non chargé'] };

    const missingFields: string[] = [];
    if (!profile.company_name && !profile.full_name) missingFields.push('Nom / raison sociale');
    if (!profile.siret_number && !profile.bce_number) missingFields.push('SIRET ou BCE');
    if (!profile.address_street) missingFields.push('Adresse');
    if (!profile.legal_status) missingFields.push('Statut juridique');
    if (!profile.iban) missingFields.push('IBAN');

    return { isComplete: missingFields.length === 0, missingFields };
}
