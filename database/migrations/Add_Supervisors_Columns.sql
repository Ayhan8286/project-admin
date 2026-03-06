-- Add missing email and phone columns to the supervisors table
ALTER TABLE supervisors 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;
