import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VariableContext {
    my_name?: string;
    my_city?: string;
    my_bce?: string;
    my_vat?: string;
    client_name?: string;
    client_address?: string;
    project_name?: string;
    start_date?: string;
    total_price?: string;
    payment_terms?: string;
    current_date?: string;
}

export const parseContractTemplate = (template: string, context: VariableContext): string => {
    let content = template;

    // Add default values for some variables
    const fullContext: VariableContext = {
        ...context,
        current_date: context.current_date || format(new Date(), 'dd MMMM yyyy', { locale: fr }),
        payment_terms: context.payment_terms || '30 jours à réception de facture',
    };

    // Replace each {{key}} with value from context
    Object.entries(fullContext).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value || `[${key} manquant]`);
    });

    return content;
};
