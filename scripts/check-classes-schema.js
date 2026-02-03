// Check classes schema
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "sb_publishable_3M6m1nj431KPeSpalK3LZw_nLFIY3z7";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkClassesSchema() {
    console.log("=== Checking Classes Table Schema ===\n");
    const { data, error } = await supabase.from("classes").select("*").limit(1);

    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("No data or error", error);
    }
}

checkClassesSchema();
