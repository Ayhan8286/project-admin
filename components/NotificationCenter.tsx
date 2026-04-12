"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    subscribeToNotifications, 
    SystemNotification 
} from "@/lib/api/notifications";
import { Bell, Check, Clock, Info, ShieldAlert, CheckCircle2, ChevronRight, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationCenter({ 
    userId, 
    role = "admin" 
}: { 
    userId: string | undefined, 
    role?: string 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch notifications
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["system_notifications", userId, role],
        queryFn: () => getNotifications(userId, role),
        refetchInterval: 60000, // Refresh every minute manually as fallback
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Real-time subscription
    useEffect(() => {
        const channel = subscribeToNotifications(userId, role, (newNotif) => {
            // Update the cache locally for instant feedback
            queryClient.setQueryData(["system_notifications", userId, role], (old: SystemNotification[] = []) => {
                const updated = [newNotif, ...old];
                return updated.slice(0, 20); // Keep last 20
            });

            // Show a toast for important notifications
            if (newNotif.type === 'ALERT' || newNotif.type === 'WARNING') {
                toast.error(newNotif.title, { description: newNotif.message });
            } else {
                toast.success(newNotif.title, { description: newNotif.message });
            }
        });

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [userId, role, queryClient]);

    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system_notifications"] })
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => markAllAsRead(userId, role),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system_notifications"] })
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'ALERT': return <ShieldAlert className="h-4 w-4 text-red-500" />;
            case 'SUCCESS': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'WARNING': return <Info className="h-4 w-4 text-amber-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-all relative group"
            >
                <Bell className={cn("h-5 w-5 transition-transform group-hover:rotate-12", unreadCount > 0 ? "text-forest dark:text-emerald-400" : "text-emerald-800 dark:text-emerald-200")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 border border-white/20 animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[40]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-4 w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2rem] border border-emerald-900/10 dark:border-white/10 shadow-[0px_20px_50px_rgba(0,0,0,0.2)] z-[50] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-6 bg-forest/5 dark:bg-emerald-900/20 border-b border-emerald-900/10 dark:border-white/10 flex justify-between items-center bg-gradient-to-br from-forest/10 to-transparent">
                            <div>
                                <h3 className="font-extrabold text-emerald-900 dark:text-white brand-font text-lg tracking-tight">System Alerts</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-800/40 dark:text-emerald-200/40">Real-time actions</p>
                            </div>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={() => markAllReadMutation.mutate()}
                                    className="text-[10px] font-black uppercase text-forest hover:text-emerald-700 transition-colors flex items-center gap-1.5 bg-forest/10 px-3 py-1.5 rounded-full"
                                >
                                    <Check className="h-3 w-3" />
                                    Mark All Read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar p-3 space-y-1">
                            {isLoading ? (
                                <div className="py-20 text-center"><span className="material-symbols-outlined animate-spin text-forest/40">loader</span></div>
                            ) : notifications.length === 0 ? (
                                <div className="py-20 text-center text-emerald-800/40 dark:text-emerald-200/40 space-y-3">
                                    <Bell className="h-12 w-12 mx-auto stroke-[1]" />
                                    <p className="text-xs font-black uppercase tracking-widest">No notifications yet</p>
                                </div>
                            ) : notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={cn(
                                        "p-4 rounded-2xl transition-all group cursor-pointer relative",
                                        n.is_read ? "opacity-60 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/10" : "bg-forest/[0.03] dark:bg-emerald-400/[0.03] border border-forest/10 shadow-sm hover:shadow-md"
                                    )}
                                    onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", n.is_read ? "bg-slate-100 dark:bg-slate-800" : "bg-white dark:bg-slate-800 shadow-sm")}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className={cn("text-sm truncate", n.is_read ? "font-semibold text-slate-600 dark:text-slate-400" : "font-black text-emerald-900 dark:text-white")}>
                                                    {n.title}
                                                </h4>
                                                {!n.is_read && <span className="w-2 h-2 bg-forest rounded-full mt-1.5 shadow-lg shadow-forest/40"></span>}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">{n.message}</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(n.created_at))} ago
                                                </div>
                                                {n.link && (
                                                    <span className="text-[10px] font-black text-forest flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                                                        VIEW <ChevronRight className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

