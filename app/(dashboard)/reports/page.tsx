"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
    History, 
    Plus, 
    Search, 
    Filter, 
    User, 
    BookOpen, 
    Clock, 
    Calendar as CalendarIcon,
    Loader2,
    CheckCircle2,
    Shield,
    Users,
    GraduationCap,
    ArrowUpRight,
    MessageSquareQuote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudentsForReporting, submitDailyReport, getDailyReports, DailyReport } from "@/lib/api/reports";
import { getSupervisors } from "@/lib/api/supervisors";
import { getTeachers } from "@/lib/api/classes";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function DailyReportsPage() {
    const queryClient = useQueryClient();
    const [isMounted, setIsMounted] = useState(false);
    const [authRole, setAuthRole] = useState("admin");
    const [authSupervisorId, setAuthSupervisorId] = useState<string | undefined>(undefined);

    // Supervisor Interaction State
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);
    const [supervisorTeacherFilter, setSupervisorTeacherFilter] = useState<string>("All");
    const [studentSearch, setStudentSearch] = useState("");

    // Form State (Inside Dialog)
    const [reportDate, setReportDate] = useState<Date>(new Date());
    const [reportTime, setReportTime] = useState(format(new Date(), "hh:mm a"));
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Admin Filter State
    const [filterSupervisorId, setFilterSupervisorId] = useState<string>("All");
    const [filterTeacherId, setFilterTeacherId] = useState<string>("All");
    const [filterStudentId, setFilterStudentId] = useState<string>("All");
    const [filterDate, setFilterDate] = useState<Date>(new Date());

    useEffect(() => {
        setIsMounted(true);
        const role = document.cookie.split("; ").find(c => c.trim().startsWith("auth_role="))?.split("=")[1] || "admin";
        const supId = document.cookie.split("; ").find(c => c.trim().startsWith("supervisor_id="))?.split("=")[1];
        setAuthRole(role);
        setAuthSupervisorId(supId);
    }, []);

    const isAdmin = authRole === "admin";

    // Queries
    const { data: students = [], isLoading: isLoadingStudents } = useQuery({
        queryKey: ["studentsForReporting", authSupervisorId],
        queryFn: () => getStudentsForReporting(!isAdmin ? authSupervisorId : undefined),
        enabled: isMounted
    });

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: () => getSupervisors(),
        enabled: isAdmin
    });

    const { data: teachers = [] } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
        enabled: isMounted 
    });

    const { data: reports = [], isLoading: isLoadingReports } = useQuery({
        queryKey: ["dailyReports", isAdmin ? filterSupervisorId : authSupervisorId, filterTeacherId, filterStudentId, format(filterDate, "yyyy-MM-dd")],
        queryFn: () => getDailyReports({
            date: format(filterDate, "yyyy-MM-dd"),
            supervisorId: isAdmin ? (filterSupervisorId === "All" ? undefined : filterSupervisorId) : authSupervisorId,
            teacherId: filterTeacherId === "All" ? undefined : filterTeacherId,
            studentId: filterStudentId === "All" ? undefined : filterStudentId
        }),
        enabled: isMounted
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForReport || !description) return;

        setIsSubmitting(true);
        try {
            await submitDailyReport({
                student_id: selectedStudentForReport.id,
                teacher_id: selectedStudentForReport.teacher?.id || "",
                supervisor_id: selectedStudentForReport.supervisor?.id || "",
                date: format(reportDate, "yyyy-MM-dd"),
                time: reportTime,
                description
            });
            setSubmitSuccess(true);
            setDescription("");
            queryClient.invalidateQueries({ queryKey: ["dailyReports"] });
            setTimeout(() => {
                setSubmitSuccess(false);
                setIsReportDialogOpen(false);
            }, 1500);
        } catch (error) {
            console.error("Failed to submit report:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenReport = (student: any) => {
        setSelectedStudentForReport(student);
        setReportDate(new Date());
        setReportTime(format(new Date(), "hh:mm a"));
        setDescription("");
        setIsReportDialogOpen(true);
    };

    if (!isMounted) return null;

    // Filter students for supervisor view
    const filteredStudents = students.filter(s => {
        const matchesTeacher = supervisorTeacherFilter === "All" || s.teacher?.id === supervisorTeacherFilter;
        const matchesSearch = s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || s.reg_no.includes(studentSearch);
        return matchesTeacher && matchesSearch;
    });

    return (
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-8 font-display">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
                        Daily <span className="text-primary italic">Reports</span>
                    </h1>
                    <p className="text-muted-foreground mt-3 text-sm max-w-md font-medium">
                        {isAdmin 
                            ? "Overview of student progress and lesson tracking."
                            : "Select a student to log their daily progress."}
                    </p>
                </div>

                {!isAdmin && (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Search students..."
                                className="w-full h-12 rounded-2xl border border-border bg-card pl-11 pr-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-56">
                            <Select value={supervisorTeacherFilter} onValueChange={setSupervisorTeacherFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-border bg-card px-4 font-bold text-sm shadow-sm">
                                    <User className="h-4 w-4 mr-2 text-primary" />
                                    <SelectValue placeholder="All Teachers" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border shadow-2xl">
                                    <SelectItem value="All">All Teachers</SelectItem>
                                    {teachers
                                        .filter(t => t.supervisor_id === authSupervisorId)
                                        .map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {!isAdmin ? (
                <div className="space-y-8">
                    {/* Student Grid for Supervisors - Simplified Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {isLoadingStudents ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-40 rounded-[32px] bg-accent/20 animate-pulse" />
                            ))
                        ) : filteredStudents.length === 0 ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card/50 rounded-[32px] border-2 border-dashed border-border">
                                <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                <p className="text-lg font-black text-foreground">No students assigned</p>
                            </div>
                        ) : (
                            filteredStudents.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleOpenReport(student)}
                                    className="group relative bg-card rounded-[32px] border border-border p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 text-left"
                                >
                                    <div className="flex flex-col h-full gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                                            {student.full_name.substring(0, 2).toUpperCase()}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                                                {student.full_name}
                                            </h3>
                                            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                                                ID: #{student.reg_no}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                                            <Plus className="h-3 w-3" />
                                            Add Daily Report
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Admin View - Keep existing logic for overview */}
                    <div className="xl:col-span-4">
                        <div className="bg-card rounded-[32px] border border-border p-8 shadow-sm card-hover sticky top-8">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-foreground">
                                <Filter className="h-5 w-5 text-primary" />
                                Filter Reports
                            </h3>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 font-bold text-sm shadow-sm flex items-center gap-3">
                                                <CalendarIcon className="h-4 w-4 text-primary" />
                                                {format(filterDate, "MMMM d, yyyy")}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl">
                                            <Calendar
                                                mode="single"
                                                selected={filterDate}
                                                onSelect={(date) => date && setFilterDate(date)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Supervisor</label>
                                    <Select value={filterSupervisorId} onValueChange={(val) => { setFilterSupervisorId(val); setFilterTeacherId("All"); }}>
                                        <SelectTrigger className="h-12 rounded-2xl border-border bg-accent/20 px-4 font-bold text-sm">
                                            <Shield className="h-4 w-4 mr-2 text-primary" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                                            <SelectItem value="All">All Supervisors</SelectItem>
                                            {supervisors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Teacher</label>
                                    <Select value={filterTeacherId} onValueChange={setFilterTeacherId}>
                                        <SelectTrigger className="h-12 rounded-2xl border-border bg-accent/20 px-4 font-bold text-sm">
                                            <User className="h-4 w-4 mr-2 text-primary" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                                            <SelectItem value="All">All Teachers</SelectItem>
                                            {teachers
                                                .filter(t => filterSupervisorId === "All" || t.supervisor_id === filterSupervisorId)
                                                .map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-8 space-y-6">
                        {isLoadingReports ? (
                            <LoadingShimmer rows={3} rowHeight="h-40" />
                        ) : reports.length === 0 ? (
                            <div className="bg-card rounded-[32px] border-2 border-dashed border-border p-20 flex flex-col items-center justify-center text-center">
                                <p className="text-lg font-black text-foreground">No reports found.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {reports.map((report) => (
                                    <ReportCard key={report.id} report={report} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Submission Dialog */}
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[40px] border-border bg-card p-0 overflow-hidden shadow-2xl">
                    <div className="bg-primary/10 p-8 flex items-center gap-4 border-b border-primary/10">
                        <div className="w-16 h-16 rounded-[24px] bg-primary flex items-center justify-center text-white">
                            <MessageSquareQuote className="h-8 w-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-foreground">Daily Report</DialogTitle>
                            <DialogDescription className="text-sm font-bold text-primary/60">{selectedStudentForReport?.full_name}</DialogDescription>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button type="button" className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 font-bold text-xs shadow-sm flex items-center gap-2">
                                            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                            {format(reportDate, "MMM d, yyyy")}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl">
                                        <Calendar
                                            mode="single"
                                            selected={reportDate}
                                            onSelect={(date) => date && setReportDate(date)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
                                    <input 
                                        type="text"
                                        value={reportTime}
                                        onChange={(e) => setReportTime(e.target.value)}
                                        className="w-full h-12 rounded-2xl border border-border bg-accent/20 pl-10 pr-4 font-bold text-xs shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Lesson Details</label>
                            <textarea 
                                placeholder="Describe what the student learned today..."
                                className="w-full min-h-[160px] rounded-[32px] border border-border bg-accent/10 p-6 font-medium text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsReportDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-sm uppercase bg-accent/50 text-foreground">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !description}
                                className={cn(
                                    "flex-[2] h-14 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-3 shadow-xl",
                                    submitSuccess ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90"
                                )}
                            >
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : submitSuccess ? <CheckCircle2 className="h-5 w-5" /> : "Submit Report"}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ReportCard({ report }: { report: DailyReport }) {
    return (
        <div className="bg-card rounded-[32px] border border-border p-6 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                                {(report.student?.full_name || "S").substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="text-[17px] font-black text-foreground">{report.student?.full_name}</h4>
                                <p className="text-xs font-bold text-muted-foreground">ID: #{report.student?.reg_no}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 text-[10px] font-black uppercase text-muted-foreground">
                            <span>{format(new Date(report.date), "MMM d, yyyy")}</span>
                            <span className="text-primary">{report.time}</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-accent/20 text-sm font-medium leading-relaxed text-foreground/80 italic">
                        "{report.description}"
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <User className="h-3 w-3 text-orange-500" />
                            {report.teacher?.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <Shield className="h-3 w-3 text-blue-500" />
                            {report.supervisor?.name}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
