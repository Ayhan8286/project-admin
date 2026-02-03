// List all tables
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "sb_publishable_3M6m1nj431KPeSpalK3LZw_nLFIY3z7";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    console.log("=== Listing All Tables ===\n");

    // This is a bit of a hack since we can't easily list tables with the JS client directly 
    // without admin rights or rpc. 
    // However, I can try to discover them by checking common names or using a specific query if RPC is available.
    // A better approach for a "discover schema" script in this restricted env is to guess common names.

    const potentialTables = [
        "teacher_availability", "availabilities", "shifts", "teacher_shifts",
        "users", "staff", "profiles", "timetables", "schedules"
    ];

    for (const table of potentialTables) {
        const { data, error } = await supabase.from(table).select("*").limit(1);
        if (!error) {
            console.log(`[FOUND] Table '${table}' exists.`);
            if (data && data.length > 0) {
                console.log(`   Sample keys: ${Object.keys(data[0]).join(", ")}`);
            } else {
                console.log("   (Empty table)");
            }
        } else {
            // error.message usually contains "relation ... does not exist"
            // console.log(`[Check] ${table}: ${error.message}`);
        }
    }
}

listTables();
