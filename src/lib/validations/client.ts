import * as z from 'zod';

export const clientSchema = z.object({
    name: z.string().min(2, "Le nom est obligatoire"),
    contact_name: z.string().optional().nullable(),
    email: z.string().email("Format d'email invalide").optional().or(z.literal('')),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    vat_number: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    siret: z.string().optional().nullable(),
    legal_status: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
