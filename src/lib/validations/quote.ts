import { z } from "zod";

export const quoteLineSchema = z.object({
    id: z.string(),
    productId: z.string().optional(),
    name: z.string().min(1, "La ligne doit avoir un nom"),
    description: z.string().optional(),
    quantity: z.coerce.number().min(0.01, "La quantité doit être supérieure à 0"),
    unitPrice: z.coerce.number().min(0, "Le prix unitaire ne peut pas être négatif"),
    tvaRate: z.coerce.number().min(0, "Le taux de TVA ne peut pas être négatif").max(100, "TVA max 100%"),
    unit: z.enum(["heure", "forfait", "pièce", "jour"]),
});

export const quoteSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Titre requis"),
    projectId: z.string().min(1, "Projet requis"),
    clientId: z.string().optional(),
    lines: z.array(quoteLineSchema).min(1, "Le devis doit contenir au moins une ligne"),
    notes: z.string().optional(),
});

export type QuoteLineFormValues = z.infer<typeof quoteLineSchema>;
export type QuoteFormValues = z.infer<typeof quoteSchema>;
