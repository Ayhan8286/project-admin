"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupervisorById } from "@/lib/api/supervisors";
import { getTeachersBySupervisor, getTeachers, getAllClasses, updateTeacherSupervisor } from "@/lib/api/classes";
import { Teacher } from "@/types/student";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Label } from "@/components/ui/label";
import {
    Loader2, Plus, Trash2, ArrowLeft, Users, BookOpen,
    ShieldCheck, Eye, UserPlus, GraduationCap, MoreVertical
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

// Placeholder avatars for visual richness
const placeholderAvatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCKfsDrDiDS8zDuIUe0wDdTnkUqOlBbqL3h9P7U0-PA7yAzvQb1XpxY0ltFyPCRBIuXx5fLnANGpSjcjapvHaXFATLlivssijr7bxklrzsD7igCyWSrUpg1mLxwfAaoy6F6aNuK6E6pWFBTIFYtE4rPR-6ejTjA_n79fwGQiNBwpKeoIOODMLvKChEomeUK_5O4a7JazhFAKhuzvcAi0_oCCtLbN5zIjXATGhd9StZxyt3NStstO7ldHaavhVY9C8xQ9yXyt5-Gmv8",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDdwHjzyoQKoljwsA3u2pS6WL49XdF5wG2dUugOZH8xk5joUdZzltqpJFbJgXHocJLYYNDI0hmOJIz2JnrOddlTP6sefQAGgEyWpoRm8mX4R3u71b1a5gQ_MudsL-nQZne2QAN1rh0LFCI-lCSpZsSbskzKwxbhbP2OQkq1OWFX4G35zimK_oIG-oYU0dcn66AZiTcVynRNnQA9H6CridwiPhZbyFfDf70ZhO_oZcr5ISKiGnsXCi83_1HQuF6ZLcsQM9SOIkTa1HY",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAXOJpnvCdOIxv8F6bFA0ocHlckilGVPzk9yG3YV-16t6ubTlDu_jr006yBgn8TpRrNPGN3p0Mv74q89mE-WZM0FEyf3ltysvk0DlgRG8mWiLb3H6pCTWArdjb5UjN-xSgouuvRmwjQsAuCVmovVlSb0Us9P274_O0G4bLo_hcyfo_RfUMTbjYQEg6y3Asww7n-b51bc7JsjIeCq_w6qKlOR_jE9az8Wfcf19MsNd-pOQpMJvRICKOYbxTyRv8HHxZTwLVIKEFI1nw",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBgMWlB1KnBZfibcIbULK1r9K9jezgJYQSz_oPc60wQY84EvSVzN-jA6tms3OEJiOw2oC4QtrYAODLfrMdKxjpJ18THDcpOizqzePzAZkZRdm1JA8IN03u23Y-anvF9mKlR87-Iscm7jlZpgKoM--F85EfU3Gg5SQqhNWP6sbhoqtO3s6uMHIJ397dT9Am7QclRH1U7HNdFzpcwUu_8g3P4W5-tXvONLGtJ8XqFxfodVooTo1Nqc4huNvtOjwOY6BNUx6jRvtPL2gY"
];

export default function SupervisorDetailPage() {
    const params = useParams();
    const supervisorId = params.id as string;
    const role = typeof document !== 'undefined' ? document.cookie.split("; ").find(c => c.trim().startsWith("auth_role="))?.split("=")[1] : "admin";
    const isSupervisor = role === "supervisor";
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);

    // Fetch Supervisor Details
    const { data: supervisor, isLoading: isLoadingSupervisor } = useQuery({
        queryKey: ["supervisor", supervisorId],
        queryFn: () => getSupervisorById(supervisorId),
    });

    // Fetch Teachers assigned to this supervisor
    const { data: assignedTeachers = [], isLoading: isLoadingTeachers } = useQuery({
        queryKey: ["teachersBySupervisor", supervisorId],
        queryFn: () => getTeachersBySupervisor(supervisorId),
    });

    // Fetch all classes to count per teacher
    const { data: allClasses = [] } = useQuery({
        queryKey: ["allClasses"],
        queryFn: getAllClasses,
    });

    // Mutation to assign/unassign teacher
    const updateTeacherMutation = useMutation({
        mutationFn: ({ teacherId, supervisorId }: { teacherId: string; supervisorId: string | null }) =>
            updateTeacherSupervisor(teacherId, supervisorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachersBySupervisor", supervisorId] });
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast.success("Teacher assignment updated successfully");
            setIsAssignTeacherOpen(false);
        },
        onError: () => {
            toast.error("Failed to update teacher assignment");
        },
    });

    const handleUnassignTeacher = (teacherId: string, teacherName: string) => {
        if (window.confirm(`Remove ${teacherName} from this supervisor?`)) {
            updateTeacherMutation.mutate({ teacherId, supervisorId: null });
        }
    };

    const getClassCountForTeacher = (teacherId: string) => {
        return allClasses.filter((c: { teacher_id: string }) => c.teacher_id === teacherId).length;
    };

    if (isLoadingSupervisor || isLoadingTeachers) {
        return (
            <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!supervisor) {
        return <div className="p-8">Supervisor not found</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">

                {/* Header Row */}
                <div className="flex items-center gap-4">
                    <Link href="/departments/supervisor">
                        <Button variant="ghost" size="icon" className="rounded-full border border-border hover:border-primary/30">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-0.5">Supervisor Profile</p>
                        <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
                            {supervisor.name}
                            <span className="text-primary ml-2 text-2xl">✦</span>
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {supervisor.email || "No email"} · {supervisor.phone || "No phone"}
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Overview</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: "Assigned Teachers", value: assignedTeachers.length, sub: "Under this supervisor", accent: "#13ec37", Icon: Users },
                        { label: "Total Classes", value: allClasses.filter((c: any) => assignedTeachers.some((t: Teacher) => t.id === c.teacher_id)).length, sub: "Across all teachers", accent: "#a855f7", Icon: BookOpen },
                        { label: "Active Faculty", value: assignedTeachers.filter((t: Teacher) => t.is_active).length, sub: "Currently active", accent: "#3b82f6", Icon: ShieldCheck },
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

                {/* Actions Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Assigned Teachers</span>
                        <div className="h-px w-12 bg-gradient-to-r from-border to-transparent" />
                    </div>
                    {!isSupervisor && (
                        <button
                            onClick={() => setIsAssignTeacherOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all shrink-0"
                        >
                            <UserPlus className="h-4 w-4" />
                            Assign Teacher
                        </button>
                    )}
                </div>

                {/* Teachers Grid */}
                {assignedTeachers.length === 0 ? (
                    <div className="text-center p-12 bg-card rounded-2xl border border-border">
                        <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-40" />
                        <p className="text-lg font-bold text-foreground mb-2">No Teachers Assigned</p>
                        <p className="text-sm text-muted-foreground mb-6">Click &quot;Assign Teacher&quot; to add teachers to this supervisor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignedTeachers.map((teacher: Teacher, index: number) => {
                            const avatar = placeholderAvatars[index % placeholderAvatars.length];
                            const classCount = getClassCountForTeacher(teacher.id);
                            const mockEmail = `${teacher.name.toLowerCase().split(' ').join('.')}@qrastudy.edu`;

                            return (
                                <div key={teacher.id} className="group/card relative card-hover bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
                                    {/* Clickable Overlay */}
                                    <Link href={`/teachers/${teacher.id}`} className="absolute inset-0 z-10" />
                                    
                                    <div className="p-6 pb-4 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="relative">
                                                <img
                                                    className="size-16 rounded-2xl object-cover ring-4 ring-primary/10"
                                                    alt={teacher.name}
                                                    src={avatar}
                                                />
                                                <div className={`absolute -bottom-1.5 -right-1.5 ${teacher.is_active ? 'bg-green-500' : 'bg-gray-400'} size-4 rounded-full border-2 border-card`} />
                                            </div>
                                            {!isSupervisor && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleUnassignTeacher(teacher.id, teacher.name);
                                                    }}
                                                    className="relative z-20 p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                                                    title="Unassign from supervisor"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-foreground mb-0.5">{teacher.name}</h4>
                                            <p className="text-primary text-sm font-bold mb-2">Staff ID: {teacher.staff_id}</p>
                                            <p className="text-muted-foreground text-xs">{mockEmail}</p>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-primary/[0.03] border-t border-border grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-primary">{classCount}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Classes</p>
                                        </div>
                                        <div className="text-center border-l border-border pl-4">
                                            <p className="text-2xl font-black text-primary">{teacher.is_active ? "Active" : "—"}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Status</p>
                                        </div>
                                    </div>
                                    <div className="p-4 relative z-20">
                                        <Link
                                            href={`/teachers/${teacher.id}`}
                                            className="w-full py-2.5 flex items-center justify-center gap-2 rounded-full text-sm font-black bg-forest text-white fab-glow hover:bg-forest/90 transition-all"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Students & Schedule
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Assign Teacher Dialog */}
            <AssignTeacherDialog
                open={isAssignTeacherOpen}
                onOpenChange={setIsAssignTeacherOpen}
                currentSupervisorId={supervisorId}
                assignedTeacherIds={assignedTeachers.map((t: Teacher) => t.id)}
                onAssign={(teacherId) => updateTeacherMutation.mutate({ teacherId, supervisorId })}
                isPending={updateTeacherMutation.isPending}
            />
        </div>
    );
}

function AssignTeacherDialog({
    open,
    onOpenChange,
    currentSupervisorId,
    assignedTeacherIds,
    onAssign,
    isPending,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSupervisorId: string;
    assignedTeacherIds: string[];
    onAssign: (teacherId: string) => void;
    isPending: boolean;
}) {
    const [selectedTeacherId, setSelectedTeacherId] = useState("");

    // Fetch all teachers to show available ones
    const { data: allTeachers = [] } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
        enabled: open,
    });

    // Filter out teachers already assigned to this supervisor
    const availableTeachers = allTeachers.filter(
        (t: Teacher) => !assignedTeacherIds.includes(t.id)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTeacherId) {
            onAssign(selectedTeacherId);
            setSelectedTeacherId("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-black text-foreground">Assign Teacher</DialogTitle>
                    <p className="text-xs text-muted-foreground font-medium">Select a teacher to assign to this supervisor.</p>
                </DialogHeader>
                {availableTeachers.length > 0 ? (
                    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selection</p>
                            <div className="space-y-1.5">
                                <Label htmlFor="teacher" className="text-xs font-bold text-foreground">Teacher Profile</Label>
                                <Select onValueChange={setSelectedTeacherId} value={selectedTeacherId}>
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium focus:ring-2 focus:ring-primary outline-none">
                                        <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-xl">
                                        {availableTeachers.map((teacher: Teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id} className="rounded-xl focus:bg-primary/10">
                                                <div className="flex flex-col py-0.5">
                                                    <span className="font-bold text-sm">{teacher.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                        {teacher.staff_id} {teacher.supervisor_id ? "· Currently Assigned" : "· Unassigned"}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={!selectedTeacherId || isPending} 
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm fab-glow hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                Assign to Supervisor
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="py-12 text-center rounded-2xl bg-accent/20 border border-dashed border-border mt-2">
                        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-30" />
                        <p className="text-sm font-bold text-foreground">No teachers available</p>
                        <p className="text-xs text-muted-foreground mt-1">All teachers are already assigned.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
