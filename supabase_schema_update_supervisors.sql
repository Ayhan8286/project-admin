-- Add supervisor_id to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES supervisors(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_students_supervisor_id ON students(supervisor_id);
