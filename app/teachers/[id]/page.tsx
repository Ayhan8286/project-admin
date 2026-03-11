"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTeacherById, getTeacherClasses, addClass, updateClass, deleteClass, deleteTeacher } from "@/lib/api/classes";
import { toast } from "sonner";
import { getStudents } from "@/lib/api/students";
import { Teacher, ClassSchedule } from "@/types/student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { Calendar, Users, Clock, Plus, Edit, Trash2, ArrowLeft, Globe } from "lucide-react";
import { AddStudentDialog } from "@/components/dialogs/AddStudentDialog";
import { cn } from "@/lib/utils";

// ─── Time Helpers ─────────────────────────────────────────────
const START_HOUR = 12; // 12 PM
const END_HOUR = 30;   // 6 AM next day
const HOUR_WIDTH = 140; // px per hour
const TOTAL_WIDTH = (END_HOUR - START_HOUR + 1) * HOUR_WIDTH;

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHORT_DAYS: Record<string, string> = {
    Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
    Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
    Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun",
};

// Normalize day names to full form
function normalizeDay(d: string): string {
    const lower = d.trim().toLowerCase();
    for (const full of ALL_DAYS) {
        if (full.toLowerCase() === lower || full.toLowerCase().startsWith(lower.slice(0, 3))) {
            return full;
        }
    }
    return d.trim();
}

function timeToDecimal(timeStr: string): number {
    if (!timeStr) return 0;
    // 24h format fallback
    if (!timeStr.includes(" ") && !timeStr.toLowerCase().includes("m")) {
        const [h, m] = timeStr.split(":").map(Number);
        const dec = h + (m || 0) / 60;
        return dec < 12 ? dec + 24 : dec;
    }
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (hours === 12) hours = 0;
    if (modifier && modifier.toUpperCase() === "PM") hours += 12;
    let dec = hours + (minutes || 0) / 60;
    if (dec < 12) dec += 24;
    return dec;
}

function formatDisplayHour(hour: number): string {
    const n = hour % 24;
    const h = Math.floor(n);
    const ampm = h >= 12 ? "PM" : "AM";
    const display = h % 12 || 12;
    return `${display} ${ampm}`;
}

// ─── PKT → UKT Conversion ────────────────────────────────────
// PKT = UTC+5, UKT = UTC+0 → subtract 5 hours
function convertPkToUk(pkTime: string): string {
    if (!pkTime || !pkTime.trim()) return "";
    // Parse "h:mm AM/PM" format
    const match = pkTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return ""; // can't parse, leave blank
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    // Convert to 24h
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Subtract 5 hours
    hours -= 5;
    if (hours < 0) hours += 24;

    // Convert back to 12h
    const ukPeriod = hours >= 12 ? "PM" : "AM";
    let displayH = hours % 12;
    if (displayH === 0) displayH = 12;

    return `${displayH}:${minutes} ${ukPeriod}`;
}

// Block colors (cycle per student for visual distinction)
const BLOCK_COLORS = [
    { bg: "rgba(139,92,246,0.25)", border: "rgba(139,92,246,0.5)", text: "#c4b5fd", glow: "rgba(139,92,246,0.2)" },
    { bg: "rgba(16,185,129,0.25)", border: "rgba(16,185,129,0.5)", text: "#6ee7b7", glow: "rgba(16,185,129,0.2)" },
    { bg: "rgba(59,130,246,0.25)", border: "rgba(59,130,246,0.5)", text: "#93c5fd", glow: "rgba(59,130,246,0.2)" },
    { bg: "rgba(245,158,11,0.25)", border: "rgba(245,158,11,0.5)", text: "#fcd34d", glow: "rgba(245,158,11,0.2)" },
    { bg: "rgba(236,72,153,0.25)", border: "rgba(236,72,153,0.5)", text: "#f9a8d4", glow: "rgba(236,72,153,0.2)" },
    { bg: "rgba(99,102,241,0.25)", border: "rgba(99,102,241,0.5)", text: "#a5b4fc", glow: "rgba(99,102,241,0.2)" },
];

function getColorForIndex(i: number) {
    return BLOCK_COLORS[i % BLOCK_COLORS.length];
}

// ─── Component ────────────────────────────────────────────────
export default function TeacherProfilePage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const teacherId = params.id as string;

    // State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [timezone, setTimezone] = useState<"pk" | "uk">("pk");

    // Add form — days as Set
    const [addForm, setAddForm] = useState({
        student_id: "",
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
        selectedDays: new Set<string>(),
    });

    // Edit form — days as Set
    const [editForm, setEditForm] = useState({
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
        selectedDays: new Set<string>(),
    });

    // Queries
    const { data: teacher, isLoading: teacherLoading, error: teacherError } = useQuery({
        queryKey: ["teacher", teacherId],
        queryFn: () => getTeacherById(teacherId),
    });

    const { data: teacherClasses = [], isLoading: classesLoading } = useQuery({
        queryKey: ["teacherClasses", teacherId],
        queryFn: () => getTeacherClasses(teacherId),
    });

    const { data: students = [] } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    // Mutations
    const addClassMutation = useMutation({
        mutationFn: (newClass: any) => addClass(newClass),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses", teacherId] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
            setIsAddOpen(false);
            setAddForm({ student_id: "", pak_start_time: "", pak_end_time: "", uk_start_time: "", uk_end_time: "", selectedDays: new Set() });
        },
    });

    const updateClassMutation = useMutation({
        mutationFn: (updates: any) =>
            selectedClassId ? updateClass(selectedClassId, updates) : Promise.reject("No class selected"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses", teacherId] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
            setIsEditOpen(false);
        },
    });

    const deleteClassMutation = useMutation({
        mutationFn: (id: string) => deleteClass(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses", teacherId] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
        },
    });

    const deleteTeacherMutation = useMutation({
        mutationFn: deleteTeacher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            router.push('/teachers');
        }
    });

    // ─── Handlers ─────────────────────────────────────────────
    function daysSetToRecord(days: Set<string>): Record<string, string> {
        const obj: Record<string, string> = {};
        days.forEach(d => { obj[d] = "Class"; });
        return obj;
    }

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addClassMutation.mutate({
            teacher_id: teacherId,
            student_id: addForm.student_id,
            pak_start_time: addForm.pak_start_time,
            pak_end_time: addForm.pak_end_time,
            uk_start_time: addForm.uk_start_time,
            uk_end_time: addForm.uk_end_time,
            schedule_days: daysSetToRecord(addForm.selectedDays),
        });
    };

    const handleEditClick = (cls: any) => {
        setSelectedClassId(cls.id);
        const days = new Set<string>(
            cls.schedule_days ? Object.keys(cls.schedule_days).map(normalizeDay) : []
        );
        setEditForm({
            pak_start_time: cls.pak_start_time,
            pak_end_time: cls.pak_end_time,
            uk_start_time: cls.uk_start_time,
            uk_end_time: cls.uk_end_time,
            selectedDays: days,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateClassMutation.mutate({
            pak_start_time: editForm.pak_start_time,
            pak_end_time: editForm.pak_end_time,
            uk_start_time: editForm.uk_start_time,
            uk_end_time: editForm.uk_end_time,
            schedule_days: daysSetToRecord(editForm.selectedDays),
        });
    };

    const handleDeleteClick = (id: string) => {
        if (confirm("Are you sure you want to remove this student from the class?")) {
            deleteClassMutation.mutate(id);
        }
    };

    const handleDeleteTeacher = () => {
        if (!teacher) return;
        if (window.confirm(`Are you sure you want to delete teacher ${teacher.name}? This action cannot be undone.`)) {
            deleteTeacherMutation.mutate(teacherId);
        }
    };

    // ─── Schedule summary ─────────────────────────────────────
    const scheduleSummary = teacherClasses.reduce((acc: Record<string, number>, cls: ClassSchedule) => {
        if (cls.schedule_days) {
            Object.keys(cls.schedule_days).forEach((day) => {
                const norm = normalizeDay(day);
                if (!acc[norm]) acc[norm] = 0;
                acc[norm]++;
            });
        }
        return acc;
    }, {} as Record<string, number>);

    // Build a student color map for consistent colors
    const studentColorMap = new Map<string, typeof BLOCK_COLORS[0]>();
    let colorIndex = 0;
    teacherClasses.forEach((cls: ClassSchedule) => {
        if (!studentColorMap.has(cls.student_id)) {
            studentColorMap.set(cls.student_id, getColorForIndex(colorIndex++));
        }
    });

    // Group classes by day for the weekly grid
    const classesByDay: Record<string, (ClassSchedule & { student?: any })[]> = {};
    ALL_DAYS.forEach(d => { classesByDay[d] = []; });
    teacherClasses.forEach((cls: ClassSchedule & { student?: any }) => {
        if (cls.schedule_days) {
            Object.keys(cls.schedule_days).forEach(day => {
                const norm = normalizeDay(day);
                if (classesByDay[norm]) {
                    classesByDay[norm].push(cls);
                }
            });
        }
    });

    // ─── Loading / Error ──────────────────────────────────────
    if (teacherLoading) {
        return (
            <div className="space-y-6 p-4">
                <LoadingShimmer rows={3} rowHeight="h-20" />
            </div>
        );
    }

    if (teacherError || !teacher) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <p className="text-xl text-slate-400">Teacher not found</p>
                <Button variant="outline" asChild>
                    <Link href="/teachers">Back to Teachers</Link>
                </Button>
            </div>
        );
    }

    // Hours array for grid
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
                {/* ── Header ── */}
                <div className="flex items-center gap-4">
                    <Link href="/teachers">
                        <button className="rounded-full border border-border hover:border-primary/30 p-2 transition-all text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-0.5">Teacher Profile</p>
                        <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
                            {teacher.name}
                            <span className="text-primary ml-2 text-2xl">✦</span>
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Staff ID: {teacher.staff_id} · View and manage assigned classes.</p>
                    </div>
                    <div className="ml-auto">
                        <button
                            onClick={handleDeleteTeacher}
                            disabled={deleteTeacherMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 font-bold rounded-full text-sm transition-all disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Teacher
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Overview</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: "Total Students", value: teacherClasses.length, sub: "Assigned classes", accent: "#13ec37", Icon: Users },
                        { label: "Teaching Days", value: Object.keys(scheduleSummary).length, sub: Object.entries(scheduleSummary).map(([day, count]) => `${SHORT_DAYS[day] || day}: ${count}`).join(', ') || 'No schedule yet', accent: "#a855f7", Icon: Calendar },
                        {
                            label: "Hours/Week",
                            value: Number(teacherClasses.reduce((total: number, cls: ClassSchedule) => {
                                if (!cls.pak_start_time || !cls.pak_end_time || !cls.schedule_days) return total;
                                const start = timeToDecimal(cls.pak_start_time);
                                let end = timeToDecimal(cls.pak_end_time);
                                if (end < start) end += 24;
                                const duration = end - start;
                                const daysCount = Object.keys(cls.schedule_days).length;
                                return total + (duration * daysCount);
                            }, 0).toFixed(1)),
                            sub: "Estimated weekly hours",
                            accent: "#3b82f6",
                            Icon: Clock
                        },
                    ].map(({ label, value, sub, accent, Icon }, i) => (
                        <div key={i} className="card-hover relative bg-card rounded-3xl p-5 border border-border overflow-hidden group flex flex-col gap-3">
                            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" style={{ background: accent }} />
                            <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${accent}18` }}>
                                <Icon className="h-5 w-5" style={{ color: accent }} />
                            </div>
                            <div className="relative">
                                <p className="text-3xl font-black tracking-tight" style={{ color: accent }}>{value}</p>
                                <p className="text-[11px] font-bold text-foreground mt-1.5">{label}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Timetable Section ── */}
                <Tabs defaultValue="schedule" className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <TabsList className="bg-slate-100 dark:bg-[#1a331d] p-1 rounded-xl">
                            <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                Visual Schedule
                            </TabsTrigger>
                            <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-foreground">
                                <Clock className="h-4 w-4 mr-2" />
                                Class List
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2">
                            {/* Timezone toggle */}
                            <div className="flex rounded-full overflow-hidden border border-border bg-card p-1">
                                <button
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200",
                                        timezone === "pk"
                                            ? "bg-primary/15 text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setTimezone("pk")}
                                >
                                    🇵🇰 PKT
                                </button>
                                <button
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200",
                                        timezone === "uk"
                                            ? "bg-primary/15 text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setTimezone("uk")}
                                >
                                    🇬🇧 UKT
                                </button>
                            </div>


                            <button onClick={() => setIsCreateStudentOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm font-bold hover:border-primary/30 transition-all text-foreground">
                                <Plus className="h-4 w-4" />
                                Create Student
                            </button>
                            <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all shrink-0">
                                <Plus className="h-4 w-4" />
                                Assign Class
                            </button>
                        </div>
                    </div>

                    {/* ══════ TAB: Visual Schedule ══════ */}
                    <TabsContent value="schedule">
                        <div className="bg-card rounded-3xl border border-border overflow-hidden">
                            <div className="p-0">
                                {classesLoading ? (
                                    <div className="p-6"><LoadingShimmer rows={7} rowHeight="h-12" /></div>
                                ) : teacherClasses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                        <Calendar className="h-10 w-10 mb-3 opacity-40" />
                                        <p className="text-lg font-medium">No classes assigned</p>
                                        <p className="text-sm mt-1">Click "Assign Class" to get started.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <div style={{ minWidth: `${TOTAL_WIDTH + 140}px` }}>
                                            {/* ── Timeline Header ── */}
                                            <div className="flex border-b border-white/8 glass-table-header">
                                                <div className="w-[140px] flex-shrink-0 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r border-border flex items-center gap-1.5">
                                                    <Globe className="h-3.5 w-3.5" />
                                                    {timezone === "pk" ? "PKT" : "UKT"}
                                                </div>
                                                <div className="flex-1 flex">
                                                    {hours.map((hour) => (
                                                        <div
                                                            key={hour}
                                                            style={{ width: `${HOUR_WIDTH}px` }}
                                                            className="flex-shrink-0 p-2 text-[10px] font-medium text-center text-muted-foreground border-r border-border/50 last:border-r-0 uppercase"
                                                        >
                                                            {formatDisplayHour(hour)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ── Day Rows ── */}
                                            {ALL_DAYS.map((day) => {
                                                const dayClasses = classesByDay[day];
                                                const hasClasses = dayClasses.length > 0;

                                                return (
                                                    <div
                                                        key={day}
                                                        className={cn(
                                                            "flex h-[52px] border-b border-border last:border-b-0 transition-colors",
                                                            hasClasses && "hover:bg-accent/50"
                                                        )}
                                                    >
                                                        {/* Day label */}
                                                        <div className="w-[140px] flex-shrink-0 px-3 flex items-center border-r border-border">
                                                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                                                                {day}
                                                            </span>
                                                            {hasClasses && (
                                                                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                                                                    {dayClasses.length}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Timeline area */}
                                                        <div className="flex-1 relative">
                                                            {/* Hour grid lines */}
                                                            <div className="absolute inset-0 flex pointer-events-none">
                                                                {hours.map((hour) => (
                                                                    <div
                                                                        key={hour}
                                                                        style={{ width: `${HOUR_WIDTH}px` }}
                                                                        className="flex-shrink-0 border-r border-border/30 last:border-r-0"
                                                                    />
                                                                ))}
                                                            </div>

                                                            {/* Class blocks */}
                                                            {dayClasses.map((cls) => {
                                                                // Fall back to PK times if UK times are missing
                                                                const hasPkTime = !!cls.pak_start_time && !!cls.pak_end_time;
                                                                const hasUkTime = !!cls.uk_start_time && !!cls.uk_end_time;
                                                                const useUk = timezone === "uk" && hasUkTime;
                                                                const startTime = useUk ? cls.uk_start_time : cls.pak_start_time;
                                                                const endTime = useUk ? cls.uk_end_time : cls.pak_end_time;
                                                                const isFallback = timezone === "uk" && !hasUkTime;
                                                                const start = timeToDecimal(startTime);
                                                                const end = timeToDecimal(endTime);

                                                                if (!startTime || !endTime || end <= START_HOUR || start >= END_HOUR) return null;

                                                                const leftPx = Math.max(0, (start - START_HOUR)) * HOUR_WIDTH;
                                                                const widthPx = Math.max(30, (end - start) * HOUR_WIDTH);
                                                                const color = studentColorMap.get(cls.student_id) || BLOCK_COLORS[0];
                                                                const studentName = cls.student?.full_name || "Unknown";

                                                                return (
                                                                    <div
                                                                        key={`${day}-${cls.id}`}
                                                                        className="absolute top-1.5 bottom-1.5 rounded-md z-10 hover:z-50 hover:scale-[1.03] transition-all duration-200 cursor-pointer flex items-center px-2.5 overflow-hidden group/block backdrop-blur-sm"
                                                                        onClick={() => cls.student?.id && router.push(`/students/${cls.student.id}`)}
                                                                        style={{
                                                                            left: `${leftPx}px`,
                                                                            width: `${widthPx}px`,
                                                                            background: color.bg,
                                                                            borderLeft: `3px solid ${color.border}`,
                                                                            boxShadow: `0 0 12px ${color.glow}`,
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-[11px] font-bold truncate leading-tight" style={{ color: color.text }}>
                                                                                {studentName}
                                                                            </span>
                                                                            {widthPx > 80 && (
                                                                                <span className="text-[9px] text-muted-foreground truncate">
                                                                                    {startTime} – {endTime}{isFallback ? " (PK)" : ""}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* ── Hover Tooltip ── */}
                                                                        <div className="absolute opacity-0 group-hover/block:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] p-3 rounded-lg shadow-2xl pointer-events-none transition-opacity duration-200 z-[100] bg-card border border-border">
                                                                            <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                                                                                <span className="font-bold text-sm" style={{ color: color.text }}>{studentName}</span>
                                                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                                            </div>
                                                                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                                                                                <span className="text-muted-foreground">Reg No</span>
                                                                                <span className="font-mono text-foreground">{cls.student?.reg_no || "—"}</span>
                                                                                <span className="text-muted-foreground">🇵🇰 PK</span>
                                                                                <span className="text-foreground">{cls.pak_start_time} – {cls.pak_end_time}</span>
                                                                                <span className="text-muted-foreground">🇬🇧 UK</span>
                                                                                <span className="text-foreground">{cls.uk_start_time} – {cls.uk_end_time}</span>
                                                                                <span className="text-muted-foreground">Days</span>
                                                                                <span className="text-foreground">{cls.schedule_days ? Object.keys(cls.schedule_days).join(", ") : "—"}</span>
                                                                            </div>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-card"></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ══════ TAB: Class List (existing CRUD table) ══════ */}
                    <TabsContent value="list">
                        <div className="bg-card rounded-3xl border border-border overflow-hidden">
                            <div className="p-6">
                                {classesLoading ? (
                                    <LoadingShimmer rows={5} rowHeight="h-14" />
                                ) : teacherClasses.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-10">No classes assigned to this teacher.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-[11px] font-black uppercase tracking-wider">Student</TableHead>
                                                <TableHead className="text-[11px] font-black uppercase tracking-wider">Reg. No.</TableHead>
                                                <TableHead className="text-[11px] font-black uppercase tracking-wider">PK Time</TableHead>
                                                <TableHead className="text-[11px] font-black uppercase tracking-wider">UK Time</TableHead>
                                                <TableHead className="text-[11px] font-black uppercase tracking-wider">Schedule Days</TableHead>
                                                <TableHead className="w-[80px] text-[11px] font-black uppercase tracking-wider">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {teacherClasses.map((cls: ClassSchedule & { student: { id: string; full_name: string; reg_no: string } }) => (
                                                <TableRow key={cls.id}>
                                                    <TableCell className="font-medium">
                                                        <Link href={`/students/${cls.student?.id}`} className="hover:underline text-primary font-bold">
                                                            {cls.student?.full_name || "Unknown"}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm text-muted-foreground">{cls.student?.reg_no || "—"}</TableCell>
                                                    <TableCell className="text-sm font-semibold text-foreground">{cls.pak_start_time} – {cls.pak_end_time}</TableCell>
                                                    <TableCell className="text-sm font-semibold text-foreground">{cls.uk_start_time} – {cls.uk_end_time}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {cls.schedule_days && Object.keys(cls.schedule_days).map((day) => (
                                                                <Badge key={day} variant="default" className="text-[10px]">
                                                                    {SHORT_DAYS[day] || day}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <button className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={() => handleEditClick(cls)}>
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all" onClick={() => handleDeleteClick(cls.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* ══════ Add Class Dialog ══════ */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-[520px] rounded-3xl border-border bg-card">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">Assign Student to Class</DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Add a new class schedule for {teacher.name}</p>
                        </DialogHeader>
                        <form onSubmit={handleAddSubmit} className="space-y-5 pt-2">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student</p>
                                <Select onValueChange={(val) => setAddForm({ ...addForm, student_id: val })}>
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                        <SelectValue placeholder="Select Student" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {students.map((student: any) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.full_name} ({student.reg_no})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3 border-t border-border pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">🇵🇰 Pakistan Time</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">PK Start</label>
                                        <input value={addForm.pak_start_time} onChange={e => {
                                            const pk = e.target.value;
                                            setAddForm(f => ({ ...f, pak_start_time: pk, uk_start_time: convertPkToUk(pk) || f.uk_start_time }));
                                        }} placeholder="e.g. 2:00 PM" required className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">PK End</label>
                                        <input value={addForm.pak_end_time} onChange={e => {
                                            const pk = e.target.value;
                                            setAddForm(f => ({ ...f, pak_end_time: pk, uk_end_time: convertPkToUk(pk) || f.uk_end_time }));
                                        }} placeholder="e.g. 3:00 PM" required className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 border-t border-border pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">🇬🇧 UK Time <span className="normal-case font-normal text-primary/60">⚡ auto-filled</span></p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">UK Start</label>
                                        <input value={addForm.uk_start_time} onChange={e => setAddForm({ ...addForm, uk_start_time: e.target.value })} placeholder="e.g. 9:00 AM" className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">UK End</label>
                                        <input value={addForm.uk_end_time} onChange={e => setAddForm({ ...addForm, uk_end_time: e.target.value })} placeholder="e.g. 10:00 AM" className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 border-t border-border pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schedule Days</p>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_DAYS.map((day) => {
                                        const selected = addForm.selectedDays.has(day);
                                        return (
                                            <button key={day} type="button"
                                                onClick={() => {
                                                    const next = new Set(addForm.selectedDays);
                                                    if (selected) next.delete(day); else next.add(day);
                                                    setAddForm({ ...addForm, selectedDays: next });
                                                }}
                                                className={cn("px-3 py-2 rounded-full text-xs font-black border transition-all",
                                                    selected ? "bg-primary/15 text-primary border-primary/40" : "bg-accent/30 text-muted-foreground border-border hover:bg-accent"
                                                )}>
                                                {SHORT_DAYS[day]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={addClassMutation.isPending}
                                    className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20">
                                    {addClassMutation.isPending ? "Assigning..." : "Assign Student"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ══════ Edit Class Dialog ══════ */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[520px] rounded-3xl border-border bg-card">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">Edit Class Schedule</DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Adjust timings and schedule days.</p>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-5 pt-2">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">🇵🇰 Pakistan Time</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">PK Start</label>
                                        <input value={editForm.pak_start_time} onChange={e => {
                                            const pk = e.target.value;
                                            setEditForm(f => ({ ...f, pak_start_time: pk, uk_start_time: convertPkToUk(pk) || f.uk_start_time }));
                                        }} required className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">PK End</label>
                                        <input value={editForm.pak_end_time} onChange={e => {
                                            const pk = e.target.value;
                                            setEditForm(f => ({ ...f, pak_end_time: pk, uk_end_time: convertPkToUk(pk) || f.uk_end_time }));
                                        }} required className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 border-t border-border pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">🇬🇧 UK Time <span className="normal-case font-normal text-primary/60">⚡ auto-filled</span></p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">UK Start</label>
                                        <input value={editForm.uk_start_time} onChange={e => setEditForm({ ...editForm, uk_start_time: e.target.value })} className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">UK End</label>
                                        <input value={editForm.uk_end_time} onChange={e => setEditForm({ ...editForm, uk_end_time: e.target.value })} className="w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 border-t border-border pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schedule Days</p>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_DAYS.map((day) => {
                                        const selected = editForm.selectedDays.has(day);
                                        return (
                                            <button key={day} type="button"
                                                onClick={() => {
                                                    const next = new Set(editForm.selectedDays);
                                                    if (selected) next.delete(day); else next.add(day);
                                                    setEditForm({ ...editForm, selectedDays: next });
                                                }}
                                                className={cn("px-3 py-2 rounded-full text-xs font-black border transition-all",
                                                    selected ? "bg-primary/15 text-primary border-primary/40" : "bg-accent/30 text-muted-foreground border-border hover:bg-accent"
                                                )}>
                                                {SHORT_DAYS[day]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={updateClassMutation.isPending}
                                    className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20">
                                    {updateClassMutation.isPending ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <AddStudentDialog
                    open={isCreateStudentOpen}
                    onOpenChange={setIsCreateStudentOpen}
                    defaultTeacherId={teacherId}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["teacherClasses", teacherId] });
                        queryClient.invalidateQueries({ queryKey: ["allClasses"] });
                        queryClient.invalidateQueries({ queryKey: ["students"] });
                    }}
                />
            </div>
        </div>
    );
}
