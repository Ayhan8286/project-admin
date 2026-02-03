// Script to check class times
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseAnonKey = "sb_publishable_3M6m1nj431KPeSpalK3LZw_nLFIY3z7";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTimes() {
    console.log("=== Checking Class Times ===\n");

    try {
        const { data, error } = await supabase
            .from("classes")
            .select("id, pak_start_time, pak_end_time, schedule_days")
            .limit(10);

        if (error) {
            console.log(`Error: ${error.message}`);
        } else {
            console.log("Sample Class Times:");
            console.table(data);
        }
    } catch (e) {
        console.log(`Exception: ${e.message}`);
    }
}

checkTimes();
