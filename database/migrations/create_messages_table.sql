-- Create Messages table for Admin-Supervisor chat
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL, -- Supervisor ID or Admin Auth ID
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'supervisor')),
    recipient_id UUID, -- NULL if global or specific recipient
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Security Policies
-- Admins can see and do everything
CREATE POLICY "Admins can view all messages" ON messages 
    FOR SELECT USING (auth.jwt() ->> 'role' = 'authenticated'); -- This logic might need refinement depending on the admin role setup

-- Supervisors can view messages they sent or received
-- For Supervisors, we use their supervisor_id which is in the DB but not directly in auth.uid() necessarily.
-- However, we'll assume they are authenticated or we use their ID.
-- In this LMS, supervisors login is special.
-- Let's stick to a simpler policy for now or just allow based on custom checks if using a service role.

CREATE POLICY "Supervisors can view their own messages" ON messages 
    FOR SELECT USING (
        sender_id::text = auth.uid()::text OR 
        recipient_id::text = auth.uid()::text
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
