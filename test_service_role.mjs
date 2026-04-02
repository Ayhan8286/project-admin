import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHFuZ2N3bm9rZmZ6em5zaGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM2NDU0OSwiZXhwIjoyMDgyOTQwNTQ5fQ.JrMvKHvBquwu_hKvMKI8kSyg5RpOmp8Ac9q8U237Ldc";

const db = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data: teachers, error: tError } = await db.from('teachers').select('id').limit(1);
  console.log("Teachers check:", { teachers, tError });
  
  const { data: sups, error: sError } = await db.from('supervisors').select('email').limit(1);
  console.log("Supervisors check:", { sups, sError });
}

check();
