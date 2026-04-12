import { supabase } from "@/lib/supabase";

export interface DashboardStats {
    totalStudents: number;
    activeTeachers: number;
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
    missingAttendanceCount: number;
}

export async function getDashboardStats(supervisorId?: string): Promise<DashboardStats> {
    // If supervisorId is provided, we need to fetch their specific context first
    let teacherIds: string[] = [];
    let studentIds: string[] = [];
    let classIds: string[] = [];
    let accountsData: { platform: string | null }[] = [];

    if (supervisorId) {
        // 1. Get teachers for this supervisor
        const { data: supervisorTeachers } = await supabase
            .from("teachers")
            .select("id")
            .eq("supervisor_id", supervisorId);
        
        teacherIds = supervisorTeachers?.map(t => t.id) || [];

        if (teacherIds.length > 0) {
            // 2. Get classes for these teachers
            const { data: supervisorClasses } = await supabase
                .from("classes")
                .select("id, student_id, app_account_id, schedule_days, app_account:app_accounts(platform)")
                .in("teacher_id", teacherIds);
            
            if (supervisorClasses) {
                classIds = supervisorClasses.map(c => c.id);
                studentIds = Array.from(new Set(supervisorClasses.map(c => c.student_id).filter(id => !!id) as string[]));
                
                // Extract unique account platforms
                const accountsMap = new Map<string, string>();
                supervisorClasses.forEach(c => {
                    if (c.app_account_id && c.app_account) {
                        const platform = (c.app_account as any).platform || "Unknown";
                        accountsMap.set(c.app_account_id, platform);
                    }
                });
                accountsData = Array.from(accountsMap.values()).map(platform => ({ platform }));
            }
        }
    }

    // Now perform the main dashboard queries, applying filters if needed
    const queries = [];

    if (supervisorId) {
        // Filtered counts
        queries.push(supabase.from("students").select("*", { count: "exact", head: true }).in("id", studentIds));
        queries.push(supabase.from("teachers").select("*", { count: "exact", head: true }).in("id", teacherIds).eq("is_active", true));
        queries.push(supabase.from("teachers").select("*", { count: "exact", head: true }).in("id", teacherIds));
        queries.push(supabase.from("classes").select("*", { count: "exact", head: true }).in("id", classIds));
        queries.push(supabase.from("students").select("*", { count: "exact", head: true }).in("id", studentIds).ilike("status", "active"));
        queries.push(supabase.from("students").select("shift").in("id", studentIds));
        
        // Schedule data (already fetched for supervisorClasses but let's re-fetch clean if needed or reuse)
        // Re-fetching classes for clean schedule processing
        queries.push(supabase.from("classes").select("schedule_days").in("id", classIds));
        
        // App accounts (already have platforms from classes join)
        queries.push(Promise.resolve({ data: accountsData }));
    } else {
        // Global counts
        queries.push(supabase.from("students").select("*", { count: "exact", head: true }));
        queries.push(supabase.from("teachers").select("*", { count: "exact", head: true }).eq("is_active", true));
        queries.push(supabase.from("teachers").select("*", { count: "exact", head: true }));
        queries.push(supabase.from("classes").select("*", { count: "exact", head: true }));
        queries.push(supabase.from("students").select("*", { count: "exact", head: true }).ilike("status", "active"));
        queries.push(supabase.from("students").select("shift"));
        queries.push(supabase.from("classes").select("schedule_days"));
        queries.push(supabase.from("app_accounts").select("platform"));
    }

    const [
        studentsResult,
        activeTeachersResult,
        allTeachersResult,
        classesResult,
        activeStudentsResult,
        shiftResult,
        classScheduleResult,
        appAccountsResult,
    ] = await Promise.all(queries as any[]);

    // Calculate students by shift
    const studentsByShift: Record<string, number> = {};
    if (shiftResult.data) {
        shiftResult.data.forEach((student: any) => {
            const shift = student.shift || "Unassigned";
            studentsByShift[shift] = (studentsByShift[shift] || 0) + 1;
        });
    }

    // Calculate classes per day and hours per day (each class = 30 mins)
    const classesPerDay: Record<string, number> = {
        Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };

    if (classScheduleResult.data) {
        classScheduleResult.data.forEach((cls: any) => {
            if (cls.schedule_days) {
                Object.keys(cls.schedule_days).forEach((day) => {
                    if (classesPerDay[day] !== undefined) {
                        classesPerDay[day]++;
                    }
                });
            }
        });
    }

    const hoursPerDay: Record<string, number> = {};
    Object.keys(classesPerDay).forEach((day) => {
        hoursPerDay[day] = classesPerDay[day] * 0.5;
    });

    const totalStudents = studentsResult.count || 0;
    const activeStudents = activeStudentsResult.count || 0;

    // Calculate accounts by platform
    const accountsByPlatform: Record<string, number> = {};
    if (appAccountsResult.data) {
        appAccountsResult.data.forEach((account: any) => {
            const platform = account.platform || "Unknown";
            accountsByPlatform[platform] = (accountsByPlatform[platform] || 0) + 1;
        });
    }
    const totalAccounts = appAccountsResult.data?.length || 0;

    // Calculate today's attendance stats
    const today = new Date().toISOString().split('T')[0];
    let attendanceQuery = supabase.from("attendance").select("status").eq("date", today);
    
    if (supervisorId) {
        attendanceQuery = attendanceQuery.in("student_id", studentIds);
    }
    
    const { data: attendanceData } = await attendanceQuery;

    let todayAttendancePercentage = 0;
    const attendanceStats = { present: 0, absent: 0, late: 0, leave: 0 };

    if (activeStudents > 0) {
        if (attendanceData) {
            const counts = attendanceData.reduce((acc, curr) => {
                const status = curr.status?.toLowerCase();
                if (status === 'present') acc.present++;
                else if (status === 'absent') acc.absent++;
                else if (status === 'late') acc.late++;
                else if (status === 'leave') acc.leave++;
                return acc;
            }, { present: 0, absent: 0, late: 0, leave: 0 });

            attendanceStats.present = Math.round((counts.present / activeStudents) * 100);
            attendanceStats.absent = Math.round((counts.absent / activeStudents) * 100);
            attendanceStats.late = Math.round((counts.late / activeStudents) * 100);
            attendanceStats.leave = Math.round((counts.leave / activeStudents) * 100);
            
            todayAttendancePercentage = Math.round(((counts.present + counts.late) / activeStudents) * 100);
        }
    }

    return {
        totalStudents,
        activeTeachers: activeTeachersResult.count || 0,
        totalTeachers: allTeachersResult.count || 0,
        totalClasses: classesResult.count || 0,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        studentsByShift,
        classesPerDay,
        hoursPerDay,
        accountsByPlatform,
        totalAccounts,
        todayAttendancePercentage,
        attendanceStats,
        missingAttendanceCount: Math.max(0, activeStudents - (attendanceData?.length || 0))
    };
}


