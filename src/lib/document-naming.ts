/**
 * Consistent PDF naming convention:
 *   YYYY-MM-[CLIENT]-[Type]-v[N].pdf
 *
 * Examples:
 *   2026-03-DUPONT-Devis-v1.pdf
 *   2026-03-MARTIN-Contrat-prestation-v2.pdf
 */

export type DocumentType =
    | 'Devis'
    | 'Facture'
    | 'Contrat-prestation'
    | 'NDA'
    | 'CGV'
    | 'Contrat-mission';

/**
 * Strips accents, uppercases, replaces spaces with hyphens, truncates to 20 chars.
 */
function sanitizeClientName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
        .toUpperCase()
        .replace(/[^A-Z0-9 -]/g, '')     // keep alphanumeric + space + hyphen
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 20);
}

/**
 * @param type      Document category label
 * @param clientName Client display name (will be sanitized)
 * @param date      ISO date string from the document's created_at field
 * @param version   Defaults to 1
 */
export function generateDocumentName(
    type: DocumentType,
    clientName: string,
    date: string,
    version = 1,
): string {
    const yearMonth = date.slice(0, 7); // "YYYY-MM"
    const client = sanitizeClientName(clientName) || 'CLIENT';
    return `${yearMonth}-${client}-${type}-v${version}.pdf`;
}
