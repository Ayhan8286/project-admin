import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fbhqngcwnokffzznshjr.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHFuZ2N3bm9rZmZ6em5zaGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM2NDU0OSwiZXhwIjoyMDgyOTQwNTQ5fQ.JrMvKHvBquwu_hKvMKI8kSyg5RpOmp8Ac9q8U237Ldc";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateTeachers() {
  console.log("Fetching teachers...");
  const { data: teachers, error: fetchError } = await supabase.from('teachers').select('id, name');
  
  if (fetchError) {
    console.error("Error fetching teachers:", fetchError);
    return;
  }

  console.log(`Updating ${teachers.length} teachers...`);
  
  for (const teacher of teachers) {
    const generatedEmail = `${teacher.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}.teacher@email.com`;
    const { error: updateError } = await supabase
      .from('teachers')
      .update({
        email: generatedEmail,
        password: 'teacher@',
        department: 'Teacher'
      })
      .eq('id', teacher.id);
    
    if (updateError) {
      console.error(`Error updating teacher ${teacher.name}:`, updateError);
    } else {
      console.log(`Updated ${teacher.name} -> ${generatedEmail}`);
    }
  }
  
  console.log("Migration complete.");
}

migrateTeachers();
