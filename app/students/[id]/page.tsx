"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getStudentById, getSiblings, updateStudent } from "@/lib/api/students";
import { getStudentClasses, updateClass, getTeachers } from "@/lib/api/classes";
import { getAppAccounts } from "@/lib/api/platforms";
import { getSupervisors } from "@/lib/api/supervisors";
import { Student, ClassSchedule } from "@/types/student";
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

export default function StudentProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const queryClient = useQueryClient();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isClassEditOpen, setIsClassEditOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    const [editForm, setEditForm] = useState<{
        full_name: string;
        reg_no: string;
        guardian_name: string;
        status: string;
        shift: string;
        supervisor_id: string;
    }>({
        full_name: "",
        reg_no: "",
        guardian_name: "",
        status: "",
        shift: "",
        supervisor_id: "",
    });

    const [classForm, setClassForm] = useState<Partial<ClassSchedule>>({
        teacher_id: "",
        app_account_id: "",
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
    });

    // Queries
    const { data: student, isLoading: studentLoading } = useQuery({
        queryKey: ["student", id],
        queryFn: () => getStudentById(id),
    });

    const { data: siblings = [] } = useQuery({
        queryKey: ["siblings", id],
        queryFn: () => (student ? getSiblings(student) : Promise.resolve([])),
        enabled: !!student,
    });

    const { data: classes = [] } = useQuery({
        queryKey: ["studentClasses", id],
        queryFn: () => getStudentClasses(id),
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

    // Mutations
    const updateMutation = useMutation({
        mutationFn: (updates: Partial<Pick<Student, "full_name" | "status" | "shift" | "reg_no" | "supervisor_id" | "guardian_name">>) =>
            updateStudent(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student", id] });
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setIsEditOpen(false);
        },
    });

    const updateClassMutation = useMutation({
        mutationFn: (updates: Partial<ClassSchedule>) =>
            selectedClassId ? updateClass(selectedClassId, updates) : Promise.reject("No class selected"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["studentClasses", id] });
            setIsClassEditOpen(false);
            setSelectedClassId(null);
        },
    });

    // Handlers
    const handleEditOpen = () => {
        if (student) {
            setEditForm({
                full_name: student.full_name,
                reg_no: student.reg_no,
                guardian_name: student.guardian_name || "",
                status: student.status,
                shift: student.shift || "",
                supervisor_id: student.supervisor_id || "",
            });
        }
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(editForm);
    };

    const handleClassEditOpen = (cls: ClassSchedule) => {
        setSelectedClassId(cls.id);
        setClassForm({
            teacher_id: cls.teacher_id,
            app_account_id: cls.app_account_id || "",
            pak_start_time: cls.pak_start_time,
            pak_end_time: cls.pak_end_time,
            uk_start_time: cls.uk_start_time,
            uk_end_time: cls.uk_end_time,
        });
        setIsClassEditOpen(true);
    };

    const handleClassSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateClassMutation.mutate(classForm);
    };

    const inputClass = "w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all";

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

    if (!student) {
        return (
            <div className="w-full mx-auto p-6 space-y-4">
                <Link href="/students" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Students
                </Link>
                <p className="text-red-500 font-bold">Student not found.</p>
            </div>
        );
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
                            onClick={handleEditOpen}
                            className="flex items-center gap-2 px-5 py-2.5 border border-border bg-card hover:bg-accent rounded-full text-sm font-bold text-foreground transition-all"
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit Profile
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
                                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Days</th>
                                        <th className="px-5 py-3 w-10"></th>
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
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => handleClassEditOpen(cls)}
                                                    className="size-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Student Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[520px] rounded-3xl border-border bg-card max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm">
                                {initials}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-foreground">Edit Student</DialogTitle>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">Update student profile details.</p>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-5 pt-2">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student Info</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Full Name *</label>
                                    <input
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        required
                                        className={inputClass}
                                        placeholder="e.g. Ahmed Khan"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Registration No *</label>
                                    <input
                                        value={editForm.reg_no}
                                        onChange={(e) => setEditForm({ ...editForm, reg_no: e.target.value })}
                                        required
                                        className={inputClass}
                                        placeholder="e.g. AHN-0001"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Guardian Name</label>
                                <input
                                    value={editForm.guardian_name}
                                    onChange={(e) => setEditForm({ ...editForm, guardian_name: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. Mohammad Khan"
                                />
                            </div>
                        </div>
                        <div className="space-y-3 border-t border-border pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enrollment Info</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Status</label>
                                    <Select
                                        value={editForm.status}
                                        onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Trial">Trial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Shift / Timing</label>
                                    <input
                                        value={editForm.shift}
                                        onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                                        className={inputClass}
                                        placeholder="e.g. Morning"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Supervisor</label>
                                <Select
                                    value={editForm.supervisor_id || "none"}
                                    onValueChange={(val) => setEditForm({ ...editForm, supervisor_id: val === "none" ? "" : val })}
                                >
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                        <SelectValue placeholder="Select Supervisor" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">None</SelectItem>
                                        {supervisors.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {updateMutation.isPending ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="h-4 w-4" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Class Dialog */}
            <Dialog open={isClassEditOpen} onOpenChange={setIsClassEditOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Edit Class Schedule</DialogTitle>
                        <p className="text-xs text-muted-foreground font-medium">Update teacher, platform, and timing.</p>
                    </DialogHeader>
                    <form onSubmit={handleClassSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Teacher</label>
                            <Select
                                value={classForm.teacher_id}
                                onValueChange={(val) => setClassForm({ ...classForm, teacher_id: val })}
                            >
                                <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                    <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {teachers.map((teacher: any) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Platform Account</label>
                            <Select
                                value={classForm.app_account_id || ""}
                                onValueChange={(val) => setClassForm({ ...classForm, app_account_id: val === "none" ? null : val })}
                            >
                                <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="none">None</SelectItem>
                                    {appAccounts.map((account: any) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.platform} - {account.account_identifier}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">PK Start</label>
                                <input value={classForm.pak_start_time} onChange={(e) => setClassForm({ ...classForm, pak_start_time: e.target.value })} className={inputClass} placeholder="e.g. 14:00" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">PK End</label>
                                <input value={classForm.pak_end_time} onChange={(e) => setClassForm({ ...classForm, pak_end_time: e.target.value })} className={inputClass} placeholder="e.g. 15:00" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">UK Start</label>
                                <input value={classForm.uk_start_time} onChange={(e) => setClassForm({ ...classForm, uk_start_time: e.target.value })} className={inputClass} placeholder="e.g. 09:00" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">UK End</label>
                                <input value={classForm.uk_end_time} onChange={(e) => setClassForm({ ...classForm, uk_end_time: e.target.value })} className={inputClass} placeholder="e.g. 10:00" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={updateClassMutation.isPending}
                                className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {updateClassMutation.isPending ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="h-4 w-4" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
