import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface VariableContext {
    // Prestataire
    nom_prestataire?: string;
    adresse_prestataire?: string;
    ville_prestataire?: string;
    siret_prestataire?: string;
    tva_prestataire?: string;
    // Client / projet
    nom_client?: string;
    adresse_client?: string;
    nom_projet?: string;
    date_debut?: string;
    date_fin?: string;
    montant_total?: string;
    conditions_paiement?: string;
    date_du_jour?: string;
    // Financier (prestation)
    tjm?: string;
    forfait?: string;
    devise?: string;
    acompte_percent?: string;
    penalite_retard?: string;
    // Travail
    salaire_base?: string;
    convention_collective?: string;
    periode_essai?: string;
    cdd_date_fin?: string;
    // Alternance
    alternance_diplome?: string;
    alternance_cfa?: string;
    alternance_maitre?: string;
    // Clauses spéciales
    pi_condition?: string;
    non_concurrence_duree?: string;
    non_concurrence_zone?: string;
}

export const parseContractTemplate = (template: string, context: VariableContext): string => {
    let content = template;

    const fullContext: VariableContext = {
        ...context,
        date_du_jour: context.date_du_jour || format(new Date(), 'dd MMMM yyyy', { locale: fr }),
        conditions_paiement: context.conditions_paiement || '30 jours à réception de facture',
        devise: context.devise || 'EUR',
        acompte_percent: context.acompte_percent || '30%',
        penalite_retard: context.penalite_retard || '3×',
    };

    Object.entries(fullContext).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, value || `[${key} manquant]`);
    });

    return content;
};
