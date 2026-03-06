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
import { Calendar, Users, Clock, Loader2, CheckCircle2, Plus, Edit, Trash2, Search, Globe, AlertCircle, Star, Award, ShieldCheck, Eye, Edit2, Filter, ChevronLeft, ChevronRight, GraduationCap, MoreVertical, UserPlus, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Time range: 12 PM (noon) to 6 AM (next day) -> Displayed as 12 to 30
// 19 hour span (including end hour)
const START_HOUR = 12; // 12 PM
const END_HOUR = 30;   // 6 AM (next day)
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Width configuration
const HOUR_WIDTH = 72; // Pixels per hour — compact but readable
const TEACHER_COL_WIDTH = 180; // Fixed teacher name column width
const TOTAL_WIDTH = (END_HOUR - START_HOUR + 1) * HOUR_WIDTH;

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

import { AddTeacherDialog } from "@/components/dialogs/AddTeacherDialog";

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
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-display flex-1">
            <div className="mb-2">
                <nav className="flex items-center gap-2 text-sm mb-6">
                    <span className="text-foreground font-medium">Faculty Network</span>
                </nav>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1">AL Huda Network</p>
                        <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground leading-none">
                            Teachers
                            <span className="text-primary ml-2 text-2xl">✦</span>
                        </h1>
                        <p className="text-muted-foreground mt-1.5 text-sm">Manage instructors, view active assignments, and coordinate schedules.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAddTeacherOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all shrink-0"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Teacher
                        </button>
                    </div>
                </div>
            </div>

            {/* Gen Z KPI Cards */}
            <div className="flex items-center gap-3 mb-1">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Faculty Metrics</span>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: "Total Faculty", value: teachers.length, sub: "Available in network", accent: "#13ec37", Icon: Users },
                    { label: "Active Classes", value: allClasses.length, sub: "Sections currently taught", accent: "#a855f7", Icon: BookOpen },
                    { label: "New This Month", value: 3, sub: "Recent onboardings", accent: "#3b82f6", Icon: Calendar },
                ].map(({ label, value, sub, accent, Icon }, i) => (
                    <div key={i} className="card-hover relative bg-card rounded-3xl p-5 border border-border overflow-hidden group flex flex-col gap-3">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" style={{ background: accent }} />
                        <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${accent}18` }}>
                            <Icon className="h-5 w-5" style={{ color: accent }} />
                        </div>
                        <div className="relative">
                            <p className="text-3xl font-black tracking-tight" style={{ color: accent }}>{value}</p>
                            <p className="text-[11px] font-bold text-foreground mt-1.5">{label}</p>
                            <p className="text-[10px] text-muted-foreground">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <AddTeacherDialog
                open={isAddTeacherOpen}
                onOpenChange={setIsAddTeacherOpen}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                        <input
                            className="pill-input pl-10 pr-5 py-2.5 bg-card border border-border text-sm text-foreground w-full sm:w-64 placeholder:text-muted-foreground/50"
                            placeholder="Search teachers..."
                            value={teacherSearchQuery}
                            onChange={(e) => setTeacherSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm font-bold hover:border-primary/30 transition-all text-foreground">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                </div>
            </div>

            <Tabs defaultValue="list" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-[#1a331d] p-1 rounded-xl">
                    <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-foreground">Faculty Directory</TabsTrigger>
                    <TabsTrigger value="availability" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-foreground">Visual Availability Grid</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-8">
                    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-[#1a331d]/80 border-b border-border">
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Teacher Profile</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Classes</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {teachersLoading ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-11 w-11 rounded-full bg-white/[0.07] shrink-0" />
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="h-3.5 w-28 bg-white/[0.07] rounded-full" />
                                                            <div className="h-2.5 w-40 bg-white/[0.04] rounded-full" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5"><div className="h-3.5 w-24 bg-white/[0.06] rounded-full" /></td>
                                                <td className="px-6 py-5"><div className="h-3.5 w-16 bg-white/[0.05] rounded-full" /></td>
                                                <td className="px-6 py-5 text-center"><div className="h-6 w-8 bg-white/[0.06] rounded-lg mx-auto" /></td>
                                                <td className="px-6 py-5"><div className="h-5 w-14 bg-white/[0.06] rounded-md" /></td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))

                                    ) : filteredTeachers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="bg-slate-50 dark:bg-[#1a331d]/50 rounded-2xl p-8 max-w-sm mx-auto border border-border">
                                                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                                                    <h3 className="text-base font-bold text-foreground mb-2">No Teachers Found</h3>
                                                    <p className="text-sm text-muted-foreground mb-6">
                                                        {teacherSearchQuery ? "Try adjusting your search filters." : "Start building your faculty roster."}
                                                    </p>
                                                    <button
                                                        onClick={() => setIsAddTeacherOpen(true)}
                                                        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors"
                                                    >
                                                        Add New Teacher
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTeachers.map((teacher: Teacher, index: number) => {
                                            const teacherClasses = allClasses.filter((c: any) => c.teacher_id === teacher.id);
                                            const classCount = teacherClasses.length;


                                            // Mock data for visual flair
                                            const mockAvatars = [
                                                "https://lh3.googleusercontent.com/aida-public/AB6AXuCKfsDrDiDS8zDuIUe0wDdTnkUqOlBbqL3h9P7U0-PA7yAzvQb1XpxY0ltFyPCRBIuXx5fLnANGpSjcjapvHaXFATLlivssijr7bxklrzsD7igCyWSrUpg1mLxwfAaoy6F6aNuK6E6pWFBTIFYtE4rPR-6ejTjA_n79fwGQiNBwpKeoIOODMLvKChEomeUK_5O4a7JazhFAKhuzvcAi0_oCCtLbN5zIjXATGhd9StZxyt3NStstO7ldHaavhVY9C8xQ9yXyt5-Gmv8",
                                                "https://lh3.googleusercontent.com/aida-public/AB6AXuDdwHjzyoQKoljwsA3u2pS6WL49XdF5wG2dUugOZH8xk5joUdZzltqpJFbJgXHocJLYYNDI0hmOJIz2JnrOddlTP6sefQAGgEyWpoRm8mX4R3u71b1a5gQ_MudsL-nQZne2QAN1rh0LFCI-lCSpZsSbskzKwxbhbP2OQkq1OWFX4G35zimK_oIG-oYU0dcn66AZiTcVynRNnQA9H6CridwiPhZbyFfDf70ZhO_oZcr5ISKiGnsXCi83_1HQuF6ZLcsQM9SOIkTa1HY",
                                                "https://lh3.googleusercontent.com/aida-public/AB6AXuAXOJpnvCdOIxv8F6bFA0ocHlckilGVPzk9yG3YV-16t6ubTlDu_jr006yBgn8TpRrNPGN3p0Mv74q89mE-WZM0FEyf3ltysvk0DlgRG8mWiLb3H6pCTWArdjb5UjN-xSgouuvRmwjQsAuCVmovVlSb0Us9P274_O0G4bLo_hcyfo_RfUMTbjYQEg6y3Asww7n-b51bc7JsjIeCq_w6qKlOR_jE9az8Wfcf19MsNd-pOQpMJvRICKOYbxTyRv8HHxZTwLVIKEFI1nw",
                                                "https://lh3.googleusercontent.com/aida-public/AB6AXuBgMWlB1KnBZfibcIbULK1r9K9jezgJYQSz_oPc60wQY84EvSVzN-jA6tms3OEJiOw2oC4QtrYAODLfrMdKxjpJ18THDcpOizqzePzAZkZRdm1JA8IN03u23Y-anvF9mKlR87-Iscm7jlZpgKoM--F85EfU3Gg5SQqhNWP6sbhoqtO3s6uMHIJ397dT9Am7QclRH1U7HNdFzpcwUu_8g3P4W5-tXvONLGtJ8XqFxfodVooTo1Nqc4huNvtOjwOY6BNUx6jRvtPL2gY"
                                            ];
                                            const avatarUrl = mockAvatars[index % mockAvatars.length];
                                            const mockEmail = `${teacher.name.toLowerCase().split(' ').join('.')}@qrastudy.edu`;

                                            return (
                                                <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a331d]/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <img alt={teacher.name} className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-slate-800 bg-slate-100" src={avatarUrl} />
                                                            <div>
                                                                <Link href={`/teachers/${teacher.id}`} className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-forest transition-colors">
                                                                    {teacher.name}
                                                                </Link>
                                                                <p className="text-xs text-slate-400 mt-0.5">{mockEmail}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5 text-center">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                            {classCount > 0 ? classCount : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {teacher.is_active ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-extrabold uppercase tracking-tight border border-green-200 dark:border-green-900/50">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-tight border border-slate-200 dark:border-slate-700 opacity-80">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link href={`/teachers/${teacher.id}`} className="w-8 h-8 rounded-lg text-slate-400 hover:text-forest hover:bg-forest/10 dark:hover:bg-forest/20 flex items-center justify-center transition-all" title="View Profile">
                                                                <Eye className="text-xl h-4 w-4" />
                                                            </Link>
                                                            <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center transition-all" title="Edit Record">
                                                                <Edit2 className="text-xl font-light h-4 w-4" />
                                                            </button>
                                                            <button
                                                                title="Remove"
                                                                disabled={deleteTeacherMutation.isPending}
                                                                onClick={() => {
                                                                    if (window.confirm(`Are you sure you want to delete teacher ${teacher.name}? This action cannot be undone.`)) {
                                                                        deleteTeacherMutation.mutate(teacher.id);
                                                                    }
                                                                }}
                                                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all disabled:opacity-50"
                                                            >
                                                                <Trash2 className="text-xl h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filteredTeachers.length > 0 && (
                            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Entries: <span className="text-slate-800 dark:text-white">{filteredTeachers.length}</span></p>
                                <div className="flex items-center gap-2">
                                    <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-50" disabled>
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button className="h-8 w-8 rounded-full bg-forest text-white text-xs font-bold shadow-md shadow-forest/20">1</button>
                                    <button className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">2</button>
                                    <button className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700">3</button>
                                    <span className="text-slate-400 px-1">...</span>
                                    <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all">
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="availability">
                    <Card className="overflow-hidden bg-card border-border shadow-sm">
                        <CardHeader className="pb-3 border-b border-border">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-foreground">Teacher Schedule Matrix</CardTitle>
                                        <CardDescription className="mt-1 text-muted-foreground">View all teachers' schedules for a specific day</CardDescription>
                                    </div>
                                    {/* Timezone toggle */}
                                    <div className="flex rounded-lg overflow-hidden border border-border bg-slate-50 dark:bg-[#1a331d]/50 p-1">
                                        <button
                                            className={cn(
                                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200",
                                                gridTimezone === "pk"
                                                    ? "bg-white dark:bg-slate-700 text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => setGridTimezone("pk")}
                                        >
                                            🇵🇰 PKT
                                        </button>
                                        <button
                                            className={cn(
                                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200",
                                                gridTimezone === "uk"
                                                    ? "bg-white dark:bg-slate-700 text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => setGridTimezone("uk")}
                                        >
                                            🇬🇧 UKT
                                        </button>
                                    </div>
                                </div>
                                {/* Day selector chips */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {ALL_DAYS.map((day) => (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDay(day)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200",
                                                selectedDay === day
                                                    ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                                                    : "bg-card text-muted-foreground border-border hover:bg-slate-50 dark:hover:bg-card-dark/50 hover:text-foreground"
                                            )}
                                        >
                                            {SHORT_DAYS[day]}
                                        </button>
                                    ))}
                                </div>
                                {/* Legend */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 font-medium">
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-sm border border-emerald-500/30 bg-emerald-500/10"></span>
                                        Available
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-sm bg-violet-500/30 border border-violet-500/50"></span>
                                        Occupied
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></span>
                                        Off Shift
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                            {allClassesLoading || availabilityLoading ? (
                                <div className="animate-pulse p-4 space-y-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-white/[0.05] rounded-lg" style={{ opacity: 1 - i * 0.12 }} />
                                    ))}
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
                                    <div style={{ minWidth: `${TOTAL_WIDTH + TEACHER_COL_WIDTH}px` }} className="border-t border-border">
                                        {/* Timeline Header — sticky top */}
                                        <div className="flex border-b border-border bg-[#f0f4f0] dark:bg-[#1a331d] sticky top-0 z-20">
                                            <div className="flex-shrink-0 sticky left-0 z-30 bg-[#f0f4f0] dark:bg-[#1a331d] border-r border-border flex items-center gap-1.5 px-3 py-2" style={{ width: `${TEACHER_COL_WIDTH}px` }}>
                                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    {selectedDay.slice(0, 3).toUpperCase()} · {gridTimezone === "pk" ? "PKT" : "UKT"}
                                                </span>
                                            </div>
                                            <div className="flex-1 flex">
                                                {HOURS.map((hour) => (
                                                    <div
                                                        key={hour}
                                                        style={{ width: `${HOUR_WIDTH}px` }}
                                                        className="flex-shrink-0 py-2 text-[10px] font-bold text-center text-muted-foreground border-r border-border last:border-r-0 uppercase"
                                                    >
                                                        {formatDisplayHour(hour)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Teacher Rows */}
                                        <div className="divide-y divide-border">
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
                                                        "flex h-12 relative transition-colors group border-b border-border/50",
                                                        // Zebra stripes for easy eye tracking
                                                        teachers.indexOf(teacher) % 2 === 0
                                                            ? "bg-transparent"
                                                            : "bg-black/[0.04] dark:bg-white/[0.025]",
                                                        classCount > 0
                                                            ? "hover:bg-primary/5 dark:hover:bg-primary/10"
                                                            : hasAvailability ? "hover:bg-emerald-500/5 dark:hover:bg-emerald-900/20" : "opacity-50"
                                                    )}>
                                                        {/* Teacher name column — sticky left */}
                                                        <div
                                                            className={cn(
                                                                "flex-shrink-0 sticky left-0 z-10 px-3 border-r border-border flex items-center gap-2 transition-colors",
                                                                teachers.indexOf(teacher) % 2 === 0
                                                                    ? "bg-[#f6f8f6] dark:bg-[#102212]"
                                                                    : "bg-[#eef3ee] dark:bg-[#0e1e0e]",
                                                                classCount > 0 ? "border-l-2 border-l-primary/50" : hasAvailability ? "border-l-2 border-l-emerald-500/40" : "",
                                                                "group-hover:bg-primary/5 dark:group-hover:bg-[#1a331d]/60"
                                                            )}
                                                            style={{ width: `${TEACHER_COL_WIDTH}px` }}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <Link
                                                                    href={`/teachers/${teacher.id}`}
                                                                    className="text-xs font-semibold text-foreground truncate hover:text-primary transition-colors block leading-tight"
                                                                    title={teacher.name}
                                                                >
                                                                    {teacher.name}
                                                                </Link>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    {classCount > 0 ? (
                                                                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">{classCount} class{classCount > 1 ? 'es' : ''}</span>
                                                                    ) : hasAvailability ? (
                                                                        <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">● free</span>
                                                                    ) : (
                                                                        <span className="text-[9px] text-muted-foreground/50">off shift</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Timeline area */}
                                                        <div className="flex-1 relative">
                                                            {/* Hour grid lines — stronger visibility */}
                                                            <div className="absolute inset-0 flex pointer-events-none">
                                                                {HOURS.map((hour) => (
                                                                    <div
                                                                        key={hour}
                                                                        style={{ width: `${HOUR_WIDTH}px` }}
                                                                        className="flex-shrink-0 border-r border-border/70 last:border-r-0 h-full"
                                                                    />
                                                                ))}
                                                            </div>

                                                            {/* Availability slots — visible green/violet shading */}
                                                            {teacherDayAvail.map((slot: TeacherAvailability) => {
                                                                const start = timeToDecimal(slot.start_time);
                                                                const end = timeToDecimal(slot.end_time);
                                                                if (!isClassVisible(start, end)) return null;
                                                                const leftPx = Math.max(0, (start - START_HOUR)) * HOUR_WIDTH;
                                                                const widthPx = Math.max(4, (end - start) * HOUR_WIDTH);
                                                                return (
                                                                    <div
                                                                        key={slot.id}
                                                                        className="absolute top-1 bottom-1 rounded-sm z-0"
                                                                        style={{
                                                                            left: `${leftPx}px`,
                                                                            width: `${widthPx}px`,
                                                                            background: slot.is_booked
                                                                                ? "rgba(139,92,246,0.18)"
                                                                                : "rgba(16,185,129,0.18)",
                                                                            borderLeft: slot.is_booked
                                                                                ? "2px solid rgba(139,92,246,0.5)"
                                                                                : "2px solid rgba(16,185,129,0.5)",
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
                                                                const studentName = cls.student?.full_name || cls.student?.name || "Student";
                                                                const isFallback = gridTimezone === "uk" && !hasUk;

                                                                return (
                                                                    <div
                                                                        key={`${teacher.id}-${cls.id}`}
                                                                        className="absolute top-1 bottom-1 rounded-md z-10 hover:z-50 hover:scale-[1.03] transition-all duration-200 cursor-pointer flex items-center px-2 overflow-visible group/block shadow-sm"
                                                                        style={{
                                                                            left: `${leftPx}px`,
                                                                            width: `${widthPx}px`,
                                                                            background: color.bg,
                                                                            borderLeft: `3px solid ${color.border}`,
                                                                        }}
                                                                        onClick={() => cls.student_id && router.push(`/students/${cls.student_id}`)}
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
                                                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/block:flex flex-col gap-1 bg-[#1a331d] dark:bg-[#0e1e0e] border border-primary/40 rounded-lg p-2.5 shadow-2xl z-50 min-w-[180px] pointer-events-none">
                                                                            <p className="text-[11px] font-bold text-white truncate">{studentName}</p>
                                                                            <p className="text-[10px] text-emerald-400 font-mono">{startTime} – {endTime}</p>
                                                                            {cls.schedule_days && (
                                                                                <p className="text-[9px] text-slate-400">{Object.keys(cls.schedule_days).join(", ")}</p>
                                                                            )}
                                                                            {isFallback && <p className="text-[9px] text-amber-400">Showing PKT (no UK time)</p>}
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
            </Tabs >

        </div >
    );
}
