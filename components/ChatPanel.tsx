"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Message, sendMessage, getMessages, getConversation, subscribeToMessages, getConversationsSummary } from "@/lib/api/chat";
import { getSupervisors } from "@/lib/api/supervisors";
import { Supervisor } from "@/types/supervisor";
import { X, Send, User, ShieldCheck, Loader2, ArrowLeft, Search, Paperclip, CheckCheck, Clock, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

export default function ChatPanel({ 
    isOpen, 
    onClose, 
    currentUser,
    unreadIds,
    setUnreadIds
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    currentUser: { id: string, name: string, role: 'admin' | 'supervisor' },
    unreadIds: Set<string>,
    setUnreadIds: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Auto-sync on open
    useEffect(() => {
        if (isOpen) {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            queryClient.invalidateQueries({ queryKey: ["conversations-summary"] });
        }
    }, [isOpen, queryClient]);

    // Fetch Supervisors for Admin
    const { data: supervisors = [], isLoading: isLoadingSupervisors } = useQuery({
        queryKey: ["supervisors-chat"],
        queryFn: getSupervisors,
        enabled: isOpen && currentUser.role === 'admin',
    });

    // Fetch Conversation Summaries (Last messages) for Admin
    const { data: summaries = {}, refetch: refetchSummaries } = useQuery({
        queryKey: ["conversations-summary"],
        queryFn: () => getConversationsSummary(currentUser.id),
        enabled: isOpen && currentUser.role === 'admin',
    });

    // Fetch Messages for current conversation
    const { data: initialMessages, isLoading: isLoadingMessages } = useQuery<Message[]>({
        queryKey: ["messages", selectedSupervisor?.id || 'global'],
        queryFn: () => {
            if (currentUser.role === 'admin' && selectedSupervisor) {
                return getConversation(currentUser.id, selectedSupervisor.id);
            }
            return getMessages(currentUser.id);
        },
        enabled: isOpen && (currentUser.role === 'supervisor' || !!selectedSupervisor),
    });

    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages as Message[]);
        }
    }, [initialMessages]);

    // Handle real-time updates
    useEffect(() => {
        if (!isOpen) return;

        const subscription = subscribeToMessages((newMessage) => {
            const isToMe = 
                (currentUser.role === 'admin' && (newMessage.recipient_id === null || newMessage.recipient_id === currentUser.id || !newMessage.recipient_id)) ||
                (currentUser.role === 'supervisor' && newMessage.recipient_id === currentUser.id);

            const belongsToCurrentThread = 
                (currentUser.role === 'supervisor') || 
                (selectedSupervisor && (
                    (newMessage.sender_id === selectedSupervisor.id && isToMe) ||
                    (newMessage.sender_id === currentUser.id && newMessage.recipient_id === selectedSupervisor.id)
                ));

            if (belongsToCurrentThread) {
                setMessages((prev) => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            }

            // Also mark as unread in the list if it's from another supervisor
            if (currentUser.role === 'admin' && newMessage.sender_id !== selectedSupervisor?.id && newMessage.sender_id !== currentUser.id && isToMe) {
                setUnreadIds((prev) => new Set(prev).add(newMessage.sender_id));
            }

            if (currentUser.role === 'admin') {
                refetchSummaries();
            }
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [isOpen, selectedSupervisor, currentUser, refetchSummaries]);

    // Scroll to bottom
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    useEffect(() => {
        if (isOpen && messages.length > 0) {
            scrollToBottom('auto');
        }
    }, [isOpen, selectedSupervisor]);

    useEffect(() => {
        if (isOpen && messages.length > 0) {
            scrollToBottom('smooth');
        }
    }, [messages]);

    const sendMutation = useMutation({
        mutationFn: (text: string) => sendMessage(
            text, 
            currentUser.id, 
            currentUser.name, 
            currentUser.role, 
            currentUser.role === 'admin' ? selectedSupervisor?.id : null
        ),
        onSuccess: () => {
            setInput("");
            if (currentUser.role === 'admin') refetchSummaries();
        }
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sendMutation.isPending) return;
        sendMutation.mutate(input);
    };

    const selectSupervisor = (s: Supervisor) => {
        setSelectedSupervisor(s);
        setUnreadIds((prev) => {
            const next = new Set(prev);
            next.delete(s.id);
            return next;
        });
    };

    if (!isOpen) return null;

    // Sorting & Filtering
    const sortedSupervisors = [...supervisors]
        .sort((a, b) => {
            const dateA = summaries[a.id]?.last_message_at || '0';
            const dateB = summaries[b.id]?.last_message_at || '0';
            return dateB.localeCompare(dateA); 
        })
        .filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const showThreadView = currentUser.role === 'supervisor' || !!selectedSupervisor;

    const formatMessageDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return format(date, "h:mm a");
        if (isYesterday(date)) return "Yesterday";
        return format(date, "MMM d");
    };

    return (
        <div className={cn(
            "fixed bottom-28 right-8 z-[100] flex flex-col shadow-[0px_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 ease-in-out transform w-full sm:max-w-[400px] h-[650px] max-h-[85vh]",
            isOpen ? "translate-y-0 opacity-100 scale-100 pointer-events-auto" : "translate-y-20 opacity-0 scale-95 pointer-events-none",
            "bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 dark:border-white/10 overflow-hidden ring-1 ring-black/5"
        )}>
            {/* Header - Premium Floating Style */}
            <div className="bg-gradient-to-r from-forest to-[#2d6f46] px-8 py-7 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                <div className="flex items-center gap-4 relative z-10">
                    {currentUser.role === 'admin' && showThreadView && (
                        <button 
                            onClick={() => setSelectedSupervisor(null)}
                            className="p-1.5 hover:bg-white/20 rounded-full transition-all active:scale-90"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-lg">
                            {showThreadView ? <User className="h-6 w-6" /> : <MessageSquareQuote className="h-6 w-6" />}
                        </div>
                        {showThreadView && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-forest rounded-full shadow-lg"></span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-base tracking-tight truncate drop-shadow-sm">
                            {showThreadView 
                                ? (currentUser.role === 'admin' ? selectedSupervisor?.name : "LMS Support") 
                                : "Messages"
                            }
                        </h3>
                        <div className="flex items-center gap-1.5 opacity-80">
                            <span className="w-1.5 h-1.5 bg-emerald-200 rounded-full animate-pulse"></span>
                            <p className="text-[10px] text-white font-black uppercase tracking-[0.2em] mt-0.5">
                                {showThreadView ? "Encrypted" : "Team Hub"}
                            </p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2.5 hover:bg-white/20 rounded-2xl transition-all active:rotate-90 relative z-10"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {(!showThreadView && currentUser.role === 'admin') ? (
                    /* Floating List View */
                    <div className="flex-1 flex flex-col overflow-hidden bg-white/30 dark:bg-slate-900/30">
                        <div className="p-5">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-forest transition-colors" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search directory..."
                                    className="w-full pl-11 pr-5 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-[13px] font-semibold focus:ring-2 focus:ring-forest/20 transition-all placeholder:text-slate-400 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1 pb-6">
                            {isLoadingSupervisors ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-forest/40" /></div>
                            ) : sortedSupervisors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400/50">
                                    <Search className="h-12 w-12 mb-3" />
                                    <p className="text-xs font-black uppercase tracking-widest text-center">No results found</p>
                                </div>
                            ) : sortedSupervisors.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => selectSupervisor(s)}
                                    className="w-full flex items-center gap-4 px-5 py-4 rounded-[1.75rem] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group active:scale-[0.98] relative"
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-forest/10 to-forest/20 flex items-center justify-center text-forest shadow-sm group-hover:scale-105 transition-transform border border-forest/10 uppercase font-black text-xs">
                                            {s.name.substring(0, 2)}
                                        </div>
                                        {unreadIds.has(s.id) && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-lg shadow-red-500/20 z-10"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">{s.name}</p>
                                            {summaries[s.id] && (
                                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2 opacity-60">
                                                    {formatMessageDate(summaries[s.id].last_message_at)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-semibold leading-snug opacity-70">
                                            {summaries[s.id]?.last_message || "Secure internal line..."}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Floating Chat Thread */
                    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
                            {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-forest/20" /></div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-20 p-12 space-y-4">
                                    <ShieldCheck className="h-16 w-16 text-forest" />
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em]">Privacy Intact</h4>
                                        <p className="text-[10px] mt-1">This channel is end-to-end encrypted.</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, index) => {
                                    const isMine = m.sender_id === currentUser.id;
                                    const isNewSequence = index === 0 || messages[index-1].sender_id !== m.sender_id;
                                    
                                    return (
                                        <div key={m.id} className={cn(
                                            "flex flex-col",
                                            isMine ? "items-end" : "items-start",
                                            isNewSequence ? "mt-4" : "mt-0.5"
                                        )}>
                                            <div className={cn(
                                                "max-w-[85%] px-5 py-3 rounded-2xl text-[13px] font-semibold leading-relaxed transition-all shadow-sm border",
                                                isMine 
                                                    ? "bg-forest/90 text-white border-forest/20 rounded-tr-none shadow-forest/10" 
                                                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 rounded-tl-none shadow-slate-100 dark:shadow-none"
                                            )}>
                                                {m.content}
                                            </div>
                                            {(index === messages.length - 1 || messages[index+1].sender_id !== m.sender_id) && (
                                                <div className="flex items-center gap-1.5 mt-1.5 px-2 opacity-50">
                                                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                                                        {format(new Date(m.created_at), "h:mm a")}
                                                    </span>
                                                    {isMine && <CheckCheck className="h-3 w-3 text-forest" />}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Premium Floating Input */}
                        <div className="p-6 bg-white/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 backdrop-blur-md">
                            <form onSubmit={handleSend} className="relative flex items-center gap-3">
                                <div className="flex-1 relative flex items-center group">
                                    <div className="absolute inset-x-0 inset-y-0 bg-slate-100 dark:bg-slate-800/50 rounded-2xl transition-all group-focus-within:ring-2 ring-forest/20"></div>
                                    <button type="button" className="relative z-10 p-3 text-slate-400 hover:text-forest transition-colors ml-1 active:scale-90">
                                        <Paperclip className="h-5 w-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Secure message..."
                                        className="relative z-10 flex-1 bg-transparent border-none outline-none py-3 text-[13px] font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!input.trim() || sendMutation.isPending}
                                        className={cn(
                                            "relative z-10 mr-1.5 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                            input.trim() 
                                                ? "bg-forest text-white shadow-lg shadow-forest/30 scale-100 hover:scale-110 active:scale-95" 
                                                : "bg-slate-300 dark:bg-slate-700 text-white/50 scale-95 opacity-50"
                                        )}
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                            <div className="flex justify-center mt-4">
                                <div className="flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity cursor-default select-none">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Live Server Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
