"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeachers, getAllClasses } from "@/lib/api/classes";
import { getSupervisors } from "@/lib/api/supervisors";
import { Teacher, ClassSchedule } from "@/types/student";
import { Supervisor } from "@/types/supervisor";
import { 
    Calendar, 
    Clock, 
    Loader2, 
    Globe, 
    Users, 
    Zap, 
    ChevronRight,
    Search,
    Filter,
    ArrowRightLeft,
    Monitor,
    Play,
    UserCircle2,
    Shield,
    MoreVertical,
    Clock3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STALE_SHORT } from "@/lib/query-config";
import { ManageStudentDialog } from "@/components/dialogs/ManageStudentDialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ─── HELPERS ───────────────────────────────────────────────────

/** Converts "10:30 AM" to minutes from 00:00 */
const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (hours === 12) hours = 0;
    if (modifier?.toUpperCase() === "PM") hours += 12;
    return hours * 60 + minutes;
};

/** Get current time in Pakistan (UTC+5) as minutes from 00:00 */
const getCurrentPKMinutes = () => {
    const now = new Date();
    const pkTimeStr = now.toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour12: true });
    return timeToMinutes(pkTimeStr);
};

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHORT_DAYS: Record<string, string> = {
    Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
    Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export default function TimetablePage() {
    const queryClient = useQueryClient();
    const activeRef = useRef<HTMLDivElement>(null);
    
    // ─── Filters & Global State ─────────────────────────────────
    const [selectedDay, setSelectedDay] = useState<string>(() => {
        return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Karachi" }).format(new Date());
    });
    
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("All");
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("All");
    const [gridTimezone, setGridTimezone] = useState<"pk" | "uk">("pk");
    const [nowMinutes, setNowMinutes] = useState(getCurrentPKMinutes());

    // Update 'now' every minute
    useEffect(() => {
        const timer = setInterval(() => setNowMinutes(getCurrentPKMinutes()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Manage Dialog State
    const [manageStudentId, setManageStudentId] = useState<string | null>(null);
    const [isManageOpen, setIsManageOpen] = useState(false);

    // ─── Queries ────────────────────────────────────────────────
    const { data: teachers = [], isLoading: teachersLoading } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
        ...STALE_SHORT,
    });

    const { data: allClasses = [], isLoading: allClassesLoading } = useQuery({
        queryKey: ["allClasses"],
        queryFn: getAllClasses,
        ...STALE_SHORT,
    });

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    // ─── Data Grouping & Sorting ─────────────────────────────────
    const timeBlocks = useMemo(() => {
        // 1. Flatten and Filter
        const sessions = allClasses.filter((cls) => {
            if (!cls.schedule_days) return false;
            const days = Object.keys(cls.schedule_days).map(d => d.toLowerCase());
            if (!days.includes(selectedDay.toLowerCase())) return false;

            const teacher = teachers.find(t => t.id === cls.teacher_id);
            if (!teacher) return false;

            const matchesSup = selectedSupervisorId === "All" || teacher.supervisor_id === selectedSupervisorId;
            const matchesTeacher = selectedTeacherId === "All" || teacher.id === selectedTeacherId;
            
            return matchesSup && matchesTeacher;
        }).map(cls => {
            const teacher = teachers.find(t => t.id === cls.teacher_id);
            const supervisor = supervisors.find(s => s.id === teacher?.supervisor_id);
            return {
                ...cls,
                teacherName: teacher?.name || "Unknown",
                supervisorName: supervisor?.name || "Admin",
                startMinutes: timeToMinutes(cls.pak_start_time),
                endMinutes: timeToMinutes(cls.pak_end_time)
            };
        });

        // 2. Group by Start Time
        const groups: Record<string, any[]> = {};
        sessions.forEach(cls => {
            if (!groups[cls.pak_start_time]) groups[cls.pak_start_time] = [];
            groups[cls.pak_start_time].push(cls);
        });

        // 3. Convert to Array and Sort by Time
        return Object.entries(groups).map(([time, sessions]) => ({
            time,
            startMinutes: sessions[0].startMinutes,
            sessions: sessions.sort((a, b) => a.student?.full_name.localeCompare(b.student?.full_name || ""))
        })).sort((a, b) => a.startMinutes - b.startMinutes);
    }, [allClasses, teachers, supervisors, selectedDay, selectedSupervisorId, selectedTeacherId]);

    // ─── SCROLL TO RELEVANT BLOCK ───
    const currentBlockIdx = useMemo(() => {
        return timeBlocks.findIndex(block => {
            return block.sessions.some(cls => nowMinutes >= cls.startMinutes && nowMinutes < cls.endMinutes);
        });
    }, [timeBlocks, nowMinutes]);

    const nextBlockIdx = useMemo(() => {
        return timeBlocks.findIndex(block => block.startMinutes > nowMinutes);
    }, [timeBlocks, nowMinutes]);

    useEffect(() => {
        if (!allClassesLoading && !teachersLoading && activeRef.current) {
            const timer = setTimeout(() => {
                activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [allClassesLoading, teachersLoading, selectedDay]);

    if (teachersLoading || allClassesLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-30">
                <Loader2 className="size-10 animate-spin text-primary mb-6" />
                <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">Synchronizing Cluster...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative w-full mx-auto bg-[#fafafa] dark:bg-[#050505] p-6 lg:p-10 space-y-10 scroll-smooth">
            
            {/* ── HEADER ── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20 flex items-center gap-2">
                             <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                             High-Density Sync
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold border-border bg-card">
                            {timeBlocks.length} Groups Optimized
                        </Badge>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none">
                        Time <span className="text-primary italic">Table</span>
                    </h1>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                    <div className="p-4 rounded-3xl bg-card border border-border flex items-center gap-3 min-w-[180px] shadow-sm">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                             <Monitor className="size-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{selectedDay}</p>
                            <p className="text-lg font-black leading-none">{allClasses.length}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-3xl bg-card border border-border flex items-center gap-3 min-w-[180px] shadow-sm">
                        <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Clock className="size-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Base Time</p>
                            <p className="text-lg font-black leading-none">{gridTimezone === "pk" ? "🇵🇰 PKT" : "🇬🇧 UKT"}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── FILTER HUB ── */}
            <div className="sticky top-0 z-40 px-6 py-5 bg-background/80 backdrop-blur-3xl border border-border/80 rounded-[32px] shadow-2xl flex flex-col xl:flex-row items-center gap-6 transition-all">
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <div className="space-y-1.5 min-w-[170px] flex-1 xl:flex-none">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Level Lead</label>
                        <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
                            <SelectTrigger className="h-10 rounded-2xl border-border bg-accent/20 px-4 font-bold text-xs shadow-sm">
                                <Shield className="size-3.5 mr-2 text-primary" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border shadow-2xl">
                                <SelectItem value="All">Global Feed</SelectItem>
                                {supervisors.map((s: Supervisor) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 min-w-[170px] flex-1 xl:flex-none">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Faculty Member</label>
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                            <SelectTrigger className="h-10 rounded-2xl border-border bg-accent/20 px-4 font-bold text-xs shadow-sm">
                                <Search className="size-3.5 mr-2 text-primary" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border shadow-2xl">
                                <SelectItem value="All">All Teachers</SelectItem>
                                {teachers.map((t: Teacher) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="flex bg-accent/20 h-10 p-1 rounded-2xl border border-border w-full flex-wrap xl:min-w-[400px]">
                        {ALL_DAYS.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    "flex-1 h-full px-4 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    selectedDay === day 
                                        ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                                )}
                            >
                                {SHORT_DAYS[day]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <button 
                        onClick={() => setGridTimezone(gridTimezone === "pk" ? "uk" : "pk")}
                        className="flex-1 xl:flex-none h-10 px-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-sm"
                    >
                        <ArrowRightLeft className="size-3 text-primary" />
                        {gridTimezone === "pk" ? "🇵🇰 PKT" : "🇬🇧 UKT"}
                    </button>
                    <button 
                        onClick={() => { setSelectedSupervisorId("All"); setSelectedTeacherId("All"); }}
                        className="p-3 rounded-2xl bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all active:scale-90"
                    >
                        <Filter className="size-4" />
                    </button>
                </div>
            </div>

            {/* ── THE HOUR-BLOCK GRID ── */}
            <main className="space-y-12 pb-40">
                {timeBlocks.length === 0 ? (
                    <div className="py-40 flex flex-col items-center justify-center opacity-40">
                        <Calendar className="size-16 mb-6" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">Zero Sessions Detected for Parameters</p>
                    </div>
                ) : (
                    timeBlocks.map((block, bIdx) => {
                        const isBlockLive = block.sessions.some(cls => nowMinutes >= cls.startMinutes && nowMinutes < cls.endMinutes);
                        const isScrollTarget = currentBlockIdx !== -1 ? bIdx === currentBlockIdx : bIdx === nextBlockIdx;

                        return (
                            <div 
                                key={block.time} 
                                ref={isScrollTarget ? activeRef : null}
                                className="group/block flex flex-col lg:flex-row gap-8 lg:gap-16 pt-8 first:pt-0"
                            >
                                {/* Left Time Marker */}
                                <div className="lg:w-[120px] pt-1 flex items-center lg:items-start lg:flex-col gap-4">
                                    <div className={cn(
                                        "text-4xl font-black tracking-tighter leading-none shrink-0 transition-all duration-500",
                                        isBlockLive ? "text-emerald-500 scale-110" : "text-muted-foreground opacity-30 group-hover/block:opacity-100"
                                    )}>
                                        {block.time.split(" ")[0]}
                                        <span className="text-[12px] block mt-1 opacity-60 font-black">{block.time.split(" ")[1]}</span>
                                    </div>
                                    {isBlockLive && (
                                        <div className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse shadow-lg shadow-emerald-500/30">
                                            Live In-Progress
                                        </div>
                                    )}
                                </div>

                                {/* Right Sessions Grid */}
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                    {block.sessions.map((cls) => {
                                        const isSessionLive = nowMinutes >= cls.startMinutes && nowMinutes < cls.endMinutes;
                                        const isCompleted = nowMinutes >= cls.endMinutes;

                                        return (
                                            <button
                                                key={cls.id}
                                                onClick={() => { setManageStudentId(cls.student_id); setIsManageOpen(true); }}
                                                className={cn(
                                                    "relative p-4 rounded-[24px] border-2 transition-all duration-500 text-left overflow-hidden group/card active:scale-95",
                                                    isSessionLive 
                                                        ? "bg-emerald-500/[0.04] border-emerald-500/40 shadow-xl shadow-emerald-500/10" 
                                                        : isCompleted
                                                            ? "bg-accent/5 border-border/40 opacity-40 grayscale-[0.5]"
                                                            : "bg-card border-border hover:border-primary/40 hover:shadow-xl hover:scale-[1.02]"
                                                )}
                                            >
                                                {/* Card Header: Student */}
                                                <div className="space-y-2.5 relative z-10">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className={cn(
                                                            "text-xs font-black leading-tight tracking-tight",
                                                            isSessionLive ? "text-emerald-600" : "text-foreground"
                                                        )}>
                                                            {cls.student?.full_name}
                                                        </h3>
                                                        <div className="size-6 rounded-lg bg-accent flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                             <ChevronRight className="size-3.5" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5">
                                                        <Badge variant="outline" className="text-[8px] font-mono border-border bg-background px-1.5 h-4">
                                                            {cls.student?.reg_no || "REG"}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[8px] font-bold border-primary/20 text-primary bg-primary/5 px-1.5 h-4">
                                                            {cls.app_account?.platform || "PLAT"}
                                                        </Badge>
                                                    </div>

                                                    {/* Card Body: Faculty Trace */}
                                                    <div className="grid grid-cols-1 gap-2 pt-3 mt-3 border-t border-border/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-5 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                <UserCircle2 className="size-3" />
                                                            </div>
                                                            <p className="text-[9px] font-black text-muted-foreground truncate">{cls.teacherName}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-5 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                                                <Shield className="size-3" />
                                                            </div>
                                                            <p className="text-[9px] font-bold text-muted-foreground/60 truncate">Lead {cls.supervisorName}</p>
                                                        </div>
                                                    </div>

                                                    {/* Card Footer: Time Range */}
                                                    <div className="flex items-center gap-2 pt-2 text-[9px] font-black text-muted-foreground/40">
                                                        <Clock3 className="size-3" />
                                                        <span>
                                                            {cls.pak_start_time.split(" ")[0]} — {cls.pak_end_time}
                                                        </span>
                                                        <span className="ml-auto text-blue-500/40">UK: {cls.uk_start_time.split(" ")[0]}</span>
                                                    </div>
                                                </div>

                                                {/* Interaction Decor */}
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:opacity-10 transition-opacity">
                                                    <Zap className="size-12" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            <ManageStudentDialog
                studentId={manageStudentId}
                open={isManageOpen}
                onOpenChange={setIsManageOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["allClasses"] });
                    queryClient.invalidateQueries({ queryKey: ["teachers"] });
                }}
            />
        </div>
    );
}
