import { supabase } from "@/lib/supabase";

export interface DailyReport {
    id?: string;
    student_id: string;
    teacher_id: string;
    supervisor_id: string;
    date: string;
    time: string;
    description: string;
    created_at?: string;
    student?: {
        full_name: string;
        reg_no: string;
    };
    teacher?: {
        name: string;
    };
    supervisor?: {
        name: string;
    };
}

export async function submitDailyReport(report: Omit<DailyReport, "id" | "created_at">): Promise<void> {
    console.log("Submitting daily report:", report);
    
    const { error } = await supabase
        .from("daily_reports")
        .upsert([report], { onConflict: 'student_id, date' });

    if (error) {
        console.error("Daily report submission error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        throw error;
    }
}

export async function getDailyReports(filters: {
    date?: string;
    supervisorId?: string;
    teacherId?: string;
    studentId?: string;
}): Promise<DailyReport[]> {
    let query = supabase
        .from("daily_reports")
        .select(`
            *,
            student:students(full_name, reg_no),
            teacher:teachers(name),
            supervisor:supervisors(name)
        `);

    if (filters.date) query = query.eq("date", filters.date);
    if (filters.supervisorId) query = query.eq("supervisor_id", filters.supervisorId);
    if (filters.teacherId) query = query.eq("teacher_id", filters.teacherId);
    if (filters.studentId) query = query.eq("student_id", filters.studentId);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching daily reports:", error);
        throw error;
    }

    return (data || []).map(report => ({
        ...report,
        student: Array.isArray(report.student) ? report.student[0] : report.student,
        teacher: Array.isArray(report.teacher) ? report.teacher[0] : report.teacher,
        supervisor: Array.isArray(report.supervisor) ? report.supervisor[0] : report.supervisor,
    }));
}

export async function getStudentsForReporting(supervisorId?: string): Promise<any[]> {
    let query = supabase
        .from("students")
        .select(`
            id, full_name, reg_no, supervisor_id,
            supervisor:supervisors(id, name),
            classes(
                teacher:teachers(id, name)
            )
        `)
        .ilike("status", "active");

    if (supervisorId) {
        query = query.eq("supervisor_id", supervisorId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(s => ({
        ...s,
        supervisor: Array.isArray(s.supervisor) ? s.supervisor[0] : s.supervisor,
        teacher: s.classes?.[0]?.teacher || null
    }));
}
