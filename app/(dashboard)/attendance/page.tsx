"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getTeachers, getStudentsByTeacher, getTeachersBySupervisor } from "@/lib/api/classes";
import { submitAttendance } from "@/lib/api/attendance";
import { Teacher, AttendanceRecord } from "@/types/student";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarIcon, Check, UserCheck, UserX, Clock, History, CalendarOff, Loader2 } from "lucide-react";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { cn } from "@/lib/utils";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";

interface StudentAttendance {
    student_id: string;
    full_name: string;
    reg_no: string;
    status: AttendanceStatus;
}

export default function AttendancePage() {
    return (
        <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
            <AttendanceContent />
        </Suspense>
    );
}

function AttendanceContent() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const teacherFromUrl = searchParams.get("teacherId");

    const [selectedTeacher, setSelectedTeacher] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Initial effect for URL param
    useEffect(() => {
        if (teacherFromUrl) {
            setSelectedTeacher(teacherFromUrl);
        }
    }, [teacherFromUrl]);

    const { data: teachers = [], isLoading: teachersLoading } = useQuery({
        queryKey: (typeof document !== 'undefined' && document.cookie.includes("auth_role=supervisor")) 
            ? ["teachers", "attendance", "supervisor", document.cookie.split("; ").find(c => c.trim().startsWith("supervisor_id="))?.split("=")[1]]
            : ["teachers", "attendance"],
        queryFn: async () => {
            // Check for supervisor role from cookies
            const cookies = document.cookie.split("; ");
            const role = cookies.find(c => c.trim().startsWith("auth_role="))?.split("=")[1];
            const supervisorId = cookies.find(c => c.trim().startsWith("supervisor_id="))?.split("=")[1];

            if (role === "supervisor" && supervisorId) {
                return await getTeachersBySupervisor(supervisorId);
            }
            return await getTeachers();
        },
    });

    const { data: studentsData = [], isLoading: studentsLoading, isFetched } = useQuery({
        queryKey: ["studentsByTeacher", selectedTeacher],
        queryFn: () => getStudentsByTeacher(selectedTeacher),
        enabled: !!selectedTeacher,
    });

    // Get a stable string representation of the student IDs to use as dependency
    const studentIds = studentsData.map(s => s.student_id).join(',');

    // Initialize attendance list when teacher selection changes and data is fetched
    useEffect(() => {
        if (!selectedTeacher || studentsLoading) {
            return;
        }

        if (studentsData.length > 0) {
            const initialList = studentsData.map((item) => ({
                student_id: item.student_id,
                full_name: (item.student as { full_name: string })?.full_name || "Unknown",
                reg_no: (item.student as { reg_no: string })?.reg_no || "",
                status: "Present" as AttendanceStatus,
            }));
            setAttendanceList(initialList);
            setSubmitSuccess(false);
        } else {
            setAttendanceList([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTeacher, studentIds, studentsLoading]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendanceList((prev) =>
            prev.map((item) =>
                item.student_id === studentId ? { ...item, status } : item
            )
        );
    };

    const handleSubmit = async () => {
        if (!selectedTeacher || attendanceList.length === 0) return;

        setIsSubmitting(true);
        try {
            const records: AttendanceRecord[] = attendanceList.map((item) => ({
                student_id: item.student_id,
                date: format(selectedDate, "yyyy-MM-dd"),
                status: item.status,
            }));

            await submitAttendance(records);
            setSubmitSuccess(true);
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        } catch (error) {
            console.error("Error submitting attendance:", error);
            alert("Failed to submit attendance. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const presentCount = attendanceList.filter((s) => s.status === "Present").length;
    const absentCount = attendanceList.filter((s) => s.status === "Absent").length;
    const lateCount = attendanceList.filter((s) => s.status === "Late").length;
    const leaveCount = attendanceList.filter((s) => s.status === "Leave").length;

    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative w-full mx-auto">
            {/* Organic Background Elements */}
            <div className="organic-blob bg-primary-container/20 w-[600px] h-[600px] -top-48 -left-24 fixed"></div>
            <div className="organic-blob bg-tertiary-container/20 w-[500px] h-[500px] bottom-0 right-0 fixed"></div>

            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 flex-1 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1">Daily Operations</p>
                    <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
                        Attendance Manager
                        <span className="text-primary ml-2 text-2xl">✦</span>
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                        Mark and submit daily attendance for students.
                    </p>
                </div>
                <Link href="/attendance/records">
                    <button className="flex items-center gap-2 px-6 py-3 glass-panel border border-white/20 dark:border-white/5 rounded-full text-sm font-bold hover:bg-accent transition-colors text-foreground shadow-[0px_0px_48px_rgba(45,52,50,0.06)]">
                        <History className="h-4 w-4" />
                        View Records
                    </button>
                </Link>
            </div>

            {/* Main Selection Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teacher Selection */}
                <div className="glass-panel border-white/20 dark:border-white/5 rounded-3xl p-6 border shadow-[0px_0px_48px_rgba(45,52,50,0.06)] flex flex-col card-hover">
                    <h3 className="text-lg font-black mb-2 text-foreground">Select Class</h3>
                    <p className="text-xs text-muted-foreground mb-6 font-medium">Choose a teacher to load their students.</p>
                    <div className="relative z-10">
                        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger className="pill-input h-14 bg-accent/20 border-border rounded-2xl px-5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary focus:border-primary shadow-sm outline-none transition-all">
                                <SelectValue placeholder={teachersLoading ? "Loading..." : "Select Teacher..."} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border shadow-xl">
                                {teachers.map((teacher: Teacher) => (
                                    <SelectItem key={teacher.id} value={teacher.id} className="cursor-pointer font-medium hover:bg-accent focus:bg-accent rounded-xl m-1 transition-colors">
                                        {teacher.name} ({teacher.staff_id})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!selectedTeacher && (
                        <div className="mt-8 flex-1 flex flex-col items-center justify-center text-center opacity-50">
                            <div className="p-4 rounded-full bg-accent mb-3">
                                <UserCheck className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-bold text-foreground">Awaiting Selection</p>
                            <p className="text-xs text-muted-foreground max-w-[200px] mt-1">Please select a teacher from the dropdown to continue.</p>
                        </div>
                    )}
                </div>

                {/* Inline Calendar (only prominent when a teacher is selected) */}
                <div className={cn("glass-panel border-white/20 dark:border-white/5 rounded-3xl p-6 border shadow-[0px_0px_48px_rgba(45,52,50,0.06)] flex flex-col transition-all duration-500", !selectedTeacher ? "opacity-50 pointer-events-none filter blur-[1px]" : "card-hover")}>
                    <h3 className="text-lg font-black mb-2 text-foreground">Select Date</h3>
                    <p className="text-xs text-muted-foreground mb-6 font-medium">Pick the date you are recording attendance for.</p>
                    <div className="flex justify-center bg-accent/10 rounded-3xl border border-border p-4 shadow-inner">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            className="pointer-events-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Student List */}
            {selectedTeacher && (
                <div className="glass-panel border-white/20 dark:border-white/5 rounded-3xl p-6 border shadow-[0px_0px_48px_rgba(45,52,50,0.06)] card-hover animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-black text-foreground">Student Roster</h3>
                            <p className="text-sm text-primary font-bold mt-1">
                                {attendanceList.length} student(s) • {format(selectedDate, "EEEE, MMMM d")}
                            </p>
                        </div>
                        {attendanceList.length > 0 && (
                            <div className="flex flex-wrap gap-3 p-3 bg-accent/30 rounded-2xl border border-border/50">
                                <span className="flex items-center gap-1.5 text-xs font-black bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full">
                                    <UserCheck className="h-3.5 w-3.5" /> Present: {presentCount}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-black bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full">
                                    <UserX className="h-3.5 w-3.5" /> Absent: {absentCount}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-black bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full">
                                    <Clock className="h-3.5 w-3.5" /> Late: {lateCount}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-black bg-indigo-500/10 text-indigo-500 px-3 py-1.5 rounded-full">
                                    <CalendarOff className="h-3.5 w-3.5" /> Leave: {leaveCount}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-accent/5">
                        {studentsLoading ? (
                            <div className="p-6"><LoadingShimmer rows={5} rowHeight="h-14" /></div>
                        ) : attendanceList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <UserX className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                                <h4 className="text-base font-bold text-foreground">No Students Found</h4>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                    There are no students currently assigned to this teacher.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {attendanceList.map((student) => (
                                    <div
                                        key={student.student_id}
                                        className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4 hover:bg-accent/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm shadow-sm">
                                                {student.full_name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-[15px]">{student.full_name}</p>
                                                <p className="text-[11px] font-black tracking-widest uppercase text-muted-foreground mt-0.5">{student.reg_no}</p>
                                            </div>
                                        </div>
                                        <div className="glass-panel p-1.5 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm self-start lg:self-auto">
                                            <ToggleGroup
                                                type="single"
                                                value={student.status}
                                                onValueChange={(value) =>
                                                    value && handleStatusChange(student.student_id, value as AttendanceStatus)
                                                }
                                                className="gap-1 justify-start lg:justify-end"
                                            >
                                                <ToggleGroupItem
                                                    value="Present"
                                                    className="rounded-xl px-4 py-2 text-xs font-black transition-all border border-transparent data-[state=on]:bg-green-500/15 data-[state=on]:text-green-600 data-[state=on]:shadow-[0_0_15px_rgba(34,197,94,0.2)] data-[state=on]:border-green-500/30 text-muted-foreground hover:bg-accent"
                                                >
                                                    <UserCheck className="h-4 w-4 mr-1.5" />
                                                    Present
                                                </ToggleGroupItem>
                                                <ToggleGroupItem
                                                    value="Absent"
                                                    className="rounded-xl px-4 py-2 text-xs font-black transition-all border border-transparent data-[state=on]:bg-red-500/15 data-[state=on]:text-red-500 data-[state=on]:shadow-[0_0_15px_rgba(239,68,68,0.2)] data-[state=on]:border-red-500/30 text-muted-foreground hover:bg-accent"
                                                >
                                                    <UserX className="h-4 w-4 mr-1.5" />
                                                    Absent
                                                </ToggleGroupItem>
                                                <ToggleGroupItem
                                                    value="Late"
                                                    className="rounded-xl px-4 py-2 text-xs font-black transition-all border border-transparent data-[state=on]:bg-yellow-500/15 data-[state=on]:text-yellow-600 data-[state=on]:shadow-[0_0_15px_rgba(234,179,8,0.2)] data-[state=on]:border-yellow-500/30 text-muted-foreground hover:bg-accent"
                                                >
                                                    <Clock className="h-4 w-4 mr-1.5" />
                                                    Late
                                                </ToggleGroupItem>
                                                <ToggleGroupItem
                                                    value="Leave"
                                                    className="rounded-xl px-4 py-2 text-xs font-black transition-all border border-transparent data-[state=on]:bg-indigo-500/15 data-[state=on]:text-indigo-500 data-[state=on]:shadow-[0_0_15px_rgba(99,102,241,0.2)] data-[state=on]:border-indigo-500/30 text-muted-foreground hover:bg-accent"
                                                >
                                                    <CalendarOff className="h-4 w-4 mr-1.5" />
                                                    Leave
                                                </ToggleGroupItem>
                                            </ToggleGroup>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Submit Bar */}
            {attendanceList.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 glass-panel border border-white/20 dark:border-white/5 shadow-[0px_0px_48px_rgba(45,52,50,0.1)] p-3 pr-4 rounded-full animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Check className="h-5 w-5" />
                                Submit Attendance
                            </>
                        )}
                    </button>
                    {submitSuccess && (
                        <div className="flex items-center gap-2 px-4 text-green-500 font-bold text-sm bg-green-500/10 py-2 rounded-full border border-green-500/20">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                            Saved successfully!
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
    );
}
