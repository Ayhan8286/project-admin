-- Optimization Migration for Al Huda LMS

-- 1. Enable pg_trgm for fuzzy search first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create Indexes for faster lookups and joins
CREATE INDEX IF NOT EXISTS idx_students_full_name ON students USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students (reg_no);
CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
CREATE INDEX IF NOT EXISTS idx_students_shift ON students (shift);
CREATE INDEX IF NOT EXISTS idx_students_supervisor_id ON students (supervisor_id);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_student_id ON classes (student_id);
CREATE INDEX IF NOT EXISTS idx_classes_app_account_id ON classes (app_account_id);

CREATE INDEX IF NOT EXISTS idx_teachers_supervisor_id ON teachers (supervisor_id);
CREATE INDEX IF NOT EXISTS idx_teachers_staff_id ON teachers (staff_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance (status);


-- 3. Optimized View for Dashboard Summary (Optional but good for performance)
-- This allows fetching counts in a single query
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
    (SELECT count(*) FROM students) as total_students,
    (SELECT count(*) FROM students WHERE status ILIKE 'active') as active_students,
    (SELECT count(*) FROM teachers WHERE is_active = true) as active_teachers,
    (SELECT count(*) FROM teachers) as total_teachers,
    (SELECT count(*) FROM classes) as total_classes;

-- 4. View for teacher student counts (unique students per teacher)
CREATE OR REPLACE VIEW teacher_student_counts AS
SELECT teacher_id, count(DISTINCT student_id) as student_count
FROM classes
GROUP BY teacher_id;

-- 5. View for supervisor stats (teachers and unique students per supervisor)
CREATE OR REPLACE VIEW supervisor_stats_summary AS
SELECT 
    t.supervisor_id, 
    count(DISTINCT t.id) as teacher_count,
    count(DISTINCT c.student_id) as student_count
FROM teachers t
LEFT JOIN classes c ON c.teacher_id = t.id
WHERE t.is_active = true
GROUP BY t.supervisor_id;

-- 6. Function to get student counts by shift (faster than fetching all rows)
CREATE OR REPLACE FUNCTION get_student_shift_counts()
RETURNS TABLE (shift text, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT s.shift, count(*)
    FROM students s
    GROUP BY s.shift;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
