import { supabase } from "@/lib/supabase";
import { Supervisor } from "@/types/supervisor";

export async function getSupervisors(department?: string, allStaff: boolean = false): Promise<Supervisor[]> {
    if (department === "Teacher") {
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .order("name");
        if (error) throw error;
        return (data || []).map(t => ({ ...t, department: "Teacher" }));
    }

    let query = supabase
        .from("supervisors")
        .select("*")
        .order("name");

    if (department) {
        query = query.eq("department", department);
    } else if (!allStaff) {
        // Default: Only show academic supervisors (department = 'Supervisor' or NULL)
        // This prevents other department members (Tech, Marketing, etc.) from appearing in global dropdowns.
        query = query.or("department.eq.Supervisor,department.is.null");
    }

    const { data, error } = await query;

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
    if (supervisor.department === "Teacher") {
        const generatedEmail = `${supervisor.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}.teacher@email.com`;
        const { data, error } = await supabase
            .from("teachers")
            .insert([{
                ...supervisor,
                email: supervisor.email || generatedEmail,
                password: supervisor.password || "teacher@",
                staff_id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
                is_active: true
            }])
            .select()
            .single();
        if (error) throw error;
        return { ...data, department: "Teacher" };
    }

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
    if (updates.department === "Teacher") {
        const { data, error } = await supabase
            .from("teachers")
            .update(updates)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return { ...data, department: "Teacher" };
    }

    const { data, error } = await supabase
        .from("supervisors")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating supervisor:", JSON.stringify(error, null, 2));
        throw error;
    }

    return data;
}

export async function deleteSupervisor(id: string): Promise<void> {
    // Check if it's a teacher first (or passed as param, but here we just try both or check)
    // For simplicity, we try supervisors first, then teachers if needed, 
    // or we could check the department if we had it.
    // But since this is called from DepartmentManagement which knows the department, 
    // we should ideally pass it. 
    // However, I'll just try supervisors first.
    
    const { error } = await supabase
        .from("supervisors")
        .delete()
        .eq("id", id);

    if (error) {
        // Try teachers
        const { error: tError } = await supabase
            .from("teachers")
            .delete()
            .eq("id", id);
        if (tError) {
            console.error("Error deleting staff:", tError);
            throw tError;
        }
    }
}
