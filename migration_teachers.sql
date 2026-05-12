-- Add password and department columns to teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'teacher@';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Teacher';

-- Update existing teachers' emails and passwords as per user request
UPDATE teachers 
SET 
  email = LOWER(REPLACE(name, ' ', '.')) || '.teacher@email.com',
  password = 'teacher@'
WHERE email IS NULL OR email = '';
