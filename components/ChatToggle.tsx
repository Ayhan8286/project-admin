"use client";

import { useState, useEffect } from "react";
import ChatPanel from "@/components/ChatPanel";
import { MessageSquare, BellRing, X } from "lucide-react";
import { subscribeToMessages } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ChatToggle({ 
    currentUser 
}: { 
    currentUser: { id: string, name: string, role: 'admin' | 'supervisor' } 
}) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
    const [ping, setPing] = useState(false);
    useEffect(() => {
        let subscription: any;

        try {
            subscription = subscribeToMessages((newMessage) => {
                try {
                    const isToMe = 
                        (currentUser.role === 'admin' && (newMessage.recipient_id === null || newMessage.recipient_id === currentUser.id || !newMessage.recipient_id)) ||
                        (currentUser.role === 'supervisor' && newMessage.recipient_id === currentUser.id);

                    if (newMessage.sender_id !== currentUser.id && isToMe) {
                        setHasUnread(true);
                        setUnreadIds((prev) => new Set(prev).add(newMessage.sender_id));
                        setPing(true);
                        setTimeout(() => setPing(false), 2000);

                        if (!isChatOpen) {
                            toast.custom((t) => (
                                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-forest/10 flex items-center gap-4 min-w-[320px] ring-1 ring-black/5 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center shrink-0 cursor-pointer" onClick={() => { setIsChatOpen(true); toast.dismiss(t); }}>
                                        <span className="font-black text-xs text-forest">{newMessage.sender_name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setIsChatOpen(true); toast.dismiss(t); }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-forest/60 mb-0.5">New Message</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{newMessage.sender_name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{newMessage.content}</p>
                                    </div>
                                    <button onClick={() => toast.dismiss(t)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors text-slate-400 hover:text-red-500">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ), { duration: 8000, position: 'bottom-right' });
                        }
                    }
                } catch (e) {
                    console.error("Listener logic error:", e);
                }
            });
        } catch (e) {
            console.error("Subscription setup error:", e);
        }

        return () => {
            if (subscription) {
                // Safely unsubscribe based on the actual channel object
                if (typeof subscription.unsubscribe === 'function') {
                    subscription.unsubscribe();
                } else if (typeof subscription.remove === 'function') {
                    subscription.remove();
                }
            }
        };
    }, [isChatOpen, currentUser.id, currentUser.role]);

    return (
        <>
            {/* Floating Toggle Button */}
            {!isChatOpen && (
                <button
                    onClick={() => {
                        setIsChatOpen(true);
                        setHasUnread(false);
                    }}
                    className={cn(
                        "fixed bottom-8 right-8 z-[90] w-16 h-16 bg-forest text-white rounded-3xl shadow-2xl shadow-forest/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white/20",
                        ping && "animate-bounce"
                    )}
                    aria-label="Toggle Chat"
                >
                    <div className="relative">
                        {hasUnread ? <BellRing className="h-7 w-7 text-yellow-300" /> : <MessageSquare className="h-7 w-7" />}
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-4 border-white dark:border-slate-900 animate-pulse flex items-center justify-center shadow-lg">
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            </span>
                        )}
                    </div>
                
                    {/* Popover label on hover */}
                    <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tracking-widest whitespace-nowrap shadow-xl border border-white/10">
                        {hasUnread ? "New Message" : "Support Chat"}
                    </span>
                </button>
            )}

            {/* Chat Panel */}
            <ChatPanel 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                currentUser={currentUser}
                unreadIds={unreadIds}
                setUnreadIds={setUnreadIds}
            />
        </>
    );
}
