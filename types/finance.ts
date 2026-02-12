export interface Payment {
    id: string;
    student_id: string;
    amount: number;
    currency: string;
    due_date: string;
    payment_date: string | null;
    status: "Paid" | "Pending" | "Overdue" | "Waived";
    payment_method: string | null;
    month_covered: string;
    receipt_number: string | null;
    created_at: string;
    student?: {
        full_name: string;
        reg_no: string;
    };
}

export interface PaymentStats {
    total_revenue: number;
    pending_amount: number;
    paid_count: number;
    pending_count: number;
    overdue_count: number;
}
