-- 00029_time_entries.sql
-- Time tracking entries for Phase 5

CREATE TABLE IF NOT EXISTS public.time_entries (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id       UUID        REFERENCES public.projects(id)    ON DELETE SET NULL,
    task_id          UUID        REFERENCES public.tasks(id)        ON DELETE SET NULL,
    description      TEXT,
    started_at       TIMESTAMPTZ NOT NULL,
    ended_at         TIMESTAMPTZ,
    duration_seconds INTEGER,
    is_running       BOOLEAN     NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- Only one active timer per user at a time.
-- Using a unique partial index instead of EXCLUDE USING btree,
-- which requires the btree_gist extension (not available by default).
CREATE UNIQUE INDEX IF NOT EXISTS one_running_timer_per_user
    ON public.time_entries (user_id)
    WHERE (is_running = true);

-- RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_select" ON public.time_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "time_entries_insert" ON public.time_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "time_entries_update" ON public.time_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "time_entries_delete" ON public.time_entries
    FOR DELETE USING (auth.uid() = user_id);
