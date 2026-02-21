"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTeachers, getAllClasses, getAllTeacherAvailability, deleteTeacher } from "@/lib/api/classes";
import { Teacher, ClassSchedule, TeacherAvailability } from "@/types/student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Clock, Loader2, CheckCircle2, Plus, Edit, Trash2, Search, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Time range: 12 PM (noon) to 6 AM (next day) -> Displayed as 12 to 30
// 19 hour span (including end hour)
const START_HOUR = 12; // 12 PM
const END_HOUR = 30;   // 6 AM (next day)
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Width configuration
const HOUR_WIDTH = 160; // Pixels per hour
const TOTAL_WIDTH = (END_HOUR - START_HOUR + 1) * HOUR_WIDTH; // ~3000px

// Helper to convert "h:mm A" string to decimal hours (0-23.99)
const timeToDecimal = (timeStr: string) => {
    if (!timeStr) return 0;

    // Check format (basic check)
    if (!timeStr.includes(" ") && !timeStr.toLowerCase().includes("m")) {
        // Fallback for 24h format if needed
        const [h, m] = timeStr.split(":").map(Number);
        const dec = h + m / 60;
        return dec < 12 ? dec + 24 : dec;
    }

    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (hours === 12) {
        hours = 0;
    }
    if (modifier && modifier.toUpperCase() === "PM") {
        hours += 12;
    }

    let decimalTime = hours + minutes / 60;

    // Shift logic: If time represents early morning (0 AM - 11 AM), 
    // treat it as "next day" for the visualization (24 - 35)
    if (decimalTime < 12) {
        decimalTime += 24;
    }

    return decimalTime;
};

// Helper to format display hour
const formatDisplayHour = (hour: number) => {
    const normalized = hour % 24;
    const h = Math.floor(normalized);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH} ${ampm}`;
};

// Helper to check if a class falls within our display range
const isClassVisible = (start: number, end: number) => {
    return end > START_HOUR && start < END_HOUR;
};

// PKT → UKT helper (same as teacher profile)
function convertPkToUk(pkTime: string): string {
    if (!pkTime || !pkTime.trim()) return "";
    const match = pkTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "";
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    hours -= 5;
    if (hours < 0) hours += 24;
    const ukPeriod = hours >= 12 ? "PM" : "AM";
    let displayH = hours % 12;
    if (displayH === 0) displayH = 12;
    return `${displayH}:${minutes} ${ukPeriod}`;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHORT_DAYS: Record<string, string> = {
    Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
    Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

function normalizeDay(d: string): string {
    const lower = d.trim().toLowerCase();
    for (const full of ALL_DAYS) {
        if (full.toLowerCase() === lower || full.toLowerCase().startsWith(lower.slice(0, 3))) return full;
    }
    return d.trim();
}

// Block colors per student
const BLOCK_COLORS = [
    { bg: "rgba(139,92,246,0.30)", border: "rgba(139,92,246,0.6)", text: "#c4b5fd", glow: "rgba(139,92,246,0.2)" },
    { bg: "rgba(16,185,129,0.30)", border: "rgba(16,185,129,0.6)", text: "#6ee7b7", glow: "rgba(16,185,129,0.2)" },
    { bg: "rgba(59,130,246,0.30)", border: "rgba(59,130,246,0.6)", text: "#93c5fd", glow: "rgba(59,130,246,0.2)" },
    { bg: "rgba(245,158,11,0.30)", border: "rgba(245,158,11,0.6)", text: "#fcd34d", glow: "rgba(245,158,11,0.2)" },
    { bg: "rgba(236,72,153,0.30)", border: "rgba(236,72,153,0.6)", text: "#f9a8d4", glow: "rgba(236,72,153,0.2)" },
    { bg: "rgba(99,102,241,0.30)", border: "rgba(99,102,241,0.6)", text: "#a5b4fc", glow: "rgba(99,102,241,0.2)" },
];
function getBlockColor(i: number) { return BLOCK_COLORS[i % BLOCK_COLORS.length]; }

import { AddTeacherDialog } from "@/components/teachers/AddTeacherDialog";

export default function TeachersPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string>("Monday");
    const [gridTimezone, setGridTimezone] = useState<"pk" | "uk">("pk");

    const { data: teachers = [], isLoading: teachersLoading } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
    });

    const { data: allClasses = [], isLoading: allClassesLoading } = useQuery({
        queryKey: ["allClasses"],
        queryFn: getAllClasses,
    });

    const { data: allAvailability = [], isLoading: availabilityLoading } = useQuery({
        queryKey: ["allAvailability"],
        queryFn: getAllTeacherAvailability,
    });

    const deleteTeacherMutation = useMutation({
        mutationFn: deleteTeacher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
        }
    });

    const filteredTeachers = teachers.filter((teacher: Teacher) =>
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        teacher.staff_id.toLowerCase().includes(teacherSearchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teachers & Schedule</h1>
                    <p className="text-muted-foreground">
                        Manage teacher assignments and view availability.
                    </p>
                </div>
                <Button className="gap-2" onClick={() => setIsAddTeacherOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Teacher
                </Button>
            </div>

            <AddTeacherDialog
                open={isAddTeacherOpen}
                onOpenChange={setIsAddTeacherOpen}
            />

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="availability">Visual Availability Grid</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or staff ID..."
                                value={teacherSearchQuery}
                                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Staff ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            <p className="text-muted-foreground mt-2">Loading teachers...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTeachers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <p className="text-muted-foreground">
                                                {teacherSearchQuery
                                                    ? "No teachers found matching your search."
                                                    : "No teachers found. Add your first teacher!"}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTeachers.map((teacher: Teacher) => (
                                        <TableRow key={teacher.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/teachers/${teacher.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                                    {teacher.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                <Link href={`/teachers/${teacher.id}`} className="hover:underline">
                                                    {teacher.staff_id}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${teacher.is_active
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                                    }`}>
                                                    {teacher.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                                                    onClick={() => {
                                                        if (window.confirm(`Are you sure you want to delete teacher ${teacher.name}? This action cannot be undone.`)) {
                                                            deleteTeacherMutation.mutate(teacher.id);
                                                        }
                                                    }}
                                                    disabled={deleteTeacherMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="availability">
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-gradient">Teacher Schedule Matrix</CardTitle>
                                        <CardDescription className="mt-1">View all teachers' schedules for a specific day</CardDescription>
                                    </div>
                                    {/* Timezone toggle */}
                                    <div className="flex rounded-lg overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
                                        <button
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                                                gridTimezone === "pk"
                                                    ? "bg-violet-500/25 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                                                    : "text-slate-400 hover:text-slate-200"
                                            )}
                                            onClick={() => setGridTimezone("pk")}
                                        >
                                            🇵🇰 PKT
                                        </button>
                                        <button
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                                                gridTimezone === "uk"
                                                    ? "bg-violet-500/25 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                                                    : "text-slate-400 hover:text-slate-200"
                                            )}
                                            onClick={() => setGridTimezone("uk")}
                                        >
                                            🇬🇧 UKT
                                        </button>
                                    </div>
                                </div>
                                {/* Day selector chips */}
                                <div className="flex flex-wrap gap-1.5">
                                    {ALL_DAYS.map((day) => (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDay(day)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
                                                selectedDay === day
                                                    ? "bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.25)]"
                                                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/8 hover:text-slate-300"
                                            )}
                                        >
                                            {SHORT_DAYS[day]}
                                        </button>
                                    ))}
                                </div>
                                {/* Legend */}
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded border border-emerald-500/30 bg-emerald-500/10"></span>
                                        Available
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded bg-violet-500/30 border border-violet-500/50"></span>
                                        Occupied
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded bg-white/[0.02] border border-white/5"></span>
                                        Off Shift
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                            {allClassesLoading || availabilityLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (() => {
                                // Build a global student color map for consistency
                                const studentColorMap = new Map<string, typeof BLOCK_COLORS[0]>();
                                let colorIdx = 0;
                                allClasses.forEach((cls: any) => {
                                    if (!studentColorMap.has(cls.student_id)) {
                                        studentColorMap.set(cls.student_id, getBlockColor(colorIdx++));
                                    }
                                });

                                const selectedDayShort = SHORT_DAYS[selectedDay] || selectedDay.slice(0, 3);

                                return (
                                    <div style={{ minWidth: `${TOTAL_WIDTH + 200}px` }} className="border-t border-white/5">
                                        {/* Timeline Header */}
                                        <div className="flex border-b border-white/8 glass-table-header">
                                            <div className="w-[200px] flex-shrink-0 p-3 border-r border-white/6 flex items-center gap-1.5">
                                                <Globe className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                    {selectedDay} · {gridTimezone === "pk" ? "PKT" : "UKT"}
                                                </span>
                                            </div>
                                            <div className="flex-1 flex">
                                                {HOURS.map((hour) => (
                                                    <div
                                                        key={hour}
                                                        style={{ width: `${HOUR_WIDTH}px` }}
                                                        className="flex-shrink-0 p-2 text-[10px] font-medium text-center text-slate-500 border-r border-white/5 last:border-r-0 uppercase"
                                                    >
                                                        {formatDisplayHour(hour)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Teacher Rows */}
                                        <div className="divide-y divide-white/5">
                                            {teachers.map((teacher: Teacher) => {
                                                // Filter classes for this teacher that include the selected day
                                                const teacherDayClasses = allClasses.filter((c: any) => {
                                                    if (c.teacher_id !== teacher.id) return false;
                                                    if (!c.schedule_days) return false;
                                                    return Object.keys(c.schedule_days).some(
                                                        (d: string) => normalizeDay(d) === selectedDay
                                                    );
                                                });

                                                // Get availability for this teacher on this day
                                                const teacherDayAvail = allAvailability.filter(
                                                    (a: TeacherAvailability) =>
                                                        a.teacher_id === teacher.id &&
                                                        normalizeDay(a.day_of_week) === selectedDay
                                                );

                                                const classCount = teacherDayClasses.length;
                                                const hasAvailability = teacherDayAvail.length > 0;

                                                return (
                                                    <div key={teacher.id} className={cn(
                                                        "flex h-[56px] relative transition-colors",
                                                        classCount > 0
                                                            ? "hover:bg-white/[0.02]"
                                                            : hasAvailability ? "hover:bg-emerald-500/[0.02]" : "opacity-50"
                                                    )}>
                                                        {/* Teacher name column */}
                                                        <div className="w-[200px] flex-shrink-0 px-3 py-2 border-r border-white/6 flex flex-col justify-center">
                                                            <div className="flex items-center gap-1.5">
                                                                <Link href={`/teachers/${teacher.id}`} className="text-xs font-bold text-slate-200 truncate hover:text-violet-300 transition-colors" title={teacher.name}>
                                                                    {teacher.name}
                                                                </Link>
                                                                {classCount === 0 && hasAvailability && (
                                                                    <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] text-slate-500 font-mono">{teacher.staff_id}</span>
                                                                {classCount > 0 && (
                                                                    <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">
                                                                        {classCount}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Timeline area */}
                                                        <div className="flex-1 relative">
                                                            {/* Hour grid lines */}
                                                            <div className="absolute inset-0 flex pointer-events-none">
                                                                {HOURS.map((hour) => (
                                                                    <div
                                                                        key={hour}
                                                                        style={{ width: `${HOUR_WIDTH}px` }}
                                                                        className="flex-shrink-0 border-r border-white/[0.03] last:border-r-0"
                                                                    />
                                                                ))}
                                                            </div>

                                                            {/* Availability slots (green shading) */}
                                                            {teacherDayAvail.map((slot: TeacherAvailability) => {
                                                                const start = timeToDecimal(slot.start_time);
                                                                const end = timeToDecimal(slot.end_time);
                                                                if (!isClassVisible(start, end)) return null;
                                                                const leftPx = Math.max(0, (start - START_HOUR)) * HOUR_WIDTH;
                                                                const widthPx = Math.max(4, (end - start) * HOUR_WIDTH);
                                                                return (
                                                                    <div
                                                                        key={slot.id}
                                                                        className="absolute top-0 bottom-0 z-0"
                                                                        style={{
                                                                            left: `${leftPx}px`,
                                                                            width: `${widthPx}px`,
                                                                            background: slot.is_booked
                                                                                ? "rgba(139,92,246,0.06)"
                                                                                : "rgba(16,185,129,0.06)",
                                                                            borderLeft: slot.is_booked
                                                                                ? "1px solid rgba(139,92,246,0.12)"
                                                                                : "1px solid rgba(16,185,129,0.12)",
                                                                        }}
                                                                    />
                                                                );
                                                            })}

                                                            {/* Class blocks */}
                                                            {teacherDayClasses.map((cls: any) => {
                                                                const hasUk = !!cls.uk_start_time && !!cls.uk_end_time;
                                                                const useUk = gridTimezone === "uk" && hasUk;
                                                                const startTime = useUk ? cls.uk_start_time : cls.pak_start_time;
                                                                const endTime = useUk ? cls.uk_end_time : cls.pak_end_time;
                                                                const start = timeToDecimal(startTime);
                                                                const end = timeToDecimal(endTime);

                                                                if (!startTime || !endTime || !isClassVisible(start, end)) return null;

                                                                const leftPx = Math.max(0, (start - START_HOUR)) * HOUR_WIDTH;
                                                                const widthPx = Math.max(30, (end - start) * HOUR_WIDTH);
                                                                const color = studentColorMap.get(cls.student_id) || BLOCK_COLORS[0];
                                                                const studentName = cls.student?.full_name || "Unknown";
                                                                const isFallback = gridTimezone === "uk" && !hasUk;

                                                                return (
                                                                    <div
                                                                        key={`${teacher.id}-${cls.id}`}
                                                                        className="absolute top-1.5 bottom-1.5 rounded-md z-10 hover:z-50 hover:scale-[1.03] transition-all duration-200 cursor-pointer flex items-center px-2 overflow-hidden group/block backdrop-blur-sm"
                                                                        style={{
                                                                            left: `${leftPx}px`,
                                                                            width: `${widthPx}px`,
                                                                            background: color.bg,
                                                                            borderLeft: `3px solid ${color.border}`,
                                                                            boxShadow: `0 0 10px ${color.glow}`,
                                                                        }}
                                                                        onClick={() => cls.student?.id && router.push(`/students/${cls.student.id}`)}
                                                                    >
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-[10px] font-bold truncate leading-tight" style={{ color: color.text }}>
                                                                                {studentName}
                                                                            </span>
                                                                            {widthPx > 70 && (
                                                                                <span className="text-[8px] text-slate-400 truncate">
                                                                                    {startTime} – {endTime}{isFallback ? " (PK)" : ""}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Hover tooltip */}
                                                                        <div className="absolute opacity-0 group-hover/block:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[210px] p-3 rounded-lg shadow-2xl pointer-events-none transition-opacity duration-200 z-[100] glass-popover">
                                                                            <div className="flex items-center justify-between border-b border-white/8 pb-2 mb-2">
                                                                                <span className="font-bold text-xs" style={{ color: color.text }}>{studentName}</span>
                                                                                <Clock className="w-3 h-3 text-slate-500" />
                                                                            </div>
                                                                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                                                                                <span className="text-slate-500">Reg</span>
                                                                                <span className="font-mono text-slate-300">{cls.student?.reg_no || "—"}</span>
                                                                                <span className="text-slate-500">🇵🇰 PK</span>
                                                                                <span className="text-slate-300">{cls.pak_start_time} – {cls.pak_end_time}</span>
                                                                                <span className="text-slate-500">🇬🇧 UK</span>
                                                                                <span className="text-slate-300">{cls.uk_start_time || "—"} – {cls.uk_end_time || "—"}</span>
                                                                                <span className="text-slate-500">Days</span>
                                                                                <span className="text-slate-300">{cls.schedule_days ? Object.keys(cls.schedule_days).join(", ") : "—"}</span>
                                                                            </div>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[rgba(12,8,32,0.92)]"></div>
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
                                );
                            })()}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}
