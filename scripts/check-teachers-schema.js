// Script to inspect teachers table schema
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "sb_publishable_3M6m1nj431KPeSpalK3LZw_nLFIY3z7";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTeachersSchema() {
    console.log("=== Checking Teachers Table Schema ===\n");

    try {
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .limit(1);

        if (error) {
            console.log(`Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log("Columns found:");
            console.log(Object.keys(data[0]));
            console.log("\nSample Row Data:");
            console.log(data[0]);
        } else {
            console.log("Teacher table is empty or no data returned.");
        }
    } catch (e) {
        console.log(`Exception: ${e.message}`);
    }
}

checkTeachersSchema();
