import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHFuZ2N3bm9rZmZ6em5zaGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM2NDU0OSwiZXhwIjoyMDgyOTQwNTQ5fQ.JrMvKHvBquwu_hKvMKI8kSyg5RpOmp8Ac9q8U237Ldc";

const db = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const emailToFind = "fatima.supervisor@email.com";
  
  console.log(`Searching for: [${emailToFind}]`);
  
  const { data: supervisor, error } = await db
    .from("supervisors")
    .select("id, email, password")
    .ilike("email", emailToFind)
    .maybeSingle();
    
  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Found Supervisor:", JSON.stringify(supervisor, null, 2));
  }
  
  // List all to be sure
  const { data: all } = await db.from("supervisors").select("email");
  console.log("All Emails in DB:", all.map(a => `[${a.email}]`).join(", "));
}

test();
