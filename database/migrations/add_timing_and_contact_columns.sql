-- Add timing, email, and phone columns to supervisors and teachers tables

-- 1. Update supervisors table
ALTER TABLE supervisors 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS timing text;

-- 2. Update teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS timing text;
