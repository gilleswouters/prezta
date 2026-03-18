import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { TimeEntry } from '@/types/time';

// Module-level interval so Zustand state stays serializable
let tickInterval: ReturnType<typeof setInterval> | null = null;

function startTick(setState: (fn: (s: TimerStore) => Partial<TimerStore>) => void) {
    stopTick();
    tickInterval = setInterval(() => {
        setState((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
    }, 1000);
}

function stopTick() {
    if (tickInterval !== null) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
}

interface TimerStore {
    isRunning: boolean;
    isPaused: boolean;
    activeEntryId: string | null;
    projectId: string | null;
    taskId: string | null;
    description: string;
    startedAt: Date | null;
    elapsedSeconds: number;
    // Accumulated elapsed when paused then resumed
    _pausedElapsed: number;

    initialize: () => Promise<void>;
    startTimer: (opts: { projectId?: string | null; taskId?: string | null; description?: string }) => Promise<void>;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopTimer: () => Promise<void>;
    reset: () => void;
}

const INITIAL: Pick<TimerStore,
    'isRunning' | 'isPaused' | 'activeEntryId' | 'projectId' |
    'taskId' | 'description' | 'startedAt' | 'elapsedSeconds' | '_pausedElapsed'
> = {
    isRunning: false,
    isPaused: false,
    activeEntryId: null,
    projectId: null,
    taskId: null,
    description: '',
    startedAt: null,
    elapsedSeconds: 0,
    _pausedElapsed: 0,
};

export const useTimerStore = create<TimerStore>((set, get) => ({
    ...INITIAL,

    initialize: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('time_entries')
            .select('*, projects(id, name), tasks(id, title)')
            .eq('user_id', user.id)
            .eq('is_running', true)
            .maybeSingle();

        if (!data) return;

        const entry = data as TimeEntry;
        const elapsed = Math.floor((Date.now() - new Date(entry.started_at).getTime()) / 1000);

        set({
            isRunning: true,
            isPaused: false,
            activeEntryId: entry.id,
            projectId: entry.project_id,
            taskId: entry.task_id,
            description: entry.description ?? '',
            startedAt: new Date(entry.started_at),
            elapsedSeconds: elapsed,
            _pausedElapsed: 0,
        });

        startTick(set);
    },

    startTimer: async ({ projectId = null, taskId = null, description = '' }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Stop any existing running entry first
        const current = get();
        if (current.activeEntryId) {
            await get().stopTimer();
        }

        const now = new Date().toISOString();
        const { data } = await supabase
            .from('time_entries')
            .insert({
                user_id: user.id,
                project_id: projectId,
                task_id: taskId,
                description: description || null,
                started_at: now,
                is_running: true,
            })
            .select('*, projects(id, name), tasks(id, title)')
            .throwOnError()
            .single();

        if (!data) return;

        set({
            isRunning: true,
            isPaused: false,
            activeEntryId: data.id,
            projectId,
            taskId,
            description,
            startedAt: new Date(now),
            elapsedSeconds: 0,
            _pausedElapsed: 0,
        });

        startTick(set);
    },

    pauseTimer: () => {
        stopTick();
        set((s) => ({
            isPaused: true,
            isRunning: false,
            _pausedElapsed: s.elapsedSeconds,
        }));
    },

    resumeTimer: () => {
        set({ isPaused: false, isRunning: true });
        startTick(set);
    },

    stopTimer: async () => {
        stopTick();
        const { activeEntryId, elapsedSeconds } = get();

        if (activeEntryId) {
            await supabase
                .from('time_entries')
                .update({
                    ended_at: new Date().toISOString(),
                    duration_seconds: elapsedSeconds,
                    is_running: false,
                })
                .eq('id', activeEntryId)
                .throwOnError();
        }

        set({ ...INITIAL });
    },

    reset: () => {
        stopTick();
        set({ ...INITIAL });
    },
}));
