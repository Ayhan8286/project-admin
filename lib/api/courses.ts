import { supabase } from "@/lib/supabase";
import { Course } from "@/types/student";

export async function getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching courses:", error);
        throw error;
    }

    return data || [];
}

export interface StudentByCourse {
    student_id: string;
    student_name: string;
    student_reg_no: string;
    teacher_name: string;
    pak_time: string;
}

export async function getStudentsByCourse(courseId: string): Promise<StudentByCourse[]> {
    const { data: classes, error } = await supabase
        .from("classes")
        .select(`
            student_id,
            pak_start_time,
            pak_end_time,
            student:students(id, full_name, reg_no),
            teacher:teachers(name)
        `)
        .eq("course_id", courseId);

    if (error) {
        console.error("Error fetching students by course:", error);
        throw error;
    }

    if (!classes?.length) return [];

    const studentMap = new Map<string, StudentByCourse>();

    classes.forEach((cls: any) => {
        const student = Array.isArray(cls.student) ? cls.student[0] : cls.student;
        const teacher = Array.isArray(cls.teacher) ? cls.teacher[0] : cls.teacher;

        if (student && !studentMap.has(student.id)) {
            studentMap.set(student.id, {
                student_id: student.id,
                student_name: student.full_name,
                student_reg_no: student.reg_no,
                teacher_name: teacher?.name || "Unknown",
                pak_time: `${cls.pak_start_time} - ${cls.pak_end_time}`,
            });
        }
    });

    return Array.from(studentMap.values());
}

export async function addCourse(name: string, description?: string): Promise<Course> {
    const { data, error } = await supabase
        .from("courses")
        .insert([{ name, description }])
        .select()
        .single();

    if (error) {
        console.error("Error adding course:", error);
        throw error;
    }

    return data;
}
