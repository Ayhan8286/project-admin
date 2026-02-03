
const { createClient } = require("@supabase/supabase-js");
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    console.log("Loading .env.local...");
    dotenv.config({ path: envPath });
} else {
    console.log("No .env.local found. Checking .env...");
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing Supabase credentials in env.");
    process.exit(1);
}

const supabase = createClient(url, key);

async function inspect() {
    console.log("Attempting to select from 'complaints'...");
    // Try to insert a dummy to see if it works, or just select
    const { data, error } = await supabase.from('complaints').select('*').limit(1);

    if (error) {
        console.error("❌ Error accessing table:", error);
    } else {
        console.log("✅ Table accessed successfully.");
        if (data && data.length > 0) {
            console.log("Sample Row Columns:", Object.keys(data[0]));
        } else {
            console.log("Table is empty. Attempting to insert dummy record with TITLE to check columns...");
            const { data: insertedData, error: insertError } = await supabase.from('complaints').insert({
                title: "Schema Check",
                description: "Checking columns",
                status: "Pending"
            }).select().single();

            if (insertError) {
                console.error("❌ Insert Error (might reveal schema):", insertError);
            } else {
                console.log("✅ Insert successful. Data keys:", Object.keys(insertedData));
            }
        }
    }

    console.log("\nChecking relationships...");
    const { error: relError } = await supabase.from('complaints').select('*, student:students(id), teacher:teachers(id)').limit(1);
    if (relError) {
        console.error("❌ Relationship check failed:", relError.message);
        console.log("Suggestion: Use manual joins instead of Supabase embedding.");
    } else {
        console.log("✅ Foreign key relationships appear to be working.");
    }
}

inspect();
