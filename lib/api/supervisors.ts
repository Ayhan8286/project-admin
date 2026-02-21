import { supabase } from "@/lib/supabase";
import { Supervisor } from "@/types/supervisor";

export async function getSupervisors(): Promise<Supervisor[]> {
    const { data, error } = await supabase
        .from("supervisors")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching supervisors:", error);
        throw error;
    }

    return data || [];
}

export async function getSupervisorById(id: string): Promise<Supervisor | null> {
    const { data, error } = await supabase
        .from("supervisors")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching supervisor:", error);
        return null;
    }

    return data;
}

export async function addSupervisor(supervisor: Omit<Supervisor, "id" | "created_at">): Promise<Supervisor> {
    const { data, error } = await supabase
        .from("supervisors")
        .insert([supervisor])
        .select()
        .single();

    if (error) {
        console.error("Error adding supervisor:", JSON.stringify(error, null, 2));
        throw error;
    }

    return data;
}

export async function updateSupervisor(
    id: string,
    updates: Partial<Omit<Supervisor, "id" | "created_at">>
): Promise<Supervisor | null> {
    const { data, error } = await supabase
        .from("supervisors")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating supervisor:", error);
        throw error;
    }

    return data;
}

export async function deleteSupervisor(id: string): Promise<void> {
    const { error } = await supabase
        .from("supervisors")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting supervisor:", error);
        throw error;
    }
}
