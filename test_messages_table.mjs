import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  console.log("Checking if 'messages' table exists...");
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .limit(1);
  
  if (error) {
    console.error("Error accessing messages table:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Messages table accessible. Data:", data);
  }
}

checkTable();
