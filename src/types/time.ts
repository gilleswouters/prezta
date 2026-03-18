export interface TimeEntry {
    id: string;
    user_id: string;
    project_id: string | null;
    task_id: string | null;
    description: string | null;
    started_at: string; // ISO
    ended_at: string | null; // ISO
    duration_seconds: number | null;
    is_running: boolean;
    is_billed: boolean;
    created_at: string;
    // Joined via SELECT
    projects?: { id: string; name: string } | null;
    tasks?: { id: string; title: string } | null;
}

export interface TimeEntryInsert {
    user_id: string;
    project_id?: string | null;
    task_id?: string | null;
    description?: string | null;
    started_at: string;
    ended_at?: string | null;
    duration_seconds?: number | null;
    is_running: boolean;
}

export interface TimeEntryUpdate {
    project_id?: string | null;
    task_id?: string | null;
    description?: string | null;
    ended_at?: string | null;
    duration_seconds?: number | null;
    is_running?: boolean;
}

export interface TimerState {
    isRunning: boolean;
    activeEntry: TimeEntry | null;
    elapsedSeconds: number;
}
