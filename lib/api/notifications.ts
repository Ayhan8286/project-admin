import { supabase } from "@/lib/supabase";

export interface SystemNotification {
    id: string;
    created_at: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
    title: string;
    message: string;
    sender_id?: string;
    recipient_id?: string | null;
    is_read: boolean;
    link?: string;
    metadata?: any;
}

export async function getNotifications(userId?: string, role: string = 'admin'): Promise<SystemNotification[]> {
    let query = supabase
        .from("system_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    if (role === 'supervisor' && userId) {
        // Supervisor sees notifications specifically for them
        query = query.eq("recipient_id", userId);
    } else if (role === 'admin') {
        // Admin sees all notifications (including broadcast)
        // Note: For now, we fetch all for admin.
    }

    const { data, error } = await query;

    if (error) {
        console.error("DEBUG - Notification FETCH ERROR:", JSON.stringify({
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        }, null, 2));
        return [];
    }

    return data || [];
}

export async function createNotification(notification: Omit<SystemNotification, "id" | "created_at" | "is_read">) {
    const { data, error } = await supabase
        .from("system_notifications")
        .insert([{ ...notification, is_read: false }])
        .select()
        .single();

    if (error) {
        console.error("Error creating notification:", error);
        throw error;
    }

    return data;
}

export async function markAsRead(id: string) {
    const { error } = await supabase
        .from("system_notifications")
        .update({ is_read: true })
        .eq("id", id);

    if (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
}

export async function markAllAsRead(userId?: string, role: string = 'admin') {
    let query = supabase
        .from("system_notifications")
        .update({ is_read: true })
        .eq("is_read", false);

    if (role === 'supervisor' && userId) {
        query = query.eq("recipient_id", userId);
    }

    const { error } = await query;

    if (error) {
        console.error("Error marking all notifications as read:", error);
        throw error;
    }
}

export function subscribeToNotifications(userId: string | undefined, role: string, onNew: (notif: SystemNotification) => void) {
    // Unique channel per user/role subscription
    const channelId = `notifications-${role}-${userId || 'broadcast'}`;
    
    return supabase
        .channel(channelId)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'system_notifications'
            },
            (payload) => {
                const newNotif = payload.new as SystemNotification;
                
                // Filtering logic for the client-side subscription
                const isAdmin = role === 'admin';
                const isToMe = newNotif.recipient_id === userId || !newNotif.recipient_id;

                if (isAdmin || isToMe) {
                    onNew(newNotif);
                }
            }
        )
        .subscribe();
}
