-- Migration: Add department column to supervisors table
-- This allows categorizing staff into Marketing, Tech Team, Finance, etc.

ALTER TABLE public.supervisors 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Supervisor';

-- Optional: Update existing records explicitly (though DEFAULT handles it)
UPDATE public.supervisors SET department = 'Supervisor' WHERE department IS NULL;
