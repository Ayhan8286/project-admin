import { supabase } from "@/lib/supabase";

export interface ClassSession {
    id: string;
    class_id: string;
    teacher_id: string;
    student_id: string;
    session_date: string;
    start_time: string | null;
    end_time: string | null;
    status: "Scheduled" | "Completed" | "Missed" | "Rescheduled";
    notes: string | null;
    class?: any;
    student?: any;
}

export async function getTodaySessions(teacherId: string): Promise<ClassSession[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Get all classes for this teacher
    const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select(`
            *,
            student:students(id, full_name, reg_no, performance_notes),
            app_account:app_accounts(id, platform, account_identifier, meeting_link),
            course:courses(name)
        `)
        .eq("teacher_id", teacherId);

    if (classesError) throw classesError;

    // 2. Filter classes by today's day of week
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    const todayClasses = (classes || []).filter(c => c.schedule_days && c.schedule_days[dayOfWeek]);

    // 3. Get existing sessions for today
    const { data: sessions, error: sessionsError } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("session_date", today);

    if (sessionsError) throw sessionsError;

    // 4. Merge: For each class today, find its session or create a mock "Scheduled" one
    return todayClasses.map(cls => {
        const session = sessions?.find(s => s.class_id === cls.id);
        return {
            id: session?.id || `mock-${cls.id}`,
            class_id: cls.id,
            teacher_id: teacherId,
            student_id: cls.student_id,
            session_date: today,
            start_time: session?.start_time || null,
            end_time: session?.end_time || null,
            status: (session?.status as any) || "Scheduled",
            notes: session?.notes || null,
            class: cls,
            student: cls.student
        };
    });
}

export async function startSession(classId: string, teacherId: string, studentId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from("class_sessions")
        .upsert({
            class_id: classId,
            teacher_id: teacherId,
            student_id: studentId,
            session_date: today,
            start_time: new Date().toISOString(),
            status: "Scheduled" // Still scheduled until completed
        }, { onConflict: 'class_id,session_date' }) // Need to ensure unique constraint in DB or handle carefully
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function endSession(sessionId: string, notes: string, status: "Completed" | "Missed" | "Rescheduled" = "Completed") {
    const { data, error } = await supabase
        .from("class_sessions")
        .update({
            end_time: new Date().toISOString(),
            status,
            notes
        })
        .eq("id", sessionId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function updateStudentNotes(studentId: string, notes: string) {
    const { data, error } = await supabase
        .from("students")
        .update({ performance_notes: notes })
        .eq("id", studentId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}
