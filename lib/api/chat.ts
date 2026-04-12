import { supabase } from "@/lib/supabase";

export interface Message {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_role: 'admin' | 'supervisor';
    recipient_id: string | null;
    content: string;
    created_at: string;
    is_read: boolean;
}

export async function sendMessage(
    content: string, 
    senderId: string, 
    senderName: string, 
    senderRole: 'admin' | 'supervisor',
    recipientId: string | null = null
): Promise<Message> {
    const { data, error } = await supabase
        .from("messages")
        .insert([{
            content,
            sender_id: senderId,
            sender_name: senderName,
            sender_role: senderRole,
            recipient_id: recipientId
        }])
        .select()
        .single();

    if (error) {
        console.error("Error sending message:", error.message, error.details, error.hint);
        throw error;
    }

    return data;
}

export async function getMessages(participantId?: string): Promise<Message[]> {
    let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (participantId) {
        query = query.or(`sender_id.eq.${participantId},recipient_id.eq.${participantId},recipient_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching messages:", error);
        throw error;
    }

    return data || [];
}

export async function getConversation(adminId: string, supervisorId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${adminId},recipient_id.eq.${supervisorId}),and(sender_id.eq.${supervisorId},or(recipient_id.eq.${adminId},recipient_id.is.null))`)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching conversation:", error.message, error.details, error.hint);
        throw error;
    }

    return data || [];
}

export async function getConversationsSummary(adminId: string): Promise<Record<string, { last_message: string, last_message_at: string }>> {
    const { data, error } = await supabase
        .from("messages")
        .select("sender_id, recipient_id, content, created_at")
        .or(`sender_id.eq.${adminId},recipient_id.eq.${adminId}`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching summaries:", error);
        throw error;
    }

    const summaries: Record<string, { last_message: string, last_message_at: string }> = {};

    data?.forEach((m) => {
        const otherId = m.sender_id === adminId ? m.recipient_id : m.sender_id;
        if (otherId && !summaries[otherId]) {
            summaries[otherId] = {
                last_message: m.content,
                last_message_at: m.created_at
            };
        }
    });

    return summaries;
}

export function subscribeToMessages(callback: (message: Message) => void) {
    const channelId = `chat-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId);
    
    channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            console.log("REALTIME PAYLOAD:", payload);
            callback(payload.new as Message);
        })
        .subscribe((status) => {
            console.log(`REALTIME STATUS (${channelId}):`, status);
        });

    return channel;
}
