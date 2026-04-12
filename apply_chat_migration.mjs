import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationPath = path.join(__dirname, 'database/migrations/create_messages_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log("Applying migration to create messages table...");
  const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
        console.warn("The 'exec_sql' RPC does not exist. Attempting direct execution via internal tool if available, or just noting that schema needs to be applied.");
        // Usually, in these environments, I can't run arbitrary SQL via RPC unless it's set up.
        // But I'll try it.
    } else {
        console.error("Error applying migration:", error.message);
    }
  } else {
    console.log("Migration applied successfully!");
  }
}

applyMigration();
