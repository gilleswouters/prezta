import { useState, useCallback } from 'react';

export interface SireneResult {
    siren: string;
    siret: string;
    nom_entreprise: string;
    adresse_complete: string;
    etat_administratif: string;
    code_postal: string;
    ville: string;
    nature_juridique: string;
    email?: string;
    phone?: string;
}

export function useSireneSearch() {
    const [results, setResults] = useState<SireneResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Utilisation de l'API de l'Etat (ouverte)
            const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=5`);

            if (!response.ok) {
                throw new Error('Erreur lors de la recherche SIRENE');
            }

            const data = await response.json();

            if (data.results) {
                const mappedResults: SireneResult[] = data.results.map((r: any) => {
                    const siege = r.siege || {};
                    const addrArr = [
                        siege.numero_voie,
                        siege.indice_repetition,
                        siege.type_voie,
                        siege.libelle_voie,
                        siege.code_postal,
                        siege.libelle_commune
                    ].filter(Boolean);

                    return {
                        siren: r.siren,
                        siret: siege.siret || '',
                        nom_entreprise: r.nom_complet || r.nom_raison_sociale || '',
                        adresse_complete: addrArr.join(' '),
                        etat_administratif: r.etat_administratif || '',
                        code_postal: siege.code_postal || '',
                        ville: siege.libelle_commune || '',
                        nature_juridique: r.libelle_nature_juridique_entreprise || r.nature_juridique_entreprise || '',
                        email: r.dirigeants?.[0]?.courriels?.[0]?.courriel || undefined, // Approximation, SIRENE has limited contact data
                        phone: undefined // Note: SIRENE Open Data rarely provides direct phone numbers
                    };
                });

                // Ne garder que les entreprises actives
                setResults(mappedResults.filter(r => r.etat_administratif === 'A'));
            } else {
                setResults([]);
            }
        } catch (err: any) {
            console.error('SIRENE API Error:', err);
            setError(err.message || "Erreur de connexion à l'API SIRENE");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return { results, search, isLoading, error, clearResults };
}

// Fonction utilitaire pour calculer le numéro de TVA intracommunautaire FR
// Formule: Clé = (12 + 3 * (SIREN % 97)) % 97. TVA = FR + Clé + SIREN
export function calculateFrenchVAT(siren: string): string {
    const cleanSiren = siren.replace(/\s/g, '');
    if (!/^\d{9}$/.test(cleanSiren)) return '';

    const sirenNum = parseInt(cleanSiren, 10);
    const key = (12 + 3 * (sirenNum % 97)) % 97;
    const keyStr = key.toString().padStart(2, '0');

    return `FR${keyStr}${cleanSiren}`;
}
