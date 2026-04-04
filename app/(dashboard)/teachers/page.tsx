"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTeachers, getTeachersBySupervisor, getAllClasses, deleteTeacher } from "@/lib/api/classes";
import { Teacher } from "@/types/student";
import { 
    Users, 
    Calendar, 
    Search, 
    Filter, 
    Eye, 
    Edit2, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    UserPlus, 
    BookOpen 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STALE_SHORT } from "@/lib/query-config";
import { ErrorState } from "@/components/ui/error-state";
import { AddTeacherDialog } from "@/components/dialogs/AddTeacherDialog";
import { EditTeacherDialog } from "@/components/dialogs/EditTeacherDialog";

export default function TeachersPage() {
    const queryClient = useQueryClient();
    const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

    const { data: teachers = [], isLoading: teachersLoading, error: teachersError, refetch: refetchTeachers } = useQuery({
        queryKey: (typeof document !== 'undefined' && document.cookie.includes("auth_role=supervisor")) 
            ? ["teachers", "supervisor", document.cookie.split("; ").find(c => c.trim().startsWith("supervisor_id="))?.split("=")[1]]
            : ["teachers"],
        queryFn: async () => {
            const cookies = document.cookie.split("; ");
            const role = cookies.find(c => c.trim().startsWith("auth_role="))?.split("=")[1];
            const supervisorId = cookies.find(c => c.trim().startsWith("supervisor_id="))?.split("=")[1];

            if (role === "supervisor" && supervisorId) {
                return await getTeachersBySupervisor(supervisorId);
            }
            return await getTeachers();
        },
        ...STALE_SHORT,
    });

    const { data: allClasses = [] } = useQuery({
        queryKey: ["allClasses"],
        queryFn: getAllClasses,
        ...STALE_SHORT,
    });

    const deleteTeacherMutation = useMutation({
        mutationFn: deleteTeacher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
        }
    });

    if (teachersError) {
        return <ErrorState message="Failed to load teachers roster. Please check your connection." onRetry={() => refetchTeachers()} />;
    }

    const filteredTeachers = teachers.filter((teacher: Teacher) =>
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        teacher.staff_id.toLowerCase().includes(teacherSearchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative w-full mx-auto">
            {/* Organic Background Elements */}
            <div className="organic-blob bg-primary-container/20 w-[600px] h-[600px] -top-48 -left-24 fixed"></div>
            <div className="organic-blob bg-tertiary-container/20 w-[500px] h-[500px] bottom-0 right-0 fixed"></div>

            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 flex-1 relative z-10">
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
                        {!(typeof document !== 'undefined' && document.cookie.includes("auth_role=supervisor")) && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsAddTeacherOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all shrink-0"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Add Teacher
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
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
                        <div key={i} className="card-hover relative glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/5 overflow-hidden group flex flex-col gap-3 shadow-[0px_0px_48px_rgba(45,52,50,0.06)]">
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

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                            <input
                                className="pill-input pl-10 pr-5 py-2.5 glass-panel border border-white/20 dark:border-white/5 text-sm text-foreground w-full sm:w-64 placeholder:text-muted-foreground/50"
                                placeholder="Search teachers..."
                                value={teacherSearchQuery}
                                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2.5 glass-panel border border-white/20 dark:border-white/5 rounded-full text-sm font-bold hover:border-primary/30 transition-all text-foreground">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Faculty Directory Table */}
                <div className="space-y-8 mt-6">
                    <div className="glass-panel rounded-3xl shadow-[0px_0px_48px_rgba(45,52,50,0.06)] border border-white/20 dark:border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-white/40 dark:bg-white/5 border-b border-white/10 dark:border-white/5">
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
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="bg-slate-50 dark:bg-[#1a331d]/50 rounded-2xl p-8 max-w-sm mx-auto border border-border">
                                                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                                                    <h3 className="text-base font-bold text-foreground mb-2">No Teachers Found</h3>
                                                    <p className="text-sm text-muted-foreground mb-6">
                                                        {teacherSearchQuery ? "Try adjusting your search filters." : "Start building your faculty roster."}
                                                    </p>
                                                    {!(typeof document !== 'undefined' && document.cookie.includes("auth_role=supervisor")) && (
                                                        <button
                                                            onClick={() => setIsAddTeacherOpen(true)}
                                                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors"
                                                        >
                                                            Add New Teacher
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTeachers.map((teacher: Teacher, index: number) => {
                                            const teacherClasses = allClasses.filter((c: any) => c.teacher_id === teacher.id);
                                            const classCount = teacherClasses.length;
                                            
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
                                                            <button
                                                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center transition-all"
                                                                title="Edit Record"
                                                                onClick={() => {
                                                                    setSelectedTeacher(teacher);
                                                                    setIsEditTeacherOpen(true);
                                                                }}
                                                            >
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
                </div>

                <AddTeacherDialog
                    open={isAddTeacherOpen}
                    onOpenChange={setIsAddTeacherOpen}
                />

                <EditTeacherDialog
                    open={isEditTeacherOpen}
                    onOpenChange={setIsEditTeacherOpen}
                    teacher={selectedTeacher}
                />
            </div>
        </div>
    );
}
