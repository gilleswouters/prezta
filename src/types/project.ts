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
    created_at: string;
    updated_at: string;
}

export type ProjectFormData = Omit<Project, 'id' | 'user_id' | 'portal_link' | 'created_at' | 'updated_at'>;

export interface ProjectWithClient extends Project {
    clients: {
        name: string;
    };
}
