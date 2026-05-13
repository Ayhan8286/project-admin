-- Add performance_notes to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS performance_notes TEXT;

-- Add meeting_link to app_accounts
ALTER TABLE app_accounts ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Create class_sessions table for tracking daily classes
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_date DATE DEFAULT CURRENT_DATE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Scheduled', -- Scheduled, Completed, Missed, Rescheduled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, session_date)
);
