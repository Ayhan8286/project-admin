"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttendanceByDate, submitAttendance } from "@/lib/api/attendance";
import { getAllClasses } from "@/lib/api/classes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, UserCheck, UserX, Clock, CalendarOff, Clock3, Globe } from "lucide-react";
import { toast } from "sonner";
import { AttendanceRecord } from "@/types/student";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "Present" | "Absent" | "Late" | "Leave";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: React.ElementType }> = {
    Present: { bg: "bg-green-500/10", text: "text-green-500", dot: "bg-green-500", icon: UserCheck },
    Absent: { bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500", icon: UserX },
    Late: { bg: "bg-yellow-500/10", text: "text-yellow-500", dot: "bg-yellow-500", icon: Clock },
    Leave: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500", icon: CalendarOff },
};

export default function TodayAttendancePage() {
    const queryClient = useQueryClient();
    const today = new Date().toISOString().split('T')[0];
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
    const [timeZone, setTimeZone] = useState<'PKT' | 'UKT'>('PKT');
    const [tab, setTab] = useState<StatusFilter>("all");

    const { data: attendanceData = [], isLoading: isAttendanceLoading } = useQuery({
        queryKey: ["attendance", today],
        queryFn: () => getAttendanceByDate(today),
    });

    const { data: classesData = [], isLoading: isClassesLoading } = useQuery({
        queryKey: ["classes"],
        queryFn: getAllClasses,
    });

    const attendanceMutation = useMutation({
        mutationFn: submitAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", today] });
            toast.success("Attendance marked successfully");
            setIsSlotDialogOpen(false);
        },
        onError: () => toast.error("Failed to mark attendance"),
    });

    const summary = {
        total: attendanceData.length,
        present: attendanceData.filter(r => r.status === 'Present').length,
        absent: attendanceData.filter(r => r.status === 'Absent').length,
        late: attendanceData.filter(r => r.status === 'Late').length,
        leave: attendanceData.filter(r => r.status === 'Leave').length,
    };

    const todaysClasses = classesData.filter((cls: any) => cls.schedule_days && cls.schedule_days[currentDay]);
    const classesByTime: Record<string, any[]> = {};
    todaysClasses.forEach((cls: any) => {
        const time = timeZone === 'PKT' ? (cls.pak_start_time || "Unscheduled") : (cls.uk_start_time || "Unscheduled");
        if (!classesByTime[time]) classesByTime[time] = [];
        classesByTime[time].push(cls);
    });
    const sortedTimes = Object.keys(classesByTime).sort((a, b) => a.localeCompare(b));

    const handleMarkAttendance = (studentId: string, status: AttendanceRecord['status']) => {
        attendanceMutation.mutate([{ student_id: studentId, date: today, status }]);
    };

    const filteredData = tab === "all" ? attendanceData : attendanceData.filter(r => r.status === tab);

    const TABS: { key: StatusFilter; label: string; count: number }[] = [
        { key: "all", label: "All", count: summary.total },
        { key: "Present", label: "Present", count: summary.present },
        { key: "Absent", label: "Absent", count: summary.absent },
        { key: "Late", label: "Late", count: summary.late },
        { key: "Leave", label: "Leave", count: summary.leave },
    ];

    const tabAccent: Record<string, string> = {
        all: "border-primary text-primary",
        Present: "border-green-500 text-green-500",
        Absent: "border-red-500 text-red-500",
        Late: "border-yellow-500 text-yellow-500",
        Leave: "border-blue-500 text-blue-500",
    };

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">

                {/* Header */}
                <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1">Attendance</p>
                    <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
                        Today's Records
                        <span className="text-primary ml-2 text-2xl">✦</span>
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {isAttendanceLoading || isClassesLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Summary Stat Cards */}
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Overview</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Present", count: summary.present, accent: "#22c55e", icon: UserCheck },
                                { label: "Absent", count: summary.absent, accent: "#ef4444", icon: UserX },
                                { label: "Late", count: summary.late, accent: "#eab308", icon: Clock3 },
                                { label: "Leave", count: summary.leave, accent: "#3b82f6", icon: CalendarOff },
                            ].map(({ label, count, accent, icon: Icon }) => (
                                <div key={label} className="card-hover relative bg-card rounded-3xl p-5 border border-border overflow-hidden group flex flex-col gap-3">
                                    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ background: accent }} />
                                    <div className="relative w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: `${accent}18` }}>
                                        <Icon className="h-4 w-4" style={{ color: accent }} />
                                    </div>
                                    <div className="relative">
                                        <p className="text-2xl font-black tracking-tight" style={{ color: accent }}>{count}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Time Slots */}
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Time Slots</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                            <div className="flex items-center bg-accent/50 p-1 rounded-full gap-1">
                                <button
                                    onClick={() => setTimeZone('PKT')}
                                    className={cn("px-3 py-1.5 text-xs font-black rounded-full transition-all", timeZone === 'PKT' ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                                >
                                    🇵🇰 PKT
                                </button>
                                <button
                                    onClick={() => setTimeZone('UKT')}
                                    className={cn("px-3 py-1.5 text-xs font-black rounded-full transition-all", timeZone === 'UKT' ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground")}
                                >
                                    🇬🇧 UKT
                                </button>
                            </div>
                        </div>

                        {sortedTimes.length === 0 ? (
                            <div className="text-center py-10 bg-card rounded-3xl border border-border">
                                <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                                <p className="font-bold text-foreground">No classes scheduled for today ({currentDay}) in {timeZone}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedTimes.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => { setSelectedSlot(time); setIsSlotDialogOpen(true); }}
                                        className="card-hover text-left bg-card rounded-3xl border border-border p-5 flex flex-col gap-3 hover:border-primary/40 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock3 className="h-4 w-4 text-primary" />
                                                <span className="text-lg font-black text-foreground">{time}</span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                                                {classesByTime[time].length} class{classesByTime[time].length !== 1 ? 'es' : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {classesByTime[time].map((c: any) => c.student?.full_name).filter(Boolean).slice(0, 3).join(', ')}
                                            {classesByTime[time].length > 3 && ` +${classesByTime[time].length - 3} more`}
                                        </p>
                                        <p className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Tap to mark attendance →</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Records Table with Tab Filter */}
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Records</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                        </div>

                        <div className="bg-card rounded-3xl border border-border overflow-hidden">
                            {/* Tab bar */}
                            <div className="flex border-b border-border overflow-x-auto">
                                {TABS.map(({ key, label, count }) => (
                                    <button
                                        key={key}
                                        onClick={() => setTab(key)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-5 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all",
                                            tab === key
                                                ? tabAccent[key] + " bg-accent/20"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {label}
                                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", tab === key ? "bg-current/10" : "bg-accent")}>
                                            {count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto min-h-[200px]">
                                {filteredData.length === 0 ? (
                                    <div className="flex items-center justify-center p-12 text-muted-foreground font-semibold">
                                        No records for this category.
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[520px]">
                                        <thead className="bg-accent/40 text-muted-foreground text-[10px] uppercase tracking-[0.1em] font-black">
                                            <tr>
                                                <th className="px-6 py-4 border-b border-border">Student</th>
                                                <th className="px-6 py-4 border-b border-border">Reg No.</th>
                                                <th className="px-6 py-4 text-center border-b border-border">Status</th>
                                                <th className="px-6 py-4 text-right border-b border-border">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredData.map((record: any) => {
                                                const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.Present;
                                                const Icon = cfg.icon;
                                                return (
                                                    <tr key={record.id} className="hover:bg-accent/20 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20 text-xs">
                                                                    {(record.student?.full_name || "U").slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="font-bold text-foreground text-sm">{record.student?.full_name || 'Unknown'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground font-semibold text-sm">
                                                            #{record.student?.reg_no || "—"}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", cfg.bg, cfg.text)}>
                                                                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                                                <Icon className="h-3 w-3" />
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-muted-foreground text-xs font-semibold">
                                                            {record.created_at ? new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Slot Detail Dialog */}
                <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
                    <DialogContent className="max-w-2xl rounded-3xl border-border bg-card max-h-[80vh] overflow-y-auto">
                        <DialogHeader className="pb-2">
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                                <Clock3 className="h-5 w-5 text-primary" />
                                Classes at {selectedSlot}
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Mark attendance for students in this time slot.</p>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                            {selectedSlot && classesByTime[selectedSlot]?.map((cls: any) => {
                                const studentAttendance = attendanceData.find(r => r.student_id === cls.student_id);
                                const cfg = studentAttendance ? (STATUS_CONFIG[studentAttendance.status] || null) : null;
                                return (
                                    <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-accent/30 rounded-2xl border border-border gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20 text-xs shrink-0">
                                                {(cls.student?.full_name || "?").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground text-sm">{cls.student?.full_name}</p>
                                                <p className="text-[11px] text-muted-foreground">Reg: {cls.student?.reg_no} · Teacher: {cls.teacher?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-wrap justify-end shrink-0">
                                            {cfg ? (
                                                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black", cfg.bg, cfg.text)}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                                    {studentAttendance?.status} — Marked
                                                </span>
                                            ) : (
                                                <>
                                                    {(["Present", "Absent", "Late", "Leave"] as const).map(status => {
                                                        const c = STATUS_CONFIG[status];
                                                        return (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleMarkAttendance(cls.student_id, status)}
                                                                disabled={attendanceMutation.isPending}
                                                                className={cn("px-3 py-2 rounded-full text-xs font-black border transition-all hover:scale-95 active:scale-90 disabled:opacity-50", c.bg, c.text, "border-current/20 hover:border-current/40")}
                                                            >
                                                                {status}
                                                            </button>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-4 flex justify-end border-t border-border mt-2">
                            <button onClick={() => setIsSlotDialogOpen(false)} className="px-6 py-2.5 rounded-full border border-border text-sm font-bold hover:bg-accent transition-all text-foreground">
                                Close
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
