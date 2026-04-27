"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { getMissingAttendanceStudents } from "@/lib/api/attendance";
import { getSupervisors } from "@/lib/api/supervisors";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, UserX, AlertCircle, Search, Filter, ShieldCheck, UserCog } from "lucide-react";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { cn } from "@/lib/utils";

export default function MissingAttendancePage() {
    const [supervisorFilter, setSupervisorFilter] = useState<string>("all");
    const today = format(new Date(), "yyyy-MM-dd");

    const { data: missingStudents = [], isLoading: studentsLoading } = useQuery({
        queryKey: ["missingAttendance", today, supervisorFilter],
        queryFn: () => getMissingAttendanceStudents(today, supervisorFilter === "all" ? undefined : supervisorFilter),
    });

    const { data: supervisors = [], isLoading: supervisorsLoading } = useQuery({
        queryKey: ["supervisors"],
        queryFn: () => getSupervisors(),
    });

    return (
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 font-display flex-1 relative">
             {/* Organic Background Elements */}
             <div className="organic-blob bg-red-500/5 w-[500px] h-[500px] -top-24 -left-24 fixed"></div>
             <div className="organic-blob bg-amber-500/5 w-[400px] h-[400px] bottom-0 right-0 fixed"></div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    <Link href="/">
                        <button className="h-12 w-12 rounded-2xl border border-border hover:border-red-500/30 flex items-center justify-center transition-all bg-card hover:bg-red-500/5 group">
                            <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-red-600 transition-colors" />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-red-600/70">Live Monitoring</p>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
                            Attendance Gaps
                            <span className="text-red-600 ml-2 text-2xl">⚠</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm max-w-lg">
                            Active students who haven't been marked for today yet. Use this to follow up with supervisors.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel border-white/20 dark:border-white/5 rounded-[32px] p-6 border shadow-[0px_0px_48px_rgba(45,52,50,0.06)] flex flex-wrap items-center gap-6 relative z-10">
                <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <UserCog className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Filter by Supervisor</span>
                    </div>
                    <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
                        <SelectTrigger className="h-14 bg-accent/20 border-border rounded-2xl px-5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary shadow-sm outline-none transition-all">
                            <SelectValue placeholder="All Supervisors" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border shadow-xl">
                            <SelectItem value="all" className="cursor-pointer font-bold rounded-xl m-1">All Supervisors</SelectItem>
                            {supervisors.map((sup: any) => (
                                <SelectItem key={sup.id} value={sup.id} className="cursor-pointer font-bold rounded-xl m-1">
                                    {sup.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex flex-col gap-2 bg-red-500/5 border border-red-500/10 p-4 rounded-3xl min-w-[200px]">
                    <p className="text-[10px] uppercase font-black tracking-widest text-red-600/60">Missing Total</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-red-600 leading-none">{missingStudents.length}</span>
                        <span className="text-sm font-bold text-red-600/50">Students</span>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="glass-panel border-white/20 dark:border-white/5 rounded-[32px] border shadow-[0px_0px_48px_rgba(45,52,50,0.06)] overflow-hidden relative z-10 flex-1">
                <div className="overflow-x-auto">
                    {studentsLoading ? (
                        <div className="p-8"><LoadingShimmer rows={6} rowHeight="h-16" /></div>
                    ) : missingStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                <ShieldCheck className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground">Zero Gaps Detected!</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm font-medium">
                                All active students have been accounted for today. Your supervisors are doing a great job!
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-accent/30 text-muted-foreground text-[10px] uppercase tracking-[0.15em] font-black">
                                <tr>
                                    <th className="px-8 py-5 border-b border-border/50">Student Profile</th>
                                    <th className="px-8 py-5 border-b border-border/50">Details</th>
                                    <th className="px-8 py-5 border-b border-border/50">Assigned Teacher</th>
                                    <th className="px-8 py-5 border-b border-border/50">Supervisor</th>
                                    <th className="px-8 py-5 border-b border-border/50 text-right px-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {missingStudents.map((student: any) => (
                                    <tr key={student.id} className="group hover:bg-red-500/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center font-black text-red-600 border border-red-500/20 shadow-sm group-hover:scale-110 transition-transform">
                                                    {(student.full_name || "U").substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-[15px] group-hover:text-red-600 transition-colors">
                                                        {student.full_name}
                                                    </p>
                                                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-wider mt-0.5">#{student.reg_no}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                    student.shift === "Morning" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                                                )}>
                                                    {student.shift}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center">
                                                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                                </div>
                                                <span className="text-sm font-bold text-foreground">{student.teacher?.name || "No Teacher"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-primary">{student.supervisor?.name || "Unassigned"}</span>
                                                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-tighter italic">Responsible</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right px-10">
                                            <button className="h-10 px-4 rounded-xl bg-accent hover:bg-primary hover:text-white transition-all text-xs font-black text-muted-foreground uppercase tracking-widest">
                                                Follow Up
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            {/* Legend / Info */}
            <div className="flex items-center gap-3 px-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <p className="text-[11px] font-medium italic">
                    Note: Only active students who appear in teacher class rosters are tracked here.
                </p>
            </div>
        </div>
    );
}
