import * as z from 'zod';
import { ProjectStatus } from '@/types/project';

// Step 1: Basic Info
export const projectStep1Schema = z.object({
    name: z.string().min(3, "Le nom du projet doit contenir au moins 3 caractères."),
    client_id: z.string().min(1, "Veuillez sélectionner un client."),
});

// Step 2: Brief & Dates
export const projectStep2Schema = z.object({
    description: z.string().max(1000, "Maximum 1000 caractères autorisés.").optional().nullable(),
    start_date: z.string().optional().nullable(), // We'll handle dates as simple ISO strings for now in the form
    end_date: z.string().optional().nullable(),
    status: z.string().refine((val) => Object.values(ProjectStatus).includes(val as ProjectStatus), { message: "Statut invalide" }).optional()
});

// Step 3: Documents
const projectDocumentSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Le nom du document est requis"),
    is_completed: z.boolean().default(false)
});

export const projectStep3Schema = z.object({
    expected_documents: z.array(projectDocumentSchema).optional()
});

export type ProjectStep1Values = z.infer<typeof projectStep1Schema>;
export type ProjectStep2Values = z.infer<typeof projectStep2Schema>;
export type ProjectStep3Values = z.infer<typeof projectStep3Schema>;
