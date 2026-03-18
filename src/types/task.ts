export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    user_id: string;
    project_id: string | null;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null; // ISO Date String
    linked_document_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined relations automatically populated by Supabase SELECT
    projects?: {
        name: string;
        clients?: { name: string; address: string | null };
    } | null;
}

export interface TaskFormData {
    project_id?: string | null;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
    linked_document_id?: string | null;
}
