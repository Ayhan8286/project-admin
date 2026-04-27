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
    ChevronRight,
    ArrowRight,
    Shield,
    Users
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

export default function DailyReportsPage() {
    const queryClient = useQueryClient();
    const [isMounted, setIsMounted] = useState(false);
    const [authRole, setAuthRole] = useState("admin");
    const [authSupervisorId, setAuthSupervisorId] = useState<string | undefined>(undefined);

    // Form State (Supervisor)
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [reportDate, setReportDate] = useState<Date>(new Date());
    const [reportTime, setReportTime] = useState(format(new Date(), "hh:mm a"));
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Filter State (Admin)
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
        queryFn: getSupervisors,
        enabled: isAdmin
    });

    const { data: teachers = [] } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
        enabled: isAdmin
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

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !description) return;

        setIsSubmitting(true);
        try {
            await submitDailyReport({
                student_id: selectedStudent.id,
                teacher_id: selectedStudent.teacher?.id || "",
                supervisor_id: selectedStudent.supervisor?.id || "",
                date: format(reportDate, "yyyy-MM-dd"),
                time: reportTime,
                description
            });
            setSubmitSuccess(true);
            setDescription("");
            setSelectedStudentId("");
            queryClient.invalidateQueries({ queryKey: ["dailyReports"] });
            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to submit report:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-8 font-display">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-2 flex items-center gap-2">
                        <History className="h-3 w-3" />
                        Academic Tracking
                    </p>
                    <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
                        Daily <span className="text-primary italic">Reports</span>
                    </h1>
                    <p className="text-muted-foreground mt-3 text-sm max-w-md font-medium">
                        {isAdmin 
                            ? "Review and filter daily lesson progress across all students and teachers."
                            : "Record daily lessons and progress for your assigned students."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Form (Supervisor) or Filters (Admin) */}
                <div className="xl:col-span-4 space-y-6">
                    {!isAdmin ? (
                        <div className="bg-card rounded-[32px] border border-border p-8 shadow-sm card-hover relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Plus className="h-24 w-24" />
                            </div>
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-foreground relative z-10">
                                <Plus className="h-5 w-5 text-primary" />
                                New Report
                            </h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Select Student</label>
                                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                        <SelectTrigger className="h-12 rounded-2xl border-border bg-accent/20 px-4 font-bold text-sm shadow-sm">
                                            <SelectValue placeholder="Choose a student..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                                            {students.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.full_name} (#{s.reg_no})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedStudent && (
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-muted-foreground uppercase tracking-wider">Teacher</span>
                                            <span className="text-primary">{selectedStudent.teacher?.name || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-muted-foreground uppercase tracking-wider">Supervisor</span>
                                            <span className="text-primary">{selectedStudent.supervisor?.name || "N/A"}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 font-bold text-xs shadow-sm flex items-center gap-2">
                                                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                                    {format(reportDate, "MMM d, yyyy")}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl">
                                                <Calendar
                                                    mode="single"
                                                    selected={reportDate}
                                                    onSelect={(date) => date && setReportDate(date)}
                                                    className="rounded-md"
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
                                        placeholder="What did the student learn today? Describe topics, progress, or issues..."
                                        className="w-full min-h-[150px] rounded-[24px] border border-border bg-accent/10 p-5 font-medium text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !selectedStudentId || !description}
                                    className={cn(
                                        "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl",
                                        submitSuccess 
                                            ? "bg-green-500 text-white shadow-green-500/20" 
                                            : "bg-primary text-white hover:bg-primary/90 shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : submitSuccess ? (
                                        <>
                                            <CheckCircle2 className="h-5 w-5" />
                                            Report Submitted
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-5 w-5" />
                                            Submit Daily Report
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-card rounded-[32px] border border-border p-8 shadow-sm card-hover">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-foreground">
                                <Filter className="h-5 w-5 text-primary" />
                                Global Filters
                            </h3>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Select Date</label>
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

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Student</label>
                                    <Select value={filterStudentId} onValueChange={setFilterStudentId}>
                                        <SelectTrigger className="h-12 rounded-2xl border-border bg-accent/20 px-4 font-bold text-sm">
                                            <Users className="h-4 w-4 mr-2 text-primary" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                                            <SelectItem value="All">All Students</SelectItem>
                                            {students
                                                .filter(s => filterSupervisorId === "All" || s.supervisor_id === filterSupervisorId)
                                                .map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Reports Feed */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {isAdmin ? "Global Records" : "My Recent Reports"}
                            <span className="text-sm font-bold text-muted-foreground ml-2">({reports.length})</span>
                        </h3>
                    </div>

                    {isLoadingReports ? (
                        <div className="space-y-4">
                            <LoadingShimmer rows={3} rowHeight="h-40" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="bg-card rounded-[32px] border-2 border-dashed border-border p-20 flex flex-col items-center justify-center text-center">
                            <div className="size-16 rounded-3xl bg-accent/30 flex items-center justify-center text-muted-foreground mb-6">
                                <Search className="h-8 w-8" />
                            </div>
                            <p className="text-lg font-black text-foreground">No reports found.</p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                                Try adjusting your filters or date range to find specific records.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {reports.map((report) => (
                                <div 
                                    key={report.id} 
                                    className="bg-card rounded-[32px] border border-border p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                                                        {(report.student?.full_name || "S").substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[17px] font-black text-foreground group-hover:text-primary transition-colors">
                                                            {report.student?.full_name}
                                                        </h4>
                                                        <p className="text-xs font-bold text-muted-foreground">Reg. No: #{report.student?.reg_no}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/50 border border-border text-[10px] font-black uppercase text-muted-foreground">
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {format(new Date(report.date), "MMM d, yyyy")}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-black uppercase text-primary">
                                                        <Clock className="h-3 w-3" />
                                                        {report.time}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-2xl bg-accent/20 border border-border/50 text-sm font-medium leading-relaxed text-foreground/80">
                                                {report.description}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                                                        <User className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase">Faculty</p>
                                                        <p className="text-[11px] font-bold text-foreground">{report.teacher?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                        <Shield className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase">Supervisor</p>
                                                        <p className="text-[11px] font-bold text-foreground">{report.supervisor?.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
