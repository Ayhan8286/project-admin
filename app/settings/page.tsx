"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Moon, Sun, Monitor, Globe, Users, BookOpen, Calendar,
    DollarSign, AlertTriangle, CheckCircle2, Download, Zap,
    Database, Shield, Clock, BarChart3, Settings2, Loader2,
    MessageSquareWarning, UserCheck, Search, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────

function useLocalStorage(key: string, initial: string) {
    const [value, setValue] = useState(initial);
    useEffect(() => {
        const stored = localStorage.getItem(key);
        if (stored) setValue(stored);
    }, [key]);
    const set = (v: string) => {
        setValue(v);
        localStorage.setItem(key, v);
    };
    return [value, set] as const;
}

// Fetch all platform overview counts from Supabase in one shot
async function fetchPlatformOverview() {
    const [students, teachers, classes, payments, complaints, availability, supervisors] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }),
        supabase.from("teacher_availability").select("*", { count: "exact", head: true }),
        supabase.from("supervisors").select("*", { count: "exact", head: true }),
    ]);
    return {
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
        classes: classes.count ?? 0,
        payments: payments.count ?? 0,
        complaints: complaints.count ?? 0,
        availability: availability.count ?? 0,
        supervisors: supervisors.count ?? 0,
    };
}

// Fetch data quality metrics
async function fetchDataQuality() {
    const [allClasses, allStudents, allTeachers, allPayments] = await Promise.all([
        supabase.from("classes").select("id, pak_start_time, pak_end_time, uk_start_time, uk_end_time, student_id, teacher_id"),
        supabase.from("students").select("id"),
        supabase.from("teachers").select("id").eq("is_active", true),
        supabase.from("payments").select("id, due_date, status"),
    ]);

    const classes = allClasses.data || [];
    const students = allStudents.data || [];
    const teachers = allTeachers.data || [];
    const payments = allPayments.data || [];

    // Classes with missing UK times
    const missingUk = classes.filter(c => !c.uk_start_time || !c.uk_end_time || c.uk_start_time === "N/A").length;

    // Classes with N/A PK times
    const naPk = classes.filter(c => !c.pak_start_time || c.pak_start_time === "N/A").length;

    // Students without any classes
    const studentIdsInClasses = new Set(classes.map(c => c.student_id));
    const unassignedStudents = students.filter(s => !studentIdsInClasses.has(s.id)).length;

    // Teachers without any classes
    const teacherIdsInClasses = new Set(classes.map(c => c.teacher_id));
    const unassignedTeachers = teachers.filter(t => !teacherIdsInClasses.has(t.id)).length;

    // Payments still pending
    const pendingPayments = payments.filter(p => p.status === "Pending").length;

    // Payments overdue
    const overduePayments = payments.filter(p => p.status === "Overdue").length;

    return { missingUk, naPk, unassignedStudents, unassignedTeachers, pendingPayments, overduePayments, totalClasses: classes.length, totalStudents: students.length, totalTeachers: teachers.length };
}

// ─── Component ────────────────────────────────────────────────

export default function SettingsPage() {
    const { setTheme, theme } = useTheme();
    const [orgName, setOrgName] = useLocalStorage("lms-org-name", "AL Huda Network");
    const [academicYear, setAcademicYear] = useLocalStorage("lms-academic-year", "2025-2026");
    const [defaultTimezone, setDefaultTimezone] = useLocalStorage("lms-default-timezone", "pk");
    const [isExporting, setIsExporting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Queries
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ["settingsOverview"],
        queryFn: fetchPlatformOverview,
    });

    const { data: quality, isLoading: qualityLoading } = useQuery({
        queryKey: ["settingsQuality"],
        queryFn: fetchDataQuality,
    });

    // CSV export helper
    const exportCsv = async (table: "students" | "teachers") => {
        setIsExporting(true);
        try {
            const { data, error } = await supabase.from(table).select("*");
            if (error) throw error;
            if (!data || data.length === 0) { toast.error("No data to export"); return; }

            const cols = table === "students"
                ? ["full_name", "reg_no", "guardian_name", "status", "shift"]
                : ["name", "staff_id", "is_active"];

            const csv = [cols.join(","), ...data.map((row: any) => cols.map(c => `"${row[c] ?? ""}"`).join(","))].join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${table}_export_${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported ${data.length} ${table}`);
        } catch (err) {
            console.error(err);
            toast.error("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const qualityCard = (label: string, value: number, total: number, icon: React.ReactNode, desc: string) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        const status = value === 0 ? "good" : pct < 10 ? "warn" : "bad";
        const colors = {
            good: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-500", badge: "bg-green-500/20 text-green-500" },
            warn: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-500", badge: "bg-orange-500/20 text-orange-500" },
            bad: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500", badge: "bg-red-500/20 text-red-500" },
        }[status];
        return (
            <div className={cn("rounded-3xl border p-6 transition-all bg-card shadow-sm card-hover", colors.border)}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm font-black text-foreground uppercase tracking-widest">{label}</span>
                    </div>
                    <Badge className={cn("text-[9px] font-black tracking-widest uppercase", colors.badge)}>
                        {value === 0 ? "✓ Clean" : `${value} issues`}
                    </Badge>
                </div>
                <div className={cn("text-4xl font-black", colors.text)}>{value}</div>
                <p className="text-xs font-bold text-muted-foreground mt-2">{desc}</p>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full -m-8 bg-background">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Settings2 className="text-primary h-5 w-5" />
                    <h2 className="text-lg font-black text-foreground tracking-wide uppercase">Academy Customization</h2>
                </div>
                <div className="flex items-center gap-4">
                    {/* Header actions simplified - settings auto-save */}
                </div>
            </header>

            {/* Page Content */}
            <div className="p-8 max-w-6xl w-full mx-auto space-y-8 overflow-y-auto">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-foreground">Theme & Global Configuration</h1>
                    <p className="text-muted-foreground font-medium">Manage your academy's visual identity and core system defaults.</p>
                </div>

                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="bg-accent/50 p-1.5 rounded-2xl gap-1">
                        <TabsTrigger value="general" className="rounded-xl font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all px-4 py-2">
                            <Settings2 className="h-4 w-4 mr-2" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="overview" className="rounded-xl font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all px-4 py-2">
                            <Database className="h-4 w-4 mr-2" />
                            Platform Overview
                        </TabsTrigger>
                        <TabsTrigger value="quality" className="rounded-xl font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all px-4 py-2">
                            <Shield className="h-4 w-4 mr-2" />
                            Data Quality
                        </TabsTrigger>
                        <TabsTrigger value="actions" className="rounded-xl font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all px-4 py-2">
                            <Zap className="h-4 w-4 mr-2" />
                            Quick Actions
                        </TabsTrigger>
                    </TabsList>

                    {/* ══════ TAB 1: General Settings ══════ */}
                    <TabsContent value="general" className="mt-0 focus-visible:outline-none">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
                            {/* Left Column: Theme Customization */}
                            <div className="xl:col-span-2 space-y-8">
                                {/* Theme Preview Card */}
                                <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-sm card-hover">
                                    <div className="p-5 border-b border-border flex justify-between items-center bg-accent/40">
                                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                                            <Moon className="text-primary h-5 w-5" />
                                            Current Selection: Obsidian Aurora
                                        </h3>
                                        <span className="text-[10px] uppercase tracking-widest font-black bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20">Active Preview</span>
                                    </div>
                                    <div className="aspect-video w-full bg-[#0a150c] p-6 flex flex-col relative overflow-hidden" data-alt="Obsidian Aurora dark mode dashboard preview">
                                        <div className="flex-1 flex gap-4">
                                            <div className="w-12 h-full bg-slate-800/50 rounded-xl shrink-0"></div>
                                            <div className="flex-1 flex flex-col gap-4">
                                                <div className="h-8 w-full bg-slate-800/50 rounded-xl"></div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="h-24 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.1)]"></div>
                                                    <div className="h-24 bg-slate-800/50 rounded-2xl"></div>
                                                    <div className="h-24 bg-slate-800/50 rounded-2xl"></div>
                                                </div>
                                                <div className="flex-1 bg-slate-800/30 rounded-2xl border border-slate-800/50"></div>
                                            </div>
                                        </div>
                                        {/* Overlay Text */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a150c] via-transparent to-transparent pointer-events-none"></div>
                                        <div className="absolute bottom-6 left-6">
                                            <p className="text-primary font-black text-2xl tracking-tight drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">Obsidian Aurora</p>
                                            <p className="text-slate-400 text-sm font-medium mt-1">Deep charcoal surfaces with high-contrast neon accents.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Config Form */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black flex items-center gap-3 text-foreground">
                                        <Settings2 className="text-primary h-7 w-7" />
                                        Regional & Academic Defaults
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl border border-border bg-card shadow-sm card-hover">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Organization Name</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-2xl border-border bg-accent/50 text-sm font-bold focus:border-primary focus:ring-primary px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-card"
                                                value={orgName}
                                                onChange={e => setOrgName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Academic Year</label>
                                            <select
                                                className="w-full rounded-2xl border-border bg-accent/50 text-sm font-bold focus:border-primary focus:ring-primary px-4 py-3 text-foreground outline-none transition-all focus:bg-card"
                                                value={academicYear}
                                                onChange={e => setAcademicYear(e.target.value)}
                                            >
                                                <option value="2024-2025">2024-2025 (Current)</option>
                                                <option value="2025-2026">2025-2026</option>
                                                <option value="2026-2027">2026-2027</option>
                                            </select>
                                            <p className="text-[11px] font-semibold text-muted-foreground">Default period for new enrollments and grading.</p>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Default Timezone</label>
                                            <select
                                                className="w-full rounded-2xl border-border bg-accent/50 text-sm font-bold focus:border-primary focus:ring-primary px-4 py-3 text-foreground outline-none transition-all focus:bg-card"
                                                value={defaultTimezone}
                                                onChange={e => setDefaultTimezone(e.target.value)}
                                            >
                                                <option value="pk">🇵🇰 Pakistan Time (PKT)</option>
                                                <option value="uk">🇬🇧 UK Time (UKT)</option>
                                                <option value="est">(GMT-05:00) Eastern Time</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Base Currency</label>
                                            <select
                                                className="w-full rounded-2xl border-border bg-accent/50 text-sm font-bold focus:border-primary focus:ring-primary px-4 py-3 text-foreground outline-none transition-all focus:bg-card"
                                                defaultValue="GBP"
                                            >
                                                <option value="USD">USD ($) - US Dollar</option>
                                                <option value="EUR">EUR (€) - Euro</option>
                                                <option value="GBP">GBP (£) - British Pound</option>
                                                <option value="PKR">PKR (₨) - Pakistani Rupee</option>
                                            </select>
                                            <p className="text-[11px] font-semibold text-muted-foreground">Sets default currency across the Finance tab.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Quick Toggles */}
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-border bg-card p-8 space-y-6 shadow-sm card-hover">
                                    <h4 className="font-black text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Theme Modes</h4>
                                    <div className="space-y-5">
                                        <label className="flex items-center justify-between group cursor-pointer" onClick={() => setTheme("light")}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", mounted && theme === 'light' ? "bg-primary/20 text-primary shadow-inner" : "bg-accent text-muted-foreground group-hover:bg-accent/80")}>
                                                    <Sun className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className={cn("font-black text-sm transition-colors", mounted && theme === 'light' ? "text-primary dark:text-primary" : "text-foreground")}>Natural Light</p>
                                                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Soft greens and whites</p>
                                                </div>
                                            </div>
                                            <div className={cn("w-6 h-6 rounded-full border-2 transition-all", mounted && theme === 'light' ? "border-[8px] border-primary shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-border group-hover:border-primary/50")}></div>
                                        </label>

                                        <label className="flex items-center justify-between group cursor-pointer" onClick={() => setTheme("dark")}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", mounted && theme === 'dark' ? "bg-primary/20 text-primary shadow-inner" : "bg-accent text-muted-foreground group-hover:bg-accent/80")}>
                                                    <Moon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className={cn("font-black text-sm transition-colors", mounted && theme === 'dark' ? "text-primary dark:text-primary" : "text-foreground")}>Obsidian Aurora</p>
                                                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Deep neon dark mode</p>
                                                </div>
                                            </div>
                                            <div className={cn("w-6 h-6 rounded-full border-2 transition-all", mounted && theme === 'dark' ? "border-[8px] border-primary shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-border group-hover:border-primary/50")}></div>
                                        </label>

                                        <label className="flex items-center justify-between group cursor-pointer" onClick={() => setTheme("system")}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", mounted && theme === 'system' ? "bg-primary/20 text-primary shadow-inner" : "bg-accent text-muted-foreground group-hover:bg-accent/80")}>
                                                    <Monitor className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className={cn("font-black text-sm transition-colors", mounted && theme === 'system' ? "text-foreground" : "text-foreground")}>System Matched</p>
                                                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Follows device settings</p>
                                                </div>
                                            </div>
                                            <div className={cn("w-6 h-6 rounded-full border-2 transition-all", mounted && theme === 'system' ? "border-[8px] border-primary shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-border group-hover:border-primary/50")}></div>
                                        </label>
                                    </div>
                                </div>

                                {/* System Health / Status */}
                                <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 flex items-start gap-4">
                                    <div className="p-2 rounded-2xl bg-primary/20 text-primary">
                                        <CheckCircle2 className="h-6 w-6 shrink-0" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-primary uppercase tracking-wide">System Synchronized</p>
                                        <p className="text-xs text-primary/80 font-semibold leading-relaxed mt-1.5">All customization changes will propagate to student and teacher portals immediately.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ══════ TAB 2: Platform Overview ══════ */}
                    <TabsContent value="overview" className="space-y-4 focus-visible:outline-none pb-12">
                        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm p-8 card-hover">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-foreground">Live Record Counts</h3>
                                <p className="text-sm font-medium text-muted-foreground">Real-time statistics from the database.</p>
                            </div>
                            {overviewLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        { label: "Students", value: overview?.students ?? 0, icon: <Users className="h-5 w-5 text-violet-500" />, color: "bg-violet-500/10 border-violet-500/20 text-violet-500" },
                                        { label: "Teachers", value: overview?.teachers ?? 0, icon: <BookOpen className="h-5 w-5 text-emerald-500" />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
                                        { label: "Classes", value: overview?.classes ?? 0, icon: <Calendar className="h-5 w-5 text-blue-500" />, color: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
                                        { label: "Payments", value: overview?.payments ?? 0, icon: <DollarSign className="h-5 w-5 text-amber-500" />, color: "bg-amber-500/10 border-amber-500/20 text-amber-500" },
                                        { label: "Complaints", value: overview?.complaints ?? 0, icon: <MessageSquareWarning className="h-5 w-5 text-red-500" />, color: "bg-red-500/10 border-red-500/20 text-red-500" },
                                        { label: "Supervisors", value: overview?.supervisors ?? 0, icon: <UserCheck className="h-5 w-5 text-cyan-500" />, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" },
                                        { label: "Slots", value: overview?.availability ?? 0, icon: <Clock className="h-5 w-5 text-pink-500" />, color: "bg-pink-500/10 border-pink-500/20 text-pink-500" },
                                    ].map(card => (
                                        <div
                                            key={card.label}
                                            className="rounded-2xl border border-border bg-accent/30 p-5 flex items-center gap-4 transition-all hover:bg-accent hover:border-border/80"
                                        >
                                            <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl shrink-0 border", card.color)}>
                                                {card.icon}
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black text-foreground tracking-tight leading-none mb-1">{card.value}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ══════ TAB 3: Data Quality ══════ */}
                    <TabsContent value="quality" className="space-y-4 focus-visible:outline-none pb-12">
                        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm p-8 card-hover">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-foreground">Data Quality Report</h3>
                                <p className="text-sm font-medium text-muted-foreground">Identify missing data and potential issues across your platform.</p>
                            </div>
                            {qualityLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : quality ? (
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {qualityCard("Missing UK Times", quality.missingUk, quality.totalClasses, <Globe className="h-5 w-5 text-primary" />, `out of ${quality.totalClasses} classes have no UK time set`)}
                                    {qualityCard("N/A PK Times", quality.naPk, quality.totalClasses, <Clock className="h-5 w-5 text-primary" />, `classes with 'N/A' or empty PK start time`)}
                                    {qualityCard("Unassigned Students", quality.unassignedStudents, quality.totalStudents, <Users className="h-5 w-5 text-primary" />, `out of ${quality.totalStudents} students have no classes`)}
                                    {qualityCard("Unassigned Teachers", quality.unassignedTeachers, quality.totalTeachers, <BookOpen className="h-5 w-5 text-primary" />, `out of ${quality.totalTeachers} active teachers have no classes`)}
                                    {qualityCard("Pending Payments", quality.pendingPayments, quality.pendingPayments + 1, <DollarSign className="h-5 w-5 text-primary" />, `payments awaiting collection`)}
                                    {qualityCard("Overdue Payments", quality.overduePayments, quality.overduePayments + 1, <AlertTriangle className="h-5 w-5 text-primary" />, `payments past their due date`)}
                                </div>
                            ) : null}
                        </div>
                    </TabsContent>

                    {/* ══════ TAB 4: Quick Actions ══════ */}
                    <TabsContent value="actions" className="space-y-4 focus-visible:outline-none pb-12">
                        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden p-8 max-w-3xl card-hover">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-foreground">Bulk Operations</h3>
                                <p className="text-sm font-medium text-muted-foreground">Run secure data exports directly to your machine.</p>
                            </div>
                            <div className="space-y-4">
                                {/* Export Students */}
                                <div className="flex items-center justify-between rounded-2xl border border-border bg-accent/40 p-5 hover:border-violet-500/50 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                                            <Download className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-foreground">Export Students CSV</p>
                                            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Download all student records</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => exportCsv("students")}
                                        disabled={isExporting}
                                        className="px-5 py-2.5 bg-card border border-border rounded-full text-sm font-black hover:bg-accent hover:text-primary transition-all active:scale-95 disabled:opacity-50 tracking-wide uppercase"
                                    >
                                        {isExporting ? "Processing..." : "Export Data"}
                                    </button>
                                </div>

                                {/* Export Teachers */}
                                <div className="flex items-center justify-between rounded-2xl border border-border bg-accent/40 p-5 hover:border-emerald-500/50 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                            <Download className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-foreground">Export Teachers CSV</p>
                                            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Download all active and inactive teachers</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => exportCsv("teachers")}
                                        disabled={isExporting}
                                        className="px-5 py-2.5 bg-card border border-border rounded-full text-sm font-black hover:bg-accent hover:text-primary transition-all active:scale-95 disabled:opacity-50 tracking-wide uppercase"
                                    >
                                        {isExporting ? "Processing..." : "Export Data"}
                                    </button>
                                </div>

                                {/* Export All Classes */}
                                <div className="flex items-center justify-between rounded-2xl border border-border bg-accent/40 p-5 hover:border-blue-500/50 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                            <BarChart3 className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-foreground">Export Classes Schedule CSV</p>
                                            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Full class roster with timezone mappings</p>
                                        </div>
                                    </div>
                                    <button
                                        className="px-5 py-2.5 bg-card border border-border rounded-full text-sm font-black hover:bg-accent hover:text-primary transition-all active:scale-95 disabled:opacity-50 tracking-wide uppercase"
                                        onClick={async () => {
                                            setIsExporting(true);
                                            try {
                                                const { data, error } = await supabase
                                                    .from("classes")
                                                    .select("id, pak_start_time, pak_end_time, uk_start_time, uk_end_time, student_id, teacher_id");
                                                if (error) throw error;
                                                if (!data?.length) { toast.error("No data"); return; }
                                                const headers = Object.keys(data[0]);
                                                const csv = [headers.join(","), ...data.map(r => headers.map(h => `"${(r as Record<string, unknown>)[h] ?? ""}"`).join(","))].join("\n");
                                                const blob = new Blob([csv], { type: "text/csv" });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `classes_export_${Date.now()}.csv`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                                toast.success(`Exported ${data.length} classes`);
                                            } catch { toast.error("Export failed"); }
                                            finally { setIsExporting(false); }
                                        }}
                                        disabled={isExporting}
                                    >
                                        {isExporting ? "Processing..." : "Export Data"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
