-- 1. Create the Courses (Subjects) table
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., 'Quran', 'Tajweed', 'Hifz', 'English'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Add 'course_id' to the existing 'classes' table
ALTER TABLE "classes" 
ADD COLUMN IF NOT EXISTS "course_id" UUID REFERENCES courses(id) ON DELETE SET NULL;

-- 3. (Optional) Insert some default subjects to get started
INSERT INTO courses (name, description) VALUES 
('Quran Reading', 'Nazra Quran'),
('Hifz', 'Quran Memorization'),
('Tajweed', 'Rules of Recitation'),
('Islamic Studies', 'Basic Islamic Knowledge')
ON CONFLICT (name) DO NOTHING;

-- Note: After running this, existing classes will have a NULL course_id.
-- You will need to update them manually or assign courses in the UI.
