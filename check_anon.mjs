const SUPABASE_URL = "https://fbhqngcwnokffzznshjr.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHFuZ2N3bm9rZmZ6em5zaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjQ1NDksImV4cCI6MjA4Mjk0MDU0OX0.QgJ8_5C0m7SIS62QtKjwm_7o2gdlU1qNBjmnW-QzDg8";

const res = await fetch(`${SUPABASE_URL}/rest/v1/supervisors?select=id,name,email,password`, {
  headers: {
    "apikey": ANON_KEY,
    "Authorization": `Bearer ${ANON_KEY}`,
  },
});

const data = await res.json();
console.log("Anon Response:", data);
