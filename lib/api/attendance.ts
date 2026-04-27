import { supabase } from "@/lib/supabase";
import { AttendanceRecord } from "@/types/student";

export interface AttendanceWithStudent extends AttendanceRecord {
    student?: {
        id: string;
        full_name: string;
        reg_no: string;
        supervisor_id: string | null;
        supervisor?: {
            name: string;
        } | null;
    };
}

export async function submitAttendance(records: AttendanceRecord[]): Promise<void> {
    console.log("Submitting attendance records:", records.length, "records");

    const { error } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: 'student_id, date' });

    if (error) {
        // Supabase errors have non-enumerable props — extract them explicitly
        const details = {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
        };
        console.error("Supabase attendance error:", details);
        throw new Error(
            error.message || "Failed to submit attendance. Check Supabase RLS policies for the 'attendance' table."
        );
    }
}

export async function getAttendanceByDate(date: string, supervisorId?: string): Promise<AttendanceWithStudent[]> {
    let query = supabase
        .from("attendance")
        .select(`
            *,
            student:students!inner(
                id, 
                full_name, 
                reg_no, 
                supervisor_id,
                supervisor:supervisors(name)
            )
        `)
        .eq("date", date);

    if (supervisorId) {
        query = query.eq("students.supervisor_id", supervisorId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching attendance:", error);
        throw error;
    }

    // Handle Supabase nested relations
    return (data || []).map((record) => ({
        ...record,
        student: Array.isArray(record.student) ? record.student[0] : record.student,
    }));
}

export async function getMissingAttendanceStudents(date: string, supervisorId?: string): Promise<any[]> {
    // 1. Get all active students
    let studentQuery = supabase
        .from("students")
        .select(`
            id, full_name, reg_no, status, shift, supervisor_id,
            supervisor:supervisors(name),
            classes(
                teacher:teachers(name)
            )
        `)
        .ilike("status", "active");

    if (supervisorId) {
        studentQuery = studentQuery.eq("supervisor_id", supervisorId);
    }

    const { data: students, error: studentError } = await studentQuery;
    if (studentError) throw studentError;

    // 2. Get students who HAVE attendance for this date
    const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance")
        .select("student_id")
        .eq("date", date);
    if (attendanceError) throw attendanceError;

    const recordedStudentIds = new Set((attendanceRecords || []).map(r => r.student_id));

    // 3. Filter missing students
    return (students || [])
        .filter(s => !recordedStudentIds.has(s.id))
        .map(s => ({
            ...s,
            supervisor: Array.isArray(s.supervisor) ? s.supervisor[0] : s.supervisor,
            teacher: s.classes?.[0]?.teacher || { name: "Not Assigned" }
        }));
}

export async function getAttendanceSummary(date: string): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
}> {
    const records = await getAttendanceByDate(date);
    return {
        total: records.length,
        present: records.filter(r => r.status === "Present").length,
        absent: records.filter(r => r.status === "Absent").length,
        late: records.filter(r => r.status === "Late").length,
        leave: records.filter(r => r.status === "Leave").length,
    };
}

