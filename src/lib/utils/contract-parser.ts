import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VariableContext {
    nom_prestataire?: string;
    adresse_prestataire?: string;
    ville_prestataire?: string;
    siret_prestataire?: string;
    tva_prestataire?: string;
    nom_client?: string;
    adresse_client?: string;
    nom_projet?: string;
    date_debut?: string;
    montant_total?: string;
    conditions_paiement?: string;
    date_du_jour?: string;
}

export const parseContractTemplate = (template: string, context: VariableContext): string => {
    let content = template;

    // Add default values for some variables
    const fullContext: VariableContext = {
        ...context,
        date_du_jour: context.date_du_jour || format(new Date(), 'dd MMMM yyyy', { locale: fr }),
        conditions_paiement: context.conditions_paiement || '30 jours à réception de facture',
    };

    // Replace each {{key}} with value from context
    Object.entries(fullContext).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value || `[${key} manquant]`);
    });

    return content;
};
