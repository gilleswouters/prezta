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
    client_id: string; // references clients
    name: string;
    description: string | null;
    status: ProjectStatus;
    start_date: string | null;
    end_date: string | null;
    expected_documents: ProjectDocument[];
    created_at: string;
    updated_at: string;
}

export type ProjectFormData = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface ProjectWithClient extends Project {
    clients: {
        name: string;
    };
}
