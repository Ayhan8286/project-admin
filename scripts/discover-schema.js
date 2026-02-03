// Script to discover Supabase table schema
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "sb_publishable_3M6m1nj431KPeSpalK3LZw_nLFIY3z7";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function discoverSchema() {
    console.log("=== Discovering Database Schema ===\n");

    // Try to get a sample row from each table to see columns
    const tables = ["students", "classes", "teachers", "attendance"];

    for (const table of tables) {
        console.log(`\n--- Table: ${table} ---`);
        try {
            const { data, error } = await supabase.from(table).select("*").limit(1);

            if (error) {
                console.log(`Error: ${error.message}`);
            } else if (data && data.length > 0) {
                console.log("Columns:", Object.keys(data[0]).join(", "));
                console.log("Sample row:", JSON.stringify(data[0], null, 2));
            } else {
                console.log("Table exists but is empty");
                // Try to get column info another way
                const { data: emptyData, error: emptyError } = await supabase
                    .from(table)
                    .select("*")
                    .limit(0);
                if (!emptyError) {
                    console.log("(empty table, no column info available)");
                }
            }
        } catch (e) {
            console.log(`Exception: ${e.message}`);
        }
    }
}

discoverSchema();
