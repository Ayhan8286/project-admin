"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
    Search, 
    User, 
    Clock, 
    Calendar as CalendarIcon,
    Loader2,
    CheckCircle2,
    Plus,
    Users,
    MessageSquareQuote,
    Filter,
    Shield,
    BookOpen,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudentsForReporting, getDailyReports, DailyReport } from "@/lib/api/reports";
import { submitDailyReportAction } from "@/lib/actions/reports";
import { getSupervisors } from "@/lib/api/supervisors";
import { getTeachers } from "@/lib/api/classes";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { toast } from "sonner";
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
} from "@/components/ui/dialog";

export default function DailyReportsPage() {
    const queryClient = useQueryClient();
    const [isMounted, setIsMounted] = useState(false);
    const [authRole, setAuthRole] = useState<string | null>(null);
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
    const [lessonType, setLessonType] = useState<string>("Nazra");
    const [surahOrBook, setSurahOrBook] = useState<string>("");
    const [ayatOrPageFrom, setAyatOrPageFrom] = useState<string>("");
    const [ayatOrPageTo, setAyatOrPageTo] = useState<string>("");
    const [performanceGrade, setPerformanceGrade] = useState<string>("Good");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Admin Filter State
    const [filterSupervisorId, setFilterSupervisorId] = useState<string>("All");
    const [filterTeacherId, setFilterTeacherId] = useState<string>("All");
    const [filterStudentId, setFilterStudentId] = useState<string>("All");
    const [filterDate, setFilterDate] = useState<Date>(new Date());

    useEffect(() => {
        const role = document.cookie.split("; ").find(c => c.trim().startsWith("auth_role="))?.split("=")[1] || "admin";
        const supId = document.cookie.split("; ").find(c => c.trim().startsWith("supervisor_id="))?.split("=")[1];
        setAuthRole(role);
        setAuthSupervisorId(supId);
        setIsMounted(true);
    }, []);

    const isAdmin = authRole === "admin";
    const isSupervisor = authRole === "supervisor";

    // Queries
    const { data: students = [], isLoading: isLoadingStudents } = useQuery({
        queryKey: ["studentsForReporting", authSupervisorId],
        queryFn: () => getStudentsForReporting(isSupervisor ? authSupervisorId : undefined),
        enabled: isMounted && !!authRole
    });

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: () => getSupervisors(),
        enabled: isMounted && isAdmin
    });

    const { data: teachers = [] } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
        enabled: isMounted && !!authRole
    });

    const { data: reports = [], isLoading: isLoadingReports } = useQuery({
        queryKey: ["dailyReports", isAdmin ? filterSupervisorId : authSupervisorId, filterTeacherId, filterStudentId, format(filterDate, "yyyy-MM-dd")],
        queryFn: () => getDailyReports({
            date: format(filterDate, "yyyy-MM-dd"),
            supervisorId: isAdmin ? (filterSupervisorId === "All" ? undefined : filterSupervisorId) : authSupervisorId,
            teacherId: filterTeacherId === "All" ? undefined : filterTeacherId,
            studentId: filterStudentId === "All" ? undefined : filterStudentId
        }),
        enabled: isMounted && !!authRole
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForReport || !description) return;

        setIsSubmitting(true);
        try {
            const teacherId = selectedStudentForReport.teacher?.id;
            const supervisorId = selectedStudentForReport.supervisor_id || authSupervisorId;

            if (!teacherId || !supervisorId) {
                toast.error("This student is missing a teacher or supervisor assignment. Please contact admin.");
                setIsSubmitting(false);
                return;
            }

            await submitDailyReportAction({
                student_id: selectedStudentForReport.id,
                teacher_id: teacherId,
                supervisor_id: supervisorId,
                date: format(reportDate, "yyyy-MM-dd"),
                time: reportTime,
                description,
                metadata: {
                    lessonType,
                    surahOrBook,
                    ayatOrPageFrom,
                    ayatOrPageTo,
                    performanceGrade
                }
            });
            setSubmitSuccess(true);
            toast.success("Daily report submitted successfully!");
            setDescription("");
            setLessonType("Nazra");
            setSurahOrBook("");
            setAyatOrPageFrom("");
            setAyatOrPageTo("");
            setPerformanceGrade("Good");
            queryClient.invalidateQueries({ queryKey: ["dailyReports"] });
            setTimeout(() => {
                setSubmitSuccess(false);
                setIsReportDialogOpen(false);
            }, 1000);
        } catch (error) {
            console.error("Failed to submit report:", error);
            toast.error("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenReport = (student: any) => {
        setSelectedStudentForReport(student);
        setReportDate(new Date());
        setReportTime(format(new Date(), "hh:mm a"));
        
        // Find if there's already a report for this student today
        const existingReport = reports.find(r => r.student_id === student.id);
        if (existingReport) {
            setDescription(existingReport.description);
            setReportTime(existingReport.time);
            setLessonType(existingReport.metadata?.lessonType || "Nazra");
            setSurahOrBook(existingReport.metadata?.surahOrBook || "");
            setAyatOrPageFrom(existingReport.metadata?.ayatOrPageFrom || "");
            setAyatOrPageTo(existingReport.metadata?.ayatOrPageTo || "");
            setPerformanceGrade(existingReport.metadata?.performanceGrade || "Good");
        } else {
            setDescription("");
            setLessonType("Nazra");
            setSurahOrBook("");
            setAyatOrPageFrom("");
            setAyatOrPageTo("");
            setPerformanceGrade("Good");
        }
        
        setIsReportDialogOpen(true);
    };

    if (!isMounted || !authRole) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
        );
    }

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
                        {isSupervisor 
                            ? "Select a student to log their daily progress."
                            : "Overview of student progress and lesson tracking."}
                    </p>
                </div>

                {isSupervisor && (
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

            {/* Supervisor View: ONLY Student List and Popup */}
            {isSupervisor && (
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
                        filteredStudents.map((student) => {
                            const isReportedToday = reports.some(r => r.student_id === student.id);
                            
                            return (
                                <button
                                    key={student.id}
                                    onClick={() => handleOpenReport(student)}
                                    className={cn(
                                        "group relative bg-card rounded-[32px] border p-8 shadow-sm transition-all duration-300 text-left overflow-hidden",
                                        isReportedToday 
                                            ? "border-green-500/30 bg-green-500/[0.02] opacity-80" 
                                            : "border-border hover:shadow-xl hover:scale-[1.02] active:scale-95"
                                    )}
                                >
                                    {isReportedToday && (
                                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-green-500/20">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Submitted
                                        </div>
                                    )}

                                    <div className="flex flex-col h-full gap-5">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border transition-colors",
                                            isReportedToday
                                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                : "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white"
                                        )}>
                                            {student.full_name.substring(0, 1).toUpperCase()}
                                        </div>

                                        <div>
                                            <h3 className={cn(
                                                "text-xl font-black transition-colors leading-tight",
                                                isReportedToday ? "text-foreground/60" : "text-foreground group-hover:text-primary"
                                            )}>
                                                {student.full_name}
                                            </h3>
                                            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                                                ID: #{student.reg_no}
                                            </p>
                                        </div>

                                        <div className={cn(
                                            "mt-2 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest border-t border-border/50 pt-4",
                                            isReportedToday ? "text-green-600" : "text-primary"
                                        )}>
                                            {isReportedToday ? (
                                                <>
                                                    <History className="h-3 w-3" />
                                                    View / Edit Report
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-3 w-3" />
                                                    Add Report
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            )}

            {/* Admin View: Full Analytics and Records */}
            {isAdmin && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
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
                        <div className="flex items-center justify-between mb-2 px-1">
                            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Global Records
                                <span className="text-sm font-bold text-muted-foreground ml-2">({reports.length})</span>
                            </h3>
                        </div>

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

            {/* Submission Dialog (Universal) */}
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[40px] border-border bg-card p-0 overflow-hidden shadow-2xl">
                    <div className="bg-primary/10 p-8 border-b border-primary/10">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-20 h-20 rounded-[28px] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                                <User className="h-10 w-10" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black text-foreground leading-tight">
                                    {selectedStudentForReport?.full_name}
                                </DialogTitle>
                                <p className="text-sm font-bold text-primary/70 uppercase tracking-[0.1em]">
                                    #{selectedStudentForReport?.reg_no} · {selectedStudentForReport?.status}
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-card/50 p-3 rounded-2xl border border-primary/5">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Guardian</p>
                                <p className="text-xs font-bold text-foreground truncate">{selectedStudentForReport?.guardian_name || "N/A"}</p>
                            </div>
                            <div className="bg-card/50 p-3 rounded-2xl border border-primary/5">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Shift</p>
                                <p className="text-xs font-bold text-foreground">{selectedStudentForReport?.shift || "N/A"}</p>
                            </div>
                            <div className="bg-card/50 p-3 rounded-2xl border border-primary/5">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Teacher</p>
                                <p className="text-xs font-bold text-foreground truncate">{selectedStudentForReport?.teacher?.name || "N/A"}</p>
                            </div>
                            <div className="bg-card/50 p-3 rounded-2xl border border-primary/5">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Supervisor</p>
                                <p className="text-xs font-bold text-foreground truncate">{selectedStudentForReport?.supervisor?.name || "N/A"}</p>
                            </div>
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



                        <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Lesson Type</label>
                                <Select value={lessonType} onValueChange={setLessonType}>
                                    <SelectTrigger className="w-full h-12 rounded-2xl border-border bg-accent/20 px-4 font-bold text-xs shadow-sm">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-2xl">
                                        <SelectItem value="Nazra">Nazra (Recitation)</SelectItem>
                                        <SelectItem value="Hifz">Hifz (Memorization)</SelectItem>
                                        <SelectItem value="Tajweed">Tajweed</SelectItem>
                                        <SelectItem value="Translation">Translation</SelectItem>
                                        <SelectItem value="Tafseer">Tafseer</SelectItem>
                                        <SelectItem value="Revision">Revision (Dour)</SelectItem>
                                        <SelectItem value="Qaida">Noorani Qaida</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Performance / Grade</label>
                                <Select value={performanceGrade} onValueChange={setPerformanceGrade}>
                                    <SelectTrigger className="w-full h-12 rounded-2xl border-border bg-accent/20 px-4 font-bold text-xs shadow-sm">
                                        <SelectValue placeholder="Select grade" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-2xl">
                                        <SelectItem value="Excellent">Excellent (A+)</SelectItem>
                                        <SelectItem value="Good">Good (A)</SelectItem>
                                        <SelectItem value="Average">Average (B)</SelectItem>
                                        <SelectItem value="Needs Improvement">Needs Improvement (C)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Surah / Book Name</label>
                            <input 
                                type="text"
                                placeholder="e.g. Al-Baqarah, Yaseen, Qaida Part 1"
                                value={surahOrBook}
                                onChange={(e) => setSurahOrBook(e.target.value)}
                                className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Start (Ayat / Page)</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Ayat 1"
                                    value={ayatOrPageFrom}
                                    onChange={(e) => setAyatOrPageFrom(e.target.value)}
                                    className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">End (Ayat / Page)</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Ayat 5"
                                    value={ayatOrPageTo}
                                    onChange={(e) => setAyatOrPageTo(e.target.value)}
                                    className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Additional Remarks (Optional)</label>
                            <textarea 
                                placeholder="Describe any specific feedback or notes..."
                                className="w-full min-h-[100px] rounded-[24px] border border-border bg-accent/10 p-6 font-medium text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
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
                                {(report.student?.full_name || "S").substring(0, 1).toUpperCase()}
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

                    {report.metadata && Object.keys(report.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {report.metadata.lessonType && (
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
                                    {report.metadata.lessonType}
                                </span>
                            )}
                            {report.metadata.surahOrBook && (
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                    Surah/Book: {report.metadata.surahOrBook}
                                </span>
                            )}
                            {(report.metadata.ayatOrPageFrom || report.metadata.ayatOrPageTo) && (
                                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                                    Range: {report.metadata.ayatOrPageFrom} - {report.metadata.ayatOrPageTo}
                                </span>
                            )}
                            {report.metadata.performanceGrade && (
                                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest">
                                    Grade: {report.metadata.performanceGrade}
                                </span>
                            )}
                        </div>
                    )}
                    {report.description && (
                        <div className="p-4 rounded-2xl bg-accent/20 text-sm font-medium leading-relaxed text-foreground/80 italic">
                            "{report.description}"
                        </div>
                    )}
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
