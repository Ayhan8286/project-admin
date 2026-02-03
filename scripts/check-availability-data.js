// Check availability values
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "sb_publishable_3M6m1nj431KPeSpalK3LZw_nLFIY3z7";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAvailabilityValues() {
    console.log("=== Checking Availability Values ===\n");
    // Get a few rows
    const { data, error } = await supabase.from("teacher_availability").select("*").limit(5);

    if (data) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log("Error:", error);
    }
}

checkAvailabilityValues();
