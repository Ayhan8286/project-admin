import { supabase } from "@/lib/supabase";
import { AttendanceRecord } from "@/types/student";

export interface AttendanceWithStudent extends AttendanceRecord {
    student?: {
        id: string;
        full_name: string;
        reg_no: string;
        supervisor_id: string | null;
        supervisor?: {
            id?: string;
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
                supervisor:supervisors(name),
                classes(
                    teacher:teachers(
                        supervisor:supervisors(name)
                    )
                )
            )
        `)
        .eq("date", date);

    if (supervisorId) {
        // We will fetch all and filter in JS because supervisor could be nested via classes
        // Wait, but what if there's a lot of data? For now, we will handle it in JS.
        // Or we could use the linkedStudentIds approach, but let's do JS filtering for now as it's safe.
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching attendance:", error);
        throw error;
    }

    // Handle Supabase nested relations and fallback to teacher's supervisor
    let records = (data || []).map((record) => {
        const student = Array.isArray(record.student) ? record.student[0] : record.student;
        
        let supervisor = Array.isArray(student.supervisor) ? student.supervisor[0] : student.supervisor;
        
        if (!supervisor && student.classes && student.classes.length > 0) {
            const classWithSupervisor = student.classes.find((c: any) => {
                const t = Array.isArray(c.teacher) ? c.teacher[0] : c.teacher;
                return t && t.supervisor;
            });
            if (classWithSupervisor) {
                const t = Array.isArray(classWithSupervisor.teacher) ? classWithSupervisor.teacher[0] : classWithSupervisor.teacher;
                supervisor = Array.isArray(t.supervisor) 
                    ? t.supervisor[0] 
                    : t.supervisor;
            }
        }

        return {
            ...record,
            student: {
                ...student,
                supervisor
            }
        } as AttendanceWithStudent;
    });

    if (supervisorId) {
        // We fetch everything and filter by supervisor here if supervisorId is passed
        // However currently the app does local filtering in the UI so supervisorId is usually undefined.
        records = records.filter(r => r.student?.supervisor_id === supervisorId || r.student?.supervisor?.name === supervisorId || r.student?.supervisor?.id === supervisorId);
    }

    return records;
}

export async function getMissingAttendanceStudents(date: string, supervisorId?: string): Promise<any[]> {
    // 1. Get all active students with classes and teachers
    let studentQuery = supabase
        .from("students")
        .select(`
            id, full_name, reg_no, status, shift, supervisor_id,
            supervisor:supervisors(name),
            classes(
                teacher:teachers(
                    name,
                    supervisor:supervisors(name)
                )
            )
        `)
        .ilike("status", "active");

    if (supervisorId) {
        // Resolve linked students via teachers first
        const { data: teachers } = await supabase.from("teachers").select("id").eq("supervisor_id", supervisorId);
        const teacherIds = (teachers || []).map(t => t.id);
        const { data: classStudents } = await supabase.from("classes").select("student_id").in("teacher_id", teacherIds);
        const linkedStudentIds = (classStudents || []).map(cs => cs.student_id);
        
        // Filter by direct supervisor_id OR linked via teacher classes
        studentQuery = studentQuery.or(`supervisor_id.eq.${supervisorId},id.in.(${linkedStudentIds.length > 0 ? linkedStudentIds.join(',') : 'null'})`);
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

    // 3. Filter missing students and map supervisor correctly
    return (students || [])
        .filter(s => !recordedStudentIds.has(s.id))
        .map(s => {
            let supervisor = Array.isArray(s.supervisor) ? s.supervisor[0] : s.supervisor;
            
            if (!supervisor && s.classes && s.classes.length > 0) {
                const classWithSupervisor = s.classes.find((c: any) => {
                    const t = Array.isArray(c.teacher) ? c.teacher[0] : c.teacher;
                    return t && t.supervisor;
                });
                if (classWithSupervisor) {
                    const t = Array.isArray(classWithSupervisor.teacher) ? classWithSupervisor.teacher[0] : classWithSupervisor.teacher;
                    supervisor = Array.isArray(t.supervisor) 
                        ? t.supervisor[0] 
                        : t.supervisor;
                }
            }

            return {
                ...s,
                supervisor,
                teacher: s.classes?.[0]?.teacher || { name: "Not Assigned" }
            };
        });
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

