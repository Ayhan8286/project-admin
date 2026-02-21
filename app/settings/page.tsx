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
    MessageSquareWarning, UserCheck
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

    // Quality metric card helper
    const qualityCard = (label: string, value: number, total: number, icon: React.ReactNode, desc: string) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        const status = value === 0 ? "good" : pct < 10 ? "warn" : "bad";
        const colors = {
            good: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
            warn: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300" },
            bad: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", badge: "bg-red-500/20 text-red-300" },
        }[status];
        return (
            <div className={cn("rounded-xl border p-4 transition-all", colors.bg, colors.border)}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm font-semibold text-slate-200">{label}</span>
                    </div>
                    <Badge className={cn("text-[10px]", colors.badge)}>
                        {value === 0 ? "✓ Clean" : `${value} issues`}
                    </Badge>
                </div>
                <div className={cn("text-3xl font-bold", colors.text)}>{value}</div>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gradient">System Settings</h1>
                <p className="text-slate-400 mt-1">
                    Manage preferences, view platform health, and run bulk operations.
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">
                        <Settings2 className="h-4 w-4 mr-1.5" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="overview">
                        <Database className="h-4 w-4 mr-1.5" />
                        Platform Overview
                    </TabsTrigger>
                    <TabsTrigger value="quality">
                        <Shield className="h-4 w-4 mr-1.5" />
                        Data Quality
                    </TabsTrigger>
                    <TabsTrigger value="actions">
                        <Zap className="h-4 w-4 mr-1.5" />
                        Quick Actions
                    </TabsTrigger>
                </TabsList>

                {/* ══════ TAB 1: General Settings ══════ */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>Customize the look and feel of the dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Theme Mode</Label>
                                    <p className="text-sm text-slate-400">Select your preferred theme.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant={theme === "light" ? "default" : "outline"} size="icon" onClick={() => setTheme("light")}><Sun className="h-4 w-4" /></Button>
                                    <Button variant={theme === "dark" ? "default" : "outline"} size="icon" onClick={() => setTheme("dark")}><Moon className="h-4 w-4" /></Button>
                                    <Button variant={theme === "system" ? "default" : "outline"} size="icon" onClick={() => setTheme("system")}><Monitor className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization</CardTitle>
                            <CardDescription>Configure your organization details. Saved to your browser.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <Input
                                        id="orgName"
                                        value={orgName}
                                        onChange={e => setOrgName(e.target.value)}
                                        placeholder="Your school name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="academicYear">Academic Year</Label>
                                    <Input
                                        id="academicYear"
                                        value={academicYear}
                                        onChange={e => setAcademicYear(e.target.value)}
                                        placeholder="2025-2026"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Default Timezone</CardTitle>
                            <CardDescription>Set the default timezone used across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button
                                    variant={defaultTimezone === "pk" ? "default" : "outline"}
                                    onClick={() => { setDefaultTimezone("pk"); toast.success("Default set to PKT"); }}
                                    className="gap-2"
                                >
                                    🇵🇰 Pakistan Time (PKT)
                                </Button>
                                <Button
                                    variant={defaultTimezone === "uk" ? "default" : "outline"}
                                    onClick={() => { setDefaultTimezone("uk"); toast.success("Default set to UKT"); }}
                                    className="gap-2"
                                >
                                    🇬🇧 UK Time (UKT)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ══════ TAB 2: Platform Overview ══════ */}
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Overview</CardTitle>
                            <CardDescription>Live record counts from the database.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {overviewLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        { label: "Students", value: overview?.students ?? 0, icon: <Users className="h-5 w-5 text-violet-400" />, color: "from-violet-600 to-indigo-600", glow: "shadow-violet-500/20" },
                                        { label: "Teachers", value: overview?.teachers ?? 0, icon: <BookOpen className="h-5 w-5 text-emerald-400" />, color: "from-emerald-600 to-teal-600", glow: "shadow-emerald-500/20" },
                                        { label: "Classes", value: overview?.classes ?? 0, icon: <Calendar className="h-5 w-5 text-blue-400" />, color: "from-blue-600 to-cyan-600", glow: "shadow-blue-500/20" },
                                        { label: "Payments", value: overview?.payments ?? 0, icon: <DollarSign className="h-5 w-5 text-amber-400" />, color: "from-amber-600 to-orange-600", glow: "shadow-amber-500/20" },
                                        { label: "Complaints", value: overview?.complaints ?? 0, icon: <MessageSquareWarning className="h-5 w-5 text-red-400" />, color: "from-red-600 to-pink-600", glow: "shadow-red-500/20" },
                                        { label: "Supervisors", value: overview?.supervisors ?? 0, icon: <UserCheck className="h-5 w-5 text-cyan-400" />, color: "from-cyan-600 to-blue-600", glow: "shadow-cyan-500/20" },
                                        { label: "Availability Slots", value: overview?.availability ?? 0, icon: <Clock className="h-5 w-5 text-pink-400" />, color: "from-pink-600 to-rose-600", glow: "shadow-pink-500/20" },
                                    ].map(card => (
                                        <div
                                            key={card.label}
                                            className={cn(
                                                "rounded-xl bg-gradient-to-br p-4 shadow-lg relative overflow-hidden transition-all hover:scale-[1.02]",
                                                card.color, card.glow
                                            )}
                                        >
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.3)_0%,_transparent_60%)]" />
                                            <div className="relative z-10 flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10">
                                                    {card.icon}
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{card.value}</p>
                                                    <p className="text-xs text-white/60">{card.label}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ══════ TAB 3: Data Quality ══════ */}
                <TabsContent value="quality" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Quality Report</CardTitle>
                            <CardDescription>Identify missing data and potential issues across your platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {qualityLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                                </div>
                            ) : quality ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {qualityCard("Missing UK Times", quality.missingUk, quality.totalClasses, <Globe className="h-4 w-4 text-slate-400" />, `out of ${quality.totalClasses} classes have no UK time set`)}
                                    {qualityCard("N/A PK Times", quality.naPk, quality.totalClasses, <Clock className="h-4 w-4 text-slate-400" />, `classes with 'N/A' or empty PK start time`)}
                                    {qualityCard("Unassigned Students", quality.unassignedStudents, quality.totalStudents, <Users className="h-4 w-4 text-slate-400" />, `out of ${quality.totalStudents} students have no classes`)}
                                    {qualityCard("Unassigned Teachers", quality.unassignedTeachers, quality.totalTeachers, <BookOpen className="h-4 w-4 text-slate-400" />, `out of ${quality.totalTeachers} active teachers have no classes`)}
                                    {qualityCard("Pending Payments", quality.pendingPayments, quality.pendingPayments + 1, <DollarSign className="h-4 w-4 text-slate-400" />, `payments awaiting collection`)}
                                    {qualityCard("Overdue Payments", quality.overduePayments, quality.overduePayments + 1, <AlertTriangle className="h-4 w-4 text-slate-400" />, `payments past their due date`)}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ══════ TAB 4: Quick Actions ══════ */}
                <TabsContent value="actions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Bulk operations and data exports.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Export Students */}
                            <div className="flex items-center justify-between rounded-xl border border-white/8 p-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10">
                                        <Download className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-200">Export Students CSV</p>
                                        <p className="text-xs text-slate-500">Download all students as a CSV file</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportCsv("students")}
                                    disabled={isExporting}
                                >
                                    {isExporting ? "Exporting..." : "Export"}
                                </Button>
                            </div>

                            {/* Export Teachers */}
                            <div className="flex items-center justify-between rounded-xl border border-white/8 p-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                                        <Download className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-200">Export Teachers CSV</p>
                                        <p className="text-xs text-slate-500">Download all teachers as a CSV file</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportCsv("teachers")}
                                    disabled={isExporting}
                                >
                                    {isExporting ? "Exporting..." : "Export"}
                                </Button>
                            </div>

                            {/* Export All Classes */}
                            <div className="flex items-center justify-between rounded-xl border border-white/8 p-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                                        <BarChart3 className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-200">Export Classes CSV</p>
                                        <p className="text-xs text-slate-500">Download all class assignments with PK/UK times</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
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
                                    {isExporting ? "Exporting..." : "Export"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
