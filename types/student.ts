export interface Student {
    id: string;
    reg_no: string;
    full_name: string;
    guardian_name: string;
    status: string;
    shift: string;
    guardian_id: string | null;
    shift_id: string | null;
    supervisor_id: string | null;
    classes?: { course: { name: string } | null }[];
    supervisor?: { name: string } | null;
}

export interface Course {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface Teacher {
    id: string;
    staff_id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    timing?: string | null;
    is_active: boolean;
    supervisor_id: string | null;
}

export interface TeacherAvailability {
    id: string;
    teacher_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

export interface ClassSchedule {
    id: string;
    teacher_id: string;
    student_id: string;
    app_account_id: string | null;
    pak_start_time: string;
    pak_end_time: string;
    uk_start_time: string;
    uk_end_time: string;
    schedule_days: Record<string, string>;
    teacher?: Teacher;
    app_account?: AppAccount;
    course_id: string | null;
    course?: Course;
}

export interface AttendanceRecord {
    id?: string;
    student_id: string;
    class_id?: string | null;
    date: string;
    status: "Present" | "Absent" | "Late" | "Leave";
    remarks?: string | null;
    marked_by?: string | null;
}

export interface Platform {
    id: string;
    name: string;
    created_at: string;
}

export interface AppAccount {
    id: string;
    platform: string;
    account_identifier: string;
    platform_id: string;
}

export interface StudentByPlatform {
    student_id: string;
    student_name: string;
    student_reg_no: string;
    account_identifier: string;
    teacher_name: string;
    pak_time: string;
}
