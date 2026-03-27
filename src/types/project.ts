export const ProjectStatus = {
    DRAFT: 'draft',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export interface ProjectDocument {
    id: string; // uuid generated on client side or by db
    name: string;
    is_completed: boolean;
}

export interface Project {
    id: string; // uuid
    user_id: string; // references auth.users
    client_id: string | null; // references clients
    name: string;
    description: string | null;
    status: ProjectStatus;
    expected_documents: ProjectDocument[];
    portal_link: string;
    portal_enabled: boolean;
    portal_expires_at: string | null;
    /** ISO date string (YYYY-MM-DD) — optional, project may be open-ended */
    start_date: string | null;
    /** ISO date string (YYYY-MM-DD) — optional */
    end_date: string | null;
    created_at: string;
    updated_at: string;
}

export type ProjectFormData = Omit<
    Project,
    'id' | 'user_id' | 'portal_link' | 'portal_enabled' | 'portal_expires_at' | 'created_at' | 'updated_at'
>;

import type { Client } from './client';

export interface ProjectWithClient extends Project {
    clients: Client | null;
}
