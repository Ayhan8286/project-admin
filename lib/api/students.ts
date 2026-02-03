import { supabase } from "@/lib/supabase";
import { Student } from "@/types/student";

export async function getStudents(): Promise<Student[]> {
    const { data, error } = await supabase
        .from("students")
        .select("id, full_name, reg_no, guardian_name, status, shift, guardian_id, shift_id");

    if (error) {
        console.error("Error fetching students:", error);
        throw error;
    }

    return data || [];
}

export async function getStudentsCount(): Promise<number> {
    const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

    if (error) {
        console.error("Error fetching students count:", error);
        throw error;
    }

    return count || 0;
}

export async function getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching student:", error);
        return null;
    }

    return data;
}

export async function getSiblings(student: Student): Promise<Student[]> {
    if (!student.guardian_id && !student.guardian_name) {
        return [];
    }

    let query = supabase
        .from("students")
        .select("*")
        .neq("id", student.id);

    if (student.guardian_id) {
        query = query.eq("guardian_id", student.guardian_id);
    } else if (student.guardian_name) {
        query = query.eq("guardian_name", student.guardian_name);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching siblings:", error);
        return [];
    }

    return data || [];
}

export async function updateStudent(
    id: string,
    updates: Partial<Pick<Student, "full_name" | "status" | "shift" | "reg_no">>
): Promise<Student | null> {
    const { data, error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating student:", error);
        throw error;
    }

    return data;
}

export async function addStudent(
    student: Omit<Student, "id">
): Promise<Student> {
    const { data, error } = await supabase
        .from("students")
        .insert([student])
        .select()
        .single();

    if (error) {
        console.error("Error adding student:", error);
        throw error;
    }

    return data;
}
