import { supabase } from "@/lib/supabase";
import { Complaint } from "@/types/complaint";

export async function getComplaints(): Promise<Complaint[]> {
    const { data, error } = await supabase
        .from("complaints")
        .select(`
            *,
            student:students(full_name, reg_no),
            teacher:teachers(name, staff_id)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching complaints:", error);
        throw error;
    }

    return (data || []).map((item) => ({
        ...item,
        student: Array.isArray(item.student) ? item.student[0] : item.student,
        teacher: Array.isArray(item.teacher) ? item.teacher[0] : item.teacher,
    }));
}

export async function addComplaint(complaint: Partial<Complaint>): Promise<Complaint> {
    const { data, error } = await supabase
        .from("complaints")
        .insert(complaint)
        .select()
        .single();

    if (error) {
        console.error("Error adding complaint:", JSON.stringify(error, null, 2));
        throw error;
    }

    return data;
}

export async function updateComplaintStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
        .from("complaints")
        .update({ status })
        .eq("id", id);

    if (error) {
        console.error("Error updating complaint status:", error);
        throw error;
    }
}

export async function deleteComplaint(id: string): Promise<void> {
    const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting complaint:", error);
        throw error;
    }
}
