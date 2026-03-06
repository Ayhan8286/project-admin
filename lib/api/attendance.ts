import { supabase } from "@/lib/supabase";
import { AttendanceRecord } from "@/types/student";

export interface AttendanceWithStudent extends AttendanceRecord {
    student?: {
        id: string;
        full_name: string;
        reg_no: string;
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

export async function getAttendanceByDate(date: string): Promise<AttendanceWithStudent[]> {
    const { data, error } = await supabase
        .from("attendance")
        .select(`
            *,
            student:students(id, full_name, reg_no)
        `)
        .eq("date", date)
        .order("created_at", { ascending: false });

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

