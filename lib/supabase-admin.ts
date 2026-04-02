import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // If we are on the server but missing keys, something is wrong with the .env
  if (typeof window === 'undefined') {
    console.warn("Supabase Admin client missing keys in Server environment.");
  }
}

// This client should only be used on the server (Server Components or Server Actions)
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseServiceRoleKey || "placeholder-key"
);
