import { supabase } from "@/lib/supabase";
import { Payment, PaymentStats } from "@/types/finance";

export async function getPayments(month?: string): Promise<Payment[]> {
    let query = supabase
        .from("payments")
        .select(`
            *,
            student:students(full_name, reg_no)
        `)
        .order("created_at", { ascending: false });

    if (month) {
        query = query.eq("month_covered", month);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching payments:", error);
        throw error;
    }

    return (data || []).map((p: any) => ({
        ...p,
        student: Array.isArray(p.student) ? p.student[0] : p.student
    }));
}

export async function addPayment(payment: Omit<Payment, "id" | "created_at" | "student">): Promise<Payment> {
    const { data, error } = await supabase
        .from("payments")
        .insert([payment])
        .select()
        .single();

    if (error) {
        console.error("Error adding payment:", error);
        throw error;
    }

    return data;
}

export async function updatePaymentStatus(id: string, status: Payment["status"]): Promise<void> {
    const { error } = await supabase
        .from("payments")
        .update({ status, payment_date: status === 'Paid' ? new Date().toISOString() : null })
        .eq("id", id);

    if (error) {
        console.error("Error updating payment status:", error);
        throw error;
    }
}

export async function getFinanceStats(month?: string): Promise<PaymentStats> {
    // Ideally use database aggregation, but for now fetch and calculate
    const payments = await getPayments(month);

    return payments.reduce((acc, curr) => {
        if (curr.status === "Paid") {
            acc.total_revenue += curr.amount;
            acc.paid_count += 1;
        } else if (curr.status === "Pending") {
            acc.pending_amount += curr.amount;
            acc.pending_count += 1;
        } else if (curr.status === "Overdue") {
            acc.pending_amount += curr.amount; // Still pending technically
            acc.overdue_count += 1;
        }
        return acc;
    }, {
        total_revenue: 0,
        pending_amount: 0,
        paid_count: 0,
        pending_count: 0,
        overdue_count: 0
    } as PaymentStats);
}
