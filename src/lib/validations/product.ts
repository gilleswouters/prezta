import * as z from 'zod';
import { Unit } from '@/types/product';

export const productSchema = z.object({
    name: z.string().min(2, "Le nom est obligatoire (min. 2 caractères)"),
    description: z.string().max(200, "Maximum 200 caractères pour la description").optional().nullable(),
    unit_price: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
    tva_rate: z.coerce.number().min(0, "Taux de TVA invalide"),
    unit: z.string().refine((val) => Object.values(Unit).includes(val as Unit), { message: "Unité invalide" }),
});

export type ProductFormValues = z.infer<typeof productSchema>;
