import { supabase } from "@/lib/supabase";
import { ClassSchedule, Teacher, TeacherAvailability } from "@/types/student";

export async function getTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error("Error fetching teachers:", error);
        throw error;
    }

    return data || [];
}

export async function addTeacher(teacher: Omit<Teacher, "id" | "is_active">): Promise<Teacher> {
    const newTeacher = {
        ...teacher,
        id: crypto.randomUUID(),
        is_active: true
    };

    const { data, error } = await supabase
        .from("teachers")
        .insert([newTeacher])
        .select()
        .single();

    if (error) {
        console.error("Error adding teacher:", error);
        throw error;
    }

    return data;
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
    const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching teacher:", error);
        return null;
    }

    return data;
}

export async function deleteTeacher(id: string): Promise<void> {
    // 1. Delete associated classes
    const { error: classesError } = await supabase
        .from("classes")
        .delete()
        .eq("teacher_id", id);

    if (classesError) {
        console.error("Error deleting teacher classes:", classesError);
    } // Ignoring if no classes, just logging

    // 2. Delete the availability 
    const { error: availabilityError } = await supabase
        .from("teacher_availability")
        .delete()
        .eq("teacher_id", id);

    if (availabilityError) {
        console.error("Error deleting teacher availability:", availabilityError);
    }

    // 3. Finally delete the teacher
    const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting teacher:", error);
        throw error;
    }
}

export async function getTeacherClasses(teacherId: string): Promise<(ClassSchedule & { student: { id: string; full_name: string; reg_no: string } })[]> {
    const { data, error } = await supabase
        .from("classes")
        .select(`
      *,
      student:students(id, full_name, reg_no),
      course:courses(id, name)
    `)
        .eq("teacher_id", teacherId);

    if (error) {
        console.error("Error fetching teacher classes:", error);
        throw error;
    }

    return data || [];
}

export async function getStudentClasses(studentId: string): Promise<ClassSchedule[]> {
    const { data, error } = await supabase
        .from("classes")
        .select(`
      *,
      teacher:teachers(id, name, staff_id),
      app_account:app_accounts(id, platform, account_identifier),
      course:courses(id, name)
    `)
        .eq("student_id", studentId);

    if (error) {
        console.error("Error fetching student classes:", error);
        throw error;
    }

    return data || [];
}

export async function getStudentsByTeacher(teacherId: string): Promise<{ student_id: string; student: { id: string; full_name: string; reg_no: string } }[]> {
    const { data, error } = await supabase
        .from("classes")
        .select(`
      student_id,
      student:students(id, full_name, reg_no)
    `)
        .eq("teacher_id", teacherId);

    if (error) {
        console.error("Error fetching students by teacher:", error);
        throw error;
    }

    // Filter out duplicates (same student in multiple classes)
    const uniqueStudents = new Map();
    data?.forEach(item => {
        if (item.student && !uniqueStudents.has(item.student_id)) {
            uniqueStudents.set(item.student_id, item);
        }
    });

    return Array.from(uniqueStudents.values());
}

export async function updateClass(id: string, updates: Partial<ClassSchedule>): Promise<void> {
    const { error } = await supabase
        .from("classes")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("Error updating class:", error);
        throw error;
    }
}

export async function addClass(classData: Omit<ClassSchedule, "id" | "teacher" | "app_account" | "course">): Promise<ClassSchedule> {
    const { data, error } = await supabase
        .from("classes")
        .insert([classData])
        .select()
        .single();

    if (error) {
        console.error("Error adding class:", error);
        throw error;
    }

    return data;
}

export async function getAllClasses(): Promise<(ClassSchedule & { teacher: Teacher })[]> {
    const { data, error } = await supabase
        .from("classes")
        .select(`
      *,
      teacher:teachers(*),
      student:students(id, full_name, reg_no),
      course:courses(id, name)
    `);

    if (error) {
        console.error("Error fetching all classes:", error);
        throw error;
    }

    return data || [];
}

export async function getAllTeacherAvailability(): Promise<TeacherAvailability[]> {
    const { data, error } = await supabase
        .from("teacher_availability")
        .select("*");

    if (error) {
        console.error("Error fetching teacher availability:", error);
        throw error;
    }

    return data || [];
}

export async function deleteClass(id: string): Promise<void> {
    const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting class:", error);
        throw error;
    }
}
