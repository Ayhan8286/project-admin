import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHFuZ2N3bm9rZmZ6em5zaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjQ1NDksImV4cCI6MjA4Mjk0MDU0OX0.QgJ8_5C0m7SIS62QtKjwm_7o2gdlU1qNBjmnW-QzDg8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data: accounts } = await supabase.from('app_accounts').select('*').limit(1);
  console.log('AppAccount record keys:', Object.keys(accounts?.[0] || {}));
  
  const { data: classes } = await supabase.from('classes').select('*').limit(1);
  console.log('Class record keys:', Object.keys(classes?.[0] || {}));
}

checkSchema();
