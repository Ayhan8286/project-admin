"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTodaySessions, startSession, endSession, ClassSession } from "@/lib/api/sessions";
import { 
    Clock, 
    Video, 
    Play, 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    MoreHorizontal, 
    StickyNote, 
    User,
    BookOpen,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeacherScheduleProps {
    teacherId: string;
}

export function TeacherSchedule({ teacherId }: TeacherScheduleProps) {
    const queryClient = useQueryClient();
    const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
    const [notes, setNotes] = useState("");
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    const { data: sessions = [], isLoading, refetch } = useQuery({
        queryKey: ["today-sessions", teacherId],
        queryFn: () => getTodaySessions(teacherId),
    });

    const startMutation = useMutation({
        mutationFn: ({ classId, studentId }: { classId: string, studentId: string }) => 
            startSession(classId, teacherId, studentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["today-sessions", teacherId] });
        }
    });

    const endMutation = useMutation({
        mutationFn: ({ sessionId, notes, status }: { sessionId: string, notes: string, status: any }) => 
            endSession(sessionId, notes, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["today-sessions", teacherId] });
            setIsNotesOpen(false);
            setNotes("");
            setSelectedSession(null);
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading your schedule...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black tracking-tight">Today's Schedule</h2>
                <p className="text-muted-foreground font-medium">
                    {format(new Date(), "EEEE, MMMM do, yyyy")} • {sessions.length} Classes Today
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {sessions.length === 0 ? (
                    <div className="p-12 rounded-3xl border border-dashed border-border bg-accent/5 flex flex-col items-center justify-center text-center">
                        <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold">No Classes Scheduled</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">You don't have any classes assigned for today.</p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div 
                            key={session.id}
                            className={cn(
                                "group relative p-6 rounded-[32px] border transition-all duration-300",
                                session.status === "Completed" 
                                    ? "bg-green-500/5 border-green-500/20" 
                                    : session.status === "Missed"
                                        ? "bg-red-500/5 border-red-500/20"
                                        : "bg-card border-border hover:border-primary/30 shadow-sm"
                            )}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                                        session.status === "Completed" ? "bg-green-500/10" : "bg-primary/10"
                                    )}>
                                        <User className={cn(
                                            "h-7 w-7",
                                            session.status === "Completed" ? "text-green-600" : "text-primary"
                                        )} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-lg">{session.student?.full_name}</h3>
                                            <span className="text-[10px] font-mono font-bold bg-accent px-2 py-0.5 rounded-full text-muted-foreground">
                                                {session.student?.reg_no}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                {session.class?.course?.name || "No Course"}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                {session.class?.pak_start_time} - {session.class?.pak_end_time}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {session.class?.app_account?.meeting_link && (
                                        <a 
                                            href={session.class.app_account.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-black rounded-2xl text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            <Video className="h-4 w-4" />
                                            Join Meeting
                                        </a>
                                    )}

                                    {session.status === "Scheduled" && !session.start_time && (
                                        <button 
                                            onClick={() => startMutation.mutate({ classId: session.class_id, studentId: session.student_id })}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white font-black rounded-2xl text-xs hover:bg-forest/90 transition-all shadow-lg shadow-forest/20"
                                        >
                                            <Play className="h-4 w-4 fill-current" />
                                            Start Class
                                        </button>
                                    )}

                                    {session.status === "Scheduled" && session.start_time && (
                                        <button 
                                            onClick={() => {
                                                setSelectedSession(session);
                                                setIsNotesOpen(true);
                                            }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-black rounded-2xl text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            End Class
                                        </button>
                                    )}

                                    {session.status !== "Scheduled" && (
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black",
                                            session.status === "Completed" ? "bg-green-500/10 text-green-600" :
                                            session.status === "Missed" ? "bg-red-500/10 text-red-600" :
                                            "bg-blue-500/10 text-blue-600"
                                        )}>
                                            {session.status === "Completed" && <CheckCircle2 className="h-4 w-4" />}
                                            {session.status === "Missed" && <XCircle className="h-4 w-4" />}
                                            {session.status === "Rescheduled" && <RefreshCcw className="h-4 w-4" />}
                                            {session.status}
                                        </div>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-2.5 hover:bg-accent rounded-xl transition-colors">
                                                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl p-1 w-48">
                                            <DropdownMenuItem 
                                                className="rounded-xl font-bold text-xs"
                                                onClick={() => {
                                                    setSelectedSession(session);
                                                    setNotes(session.notes || "");
                                                    setIsNotesOpen(true);
                                                }}
                                            >
                                                <StickyNote className="h-4 w-4 mr-2" />
                                                {session.status === "Scheduled" ? "Class Actions" : "View/Edit Notes"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* End Class / Notes Dialog */}
            <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[32px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            {selectedSession?.status === "Scheduled" ? "End Class Session" : "Session Notes"}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground font-medium">
                            {selectedSession?.student?.full_name} • {selectedSession?.class?.course?.name}
                        </p>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Class Status</label>
                            <div className="flex gap-2">
                                {(["Completed", "Missed", "Rescheduled"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedSession(prev => prev ? { ...prev, status: s } : null)}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all",
                                            selectedSession?.status === s 
                                                ? "bg-primary text-primary-foreground border-primary" 
                                                : "bg-accent/30 border-border text-muted-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Class Notes / Progress Update</label>
                            <textarea 
                                className="w-full min-h-[120px] p-4 rounded-2xl bg-accent/20 border-border focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm font-medium"
                                placeholder="What was covered today? Any specific student feedback?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <button 
                            onClick={() => setIsNotesOpen(false)}
                            className="px-6 py-2.5 font-bold text-sm rounded-full hover:bg-accent transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => endMutation.mutate({ 
                                sessionId: selectedSession!.id, 
                                notes, 
                                status: selectedSession!.status 
                            })}
                            disabled={endMutation.isPending || (selectedSession?.id.startsWith('mock-') && !selectedSession.start_time)}
                            className="px-8 py-2.5 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {endMutation.isPending ? "Saving..." : "Save Session"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
