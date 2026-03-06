-- 1. Disable RLS just in case it was turned back on
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- 2. Explicitly grant permissions to the roles used by the Supabase API
GRANT ALL PRIVILEGES ON TABLE attendance TO anon;
GRANT ALL PRIVILEGES ON TABLE attendance TO authenticated;
GRANT ALL PRIVILEGES ON TABLE attendance TO service_role;
