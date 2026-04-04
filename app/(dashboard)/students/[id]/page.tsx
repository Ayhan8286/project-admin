"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getStudentById, getSiblings, updateStudent } from "@/lib/api/students";
import { getStudentClasses, updateClass, getTeachers } from "@/lib/api/classes";
import { getAppAccounts } from "@/lib/api/platforms";
import { getSupervisors } from "@/lib/api/supervisors"; // Keep this import as it's used
import { Student, ClassSchedule, Teacher, AppAccount } from "@/types/student";
import { Supervisor } from "@/types/supervisor";
import { convertPkToUk } from "@/lib/utils/time";
import { TimeSelect } from "@/components/ui/time-select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Edit, Edit2, Users, Calendar, Loader2, Clock, Save, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/form-input";
import { ErrorState } from "@/components/ui/error-state";
import { STALE_SHORT } from "@/lib/query-config";
import { ManageStudentDialog } from "@/components/dialogs/ManageStudentDialog";

export default function StudentProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const queryClient = useQueryClient();
    const [isManageOpen, setIsManageOpen] = useState(false);

    // Queries
    const { data: student, isLoading: studentLoading, error: studentError, refetch: refetchStudent } = useQuery({
        queryKey: ["student", id],
        queryFn: () => getStudentById(id),
        ...STALE_SHORT,
    });

    const { data: siblings = [] } = useQuery({
        queryKey: ["siblings", id],
        queryFn: () => (student ? getSiblings(student) : Promise.resolve([])),
        enabled: !!student,
        ...STALE_SHORT,
    });

    const { data: classes = [] } = useQuery({
        queryKey: ["studentClasses", id],
        queryFn: () => getStudentClasses(id),
        ...STALE_SHORT,
    });

    const { data: teachers = [] } = useQuery({
        queryKey: ["activeTeachers"],
        queryFn: getTeachers,
    });

    const { data: appAccounts = [] } = useQuery({
        queryKey: ["appAccounts"],
        queryFn: getAppAccounts,
    });

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    // Handlers
    const handleManageSuccess = () => {
        refetchStudent();
    };



    if (studentLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-bold">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (studentError || !student) {
        return <ErrorState message="Student profile not found or could not be loaded." onRetry={() => refetchStudent()} />;
    }

    const isActive = student.status?.toLowerCase() === "active";
    const initials = student.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-display flex-1">
            {/* Back nav */}
            <Link href="/students" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors w-fit">
                <ArrowLeft className="h-4 w-4" />
                Back to Students
            </Link>

            {/* Profile Header */}
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm card-hover">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                            <div className="size-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-primary text-2xl shadow-lg">
                                {initials}
                            </div>
                            <span className={cn(
                                "absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card",
                                isActive ? "bg-green-500" : "bg-amber-500"
                            )} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1">Student Profile</p>
                            <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
                                {student.full_name}
                                <span className="text-primary ml-2 text-lg">✦</span>
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground mt-1.5 font-mono tracking-wide">{student.reg_no}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className={cn(
                            "px-4 py-2 rounded-full text-xs font-black border",
                            isActive
                                ? "bg-green-500/10 text-green-600 border-green-500/30"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        )}>
                            {student.status || "Unknown"}
                        </span>
                        <button
                            onClick={() => setIsManageOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-border bg-card hover:bg-accent rounded-full text-sm font-bold text-foreground transition-all"
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                            Manage Student
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Details Card */}
                <div className="bg-card rounded-3xl p-6 border border-border shadow-sm card-hover">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-5">Student Details</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Registration No.", value: student.reg_no },
                            { label: "Guardian Name", value: student.guardian_name || "—" },
                            { label: "Shift / Timing", value: student.shift || "—" },
                            { label: "Supervisor", value: student.supervisor?.name || "—" },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
                                <p className="text-sm font-bold text-foreground">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Siblings Card */}
                <div className="bg-card rounded-3xl p-6 border border-border shadow-sm card-hover">
                    <div className="flex items-center gap-2 mb-5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Siblings</h3>
                    </div>
                    {siblings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                            <User className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-bold text-foreground">No Siblings Found</p>
                            <p className="text-xs text-muted-foreground mt-1">No students share this guardian.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {siblings.map((sibling) => (
                                <li key={sibling.id}>
                                    <Link
                                        href={`/students/${sibling.id}`}
                                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-accent/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                                                {sibling.full_name?.slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{sibling.full_name}</span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-muted-foreground">{sibling.reg_no}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Class Schedule */}
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm card-hover">
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Class Schedule</h3>
                </div>
                {classes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                        <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-bold text-foreground">No Classes Assigned</p>
                        <p className="text-xs text-muted-foreground mt-1">This student has no scheduled classes yet.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-accent/30 border-b border-border">
                                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Teacher</th>
                                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Platform</th>
                                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">PK Time</th>
                                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">UK Time</th>
                                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground border-r-0">Days</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {classes.map((cls: ClassSchedule) => (
                                        <tr key={cls.id} className="hover:bg-accent/20 transition-colors group">
                                            <td className="px-5 py-4 font-bold text-sm text-foreground">
                                                {cls.teacher?.name || "—"}
                                            </td>
                                            <td className="px-5 py-4">
                                                {cls.app_account ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground">{cls.app_account.platform}</span>
                                                        <span className="text-xs text-muted-foreground">{cls.app_account.account_identifier}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-foreground">{cls.pak_start_time} – {cls.pak_end_time}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-foreground">{cls.uk_start_time} – {cls.uk_end_time}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {cls.schedule_days &&
                                                        Object.entries(cls.schedule_days).map(([day]) => (
                                                            <span
                                                                key={day}
                                                                className="px-2 py-0.5 text-[11px] font-black rounded-lg bg-primary/10 text-primary border border-primary/20"
                                                            >
                                                                {day.slice(0, 3)}
                                                            </span>
                                                        ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Unified Management Dialog */}
            <ManageStudentDialog
                studentId={id}
                open={isManageOpen}
                onOpenChange={setIsManageOpen}
                onSuccess={handleManageSuccess}
            />
        </div>
    );
}
