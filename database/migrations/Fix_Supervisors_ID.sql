-- Make sure the uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set the default value of the id column to auto-generate a UUID
ALTER TABLE supervisors 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();
