import * as z from 'zod';
import { Country, LegalStatus } from '@/types/profile';

// Advanced Mod-97 validation for Belgian BCE/TVA
const isValidMod97 = (bce: string): boolean => {
    const clean = bce.replace(/\D/g, '');
    if (clean.length !== 10) return false;
    const base = parseInt(clean.substring(0, 8), 10);
    const check = parseInt(clean.substring(8, 10), 10);
    return 97 - (base % 97) === check;
};

// Check IBAN format using mod-97-10 (Simplified validation for structure)
const isValidIBAN = (iban: string): boolean => {
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    const regex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    return regex.test(clean);
};

export const profileSchema = z.object({
    full_name: z.string().min(2, "Le nom est requis"),
    phone: z.string().optional().nullable(),
    company_name: z.string().optional().nullable(),
    country: z.nativeEnum(Country, { error: "Pays invalide" }),
    legal_status: z.nativeEnum(LegalStatus, { error: "Statut juridique invalide" }),

    bce_number: z.string().optional().nullable(),
    siret_number: z.string().optional().nullable(),
    vat_number: z.string().optional().nullable(),

    iban: z.string()
        .optional()
        .nullable()
        .refine((val) => !val || isValidIBAN(val), { message: "Format IBAN invalide" }),

    address_street: z.string().optional().nullable(),
    address_city: z.string().optional().nullable(),
    address_zip: z.string().optional().nullable(),
    logo_url: z.string().optional().nullable()
})
    .superRefine((data, ctx) => {
        // Belgian Specific Rules
        if (data.country === Country.BE) {
            if (!data.bce_number) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Le numéro BCE est requis en Belgique",
                    path: ["bce_number"]
                });
            } else if (!isValidMod97(data.bce_number)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Numéro d'entreprise erroné (Mod-97 invalide)",
                    path: ["bce_number"]
                });
            }

            // Auto-generate TVA warning format if missing BE prefix when provided
            if (data.vat_number && !data.vat_number.toUpperCase().startsWith('BE')) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Le numéro de TVA belge doit commencer par BE",
                    path: ["vat_number"]
                });
            }
        }

        // French Specific Rules
        if (data.country === Country.FR) {
            if (!data.siret_number) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Le numéro SIRET est requis en France",
                    path: ["siret_number"]
                });
            } else if (data.siret_number.replace(/\s/g, '').length !== 14) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Le SIRET doit contenir exactement 14 chiffres",
                    path: ["siret_number"]
                });
            }
        }
    });

export type ProfileFormValues = z.infer<typeof profileSchema>;
