-- 1. Add supervisor_id to students table if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES supervisors(id);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_students_supervisor_id ON students(supervisor_id);

-- 3. Just in case, grant permissions (optional but good practice)
GRANT ALL ON TABLE students TO authenticated;
GRANT ALL ON TABLE students TO service_role;
