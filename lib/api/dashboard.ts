import { supabase } from "@/lib/supabase";

export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeStudents: number;
    inactiveStudents: number;
    studentsByShift: Record<string, number>;
    classesPerDay: Record<string, number>;
    hoursPerDay: Record<string, number>;
    accountsByPlatform: Record<string, number>;
    totalAccounts: number;
    todayAttendancePercentage: number;
    attendanceStats: {
        present: number;
        absent: number;
        late: number;
        leave: number;
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    // Get all counts in parallel
    const [
        studentsResult,
        teachersResult,
        classesResult,
        activeStudentsResult,
        shiftResult,
        classScheduleResult,
        appAccountsResult,
    ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }).ilike("status", "active"),
        supabase.from("students").select("shift"),
        supabase.from("classes").select("schedule_days"),
        supabase.from("app_accounts").select("platform"),
    ]);

    // Calculate students by shift
    const studentsByShift: Record<string, number> = {};
    if (shiftResult.data) {
        shiftResult.data.forEach((student) => {
            const shift = student.shift || "Unassigned";
            studentsByShift[shift] = (studentsByShift[shift] || 0) + 1;
        });
    }

    // Calculate classes per day and hours per day (each class = 30 mins)
    const classesPerDay: Record<string, number> = {
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0,
        Sun: 0,
    };

    if (classScheduleResult.data) {
        classScheduleResult.data.forEach((cls) => {
            if (cls.schedule_days) {
                Object.keys(cls.schedule_days).forEach((day) => {
                    if (classesPerDay[day] !== undefined) {
                        classesPerDay[day]++;
                    }
                });
            }
        });
    }

    // Convert classes to hours (each class = 30 mins = 0.5 hours)
    const hoursPerDay: Record<string, number> = {};
    Object.keys(classesPerDay).forEach((day) => {
        hoursPerDay[day] = classesPerDay[day] * 0.5;
    });

    const totalStudents = studentsResult.count || 0;
    const activeStudents = activeStudentsResult.count || 0;

    // Calculate accounts by platform
    const accountsByPlatform: Record<string, number> = {};
    if (appAccountsResult.data) {
        appAccountsResult.data.forEach((account) => {
            const platform = account.platform || "Unknown";
            accountsByPlatform[platform] = (accountsByPlatform[platform] || 0) + 1;
        });
    }
    const totalAccounts = appAccountsResult.data?.length || 0;

    // Calculate today's attendance stats
    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("date", today);

    let todayAttendancePercentage = 0;
    const attendanceStats = {
        present: 0,
        absent: 0,
        late: 0,
        leave: 0
    };

    if (activeStudents > 0) {
        if (attendanceData) {
            const presentCount = attendanceData.filter(r => r.status === "Present" || r.status === "Late").length;
            todayAttendancePercentage = Math.round((presentCount / activeStudents) * 100);

            // Calculate detailed percentages
            const counts = attendanceData.reduce((acc, curr) => {
                const status = curr.status?.toLowerCase();
                if (status === 'present') acc.present++;
                else if (status === 'absent') acc.absent++;
                else if (status === 'late') acc.late++;
                else if (status === 'leave') acc.leave++;
                return acc;
            }, { present: 0, absent: 0, late: 0, leave: 0 });

            // If we have active students, calculate percentages based on total active students
            // Assuming those without a record are 'Absent' or we just show recorded stats
            // Let's stick to recorded stats percentage relative to Active Students for better accuracy
            // Or just percentage of recorded? Typically "Absent" is explicit or implied.
            // For dashboard, usually we want:
            // Present % = (Present + Late) / Total Active
            // Absent % = (Total Active - (Present + Late + Leave)) / Total Active ... or explicit Absent records
            // The prompt asks for "students today present percentage, absent percentage, leave percentage, late percentage"
            // Let's calculate based on counts / activeStudents to show coverage.

            attendanceStats.present = Math.round((counts.present / activeStudents) * 100);
            attendanceStats.absent = Math.round((counts.absent / activeStudents) * 100); // Only explicit absents?
            // If we rely on explicit 'Absent' records:
            attendanceStats.late = Math.round((counts.late / activeStudents) * 100);
            attendanceStats.leave = Math.round((counts.leave / activeStudents) * 100);
            
            // NOTE: If 'Absent' is not recorded explicitly for everyone, this might be low. 
            // Often unrecorded = Absent. But let's stick to what the DB says for now or derived.
            // If user wants implicit absence, we'd do: absent = 100 - present - late - leave. 
            // Let's assume explicit for now as per code structure.
        }
    }

    return {
        totalStudents,
        totalTeachers: teachersResult.count || 0,
        totalClasses: classesResult.count || 0,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        studentsByShift,
        classesPerDay,
        hoursPerDay,
        accountsByPlatform,
        totalAccounts,
        todayAttendancePercentage,
        attendanceStats
    };
}

