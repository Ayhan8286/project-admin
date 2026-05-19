import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Service Role Key in env.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching teachers...");
    const { data: teachers, error: tError } = await supabase
        .from('teachers')
        .select('id, name');
    
    if (tError) {
        console.error("Error fetching teachers:", tError);
        return;
    }

    console.log(`Found ${teachers.length} teachers.`);

    for (const teacher of teachers) {
        console.log(`\nTeacher: ${teacher.name} (${teacher.id})`);
        const { data: classes, error: cError } = await supabase
            .from('classes')
            .select(`
                student_id,
                student:students(id, full_name, reg_no)
            `)
            .eq('teacher_id', teacher.id);
        
        if (cError) {
            console.error(`Error fetching classes for teacher ${teacher.id}:`, cError);
            continue;
        }

        console.log(`Assigned students: ${classes.length}`);
        classes.forEach(item => {
            console.log(`- ${item.student?.full_name} (${item.student?.reg_no})`);
        });
    }
}

check();
