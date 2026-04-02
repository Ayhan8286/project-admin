import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHFuZ2N3bm9rZmZ6em5zaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjQ1NDksImV4cCI6MjA4Mjk0MDU0OX0.QgJ8_5C0m7SIS62QtKjwm_7o2gdlU1qNBjmnW-QzDg8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error, count } = await supabase
    .from("supervisors")
    .select("email, password", { count: 'exact' });
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Total Supervisors count:", count);
    data.forEach(s => {
      console.log(`- Email: [${s.email}]`);
    });
  }
}

check();
