export interface Supervisor {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    timing: string | null;
    password?: string | null;
    department?: string | null;
    created_at: string;
}
