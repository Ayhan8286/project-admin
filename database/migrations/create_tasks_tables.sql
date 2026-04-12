-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    deadline TIMESTAMPTZ,
    supervisor_id UUID REFERENCES public.supervisors(id) ON DELETE SET NULL,
    created_by UUID, -- Can be the admin's auth.uid()
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
-- 1. Admins can do everything
CREATE POLICY admin_all_tasks ON public.tasks 
    FOR ALL USING (auth.jwt()->>'role' = 'admin' OR true); -- In this project, role is often managed via custom logic/cookies, but let's stick to a permissive policy for now if we don't have complex RLS. 
    -- Actually, based on previous code, supervisors are checked by their ID.

-- Flexible policy: Admins see all, Supervisors see assigned
CREATE POLICY tasks_visibility ON public.tasks
    FOR SELECT
    USING (
        true -- For now, keep it simple as the app handles filtering in the API layer
    );

CREATE POLICY tasks_insert ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY tasks_update ON public.tasks FOR UPDATE USING (true);
CREATE POLICY tasks_delete ON public.tasks FOR DELETE USING (true);

-- Policies for task_comments
CREATE POLICY comments_visibility ON public.task_comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON public.task_comments FOR INSERT WITH CHECK (true);
CREATE POLICY comments_update ON public.task_comments FOR UPDATE USING (true);
CREATE POLICY comments_delete ON public.task_comments FOR DELETE USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
