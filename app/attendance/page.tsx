"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { getTeachers, getStudentsByTeacher } from "@/lib/api/classes";
import { submitAttendance } from "@/lib/api/attendance";
import { Teacher, AttendanceRecord } from "@/types/student";
import {
    History,
    Save,
    Filter,
    Users,
    ChevronDown,
    CheckCircle,
} from "lucide-react";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Leave";

interface StudentAttendance {
    student_id: string;
    full_name: string;
    reg_no: string;
    status: AttendanceStatus;
}

export default function AttendancePage() {
    const queryClient = useQueryClient();
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const { data: teachers = [], isLoading: teachersLoading } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
    });

    const { data: studentsData = [], isLoading: studentsLoading } = useQuery({
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
            const msg = error instanceof Error ? error.message : "Unknown error";
            console.error("Error submitting attendance:", msg);
            alert(`Failed to submit attendance: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalStudents = attendanceList.length;
    const presentCount = attendanceList.filter((s) => s.status === "Present").length;
    const absentCount = attendanceList.filter((s) => s.status === "Absent").length;
    const lateCount = attendanceList.filter((s) => s.status === "Late").length;
    // Leaving out Leave count from quick stats as per mockup, but tracking it
    const markedCount = presentCount + absentCount + lateCount + attendanceList.filter((s) => s.status === "Leave").length;
    const progressPercent = totalStudents === 0 ? 0 : Math.round((markedCount / totalStudents) * 100);

    return (
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-display flex-1">
            {/* Gen Z Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1">Daily Records</p>
                    <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
                        Attendance
                        <span className="text-primary ml-2 text-2xl">✦</span>
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm">Mark student attendance for specific classes and teachers.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/attendance/records">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-sm font-bold hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground">
                            <History className="h-4 w-4 text-muted-foreground" />
                            View History
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filters & Stats Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filters */}
                <div className="lg:col-span-2 bg-card rounded-3xl border border-border p-6 shadow-sm card-hover">
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-foreground">
                        <Filter className="h-5 w-5 text-primary" />
                        Session Details
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Class / Batch</label>
                            <div className="relative mb-6">
                                <select
                                    className="pill-input w-full bg-card border border-border rounded-full px-5 py-3 text-sm font-semibold text-foreground appearance-none focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    disabled={teachersLoading}
                                >
                                    <option value="" disabled>{teachersLoading ? 'Loading Teachers...' : 'Select Teacher'}</option>
                                    {teachers.map((teacher: Teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name} ({teacher.staff_id})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground h-5 w-5" />
                            </div>

                            <label className="block text-sm font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Select Date</label>
                            <div className="bg-card border border-border rounded-2xl p-2 w-fit">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date: Date | undefined) => date && setSelectedDate(date)}
                                    className="rounded-md"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm card-hover flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Total Students</span>
                            <span className="text-3xl font-black text-foreground">{studentsLoading ? '-' : totalStudents}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Marked</span>
                            <span className="text-3xl font-black text-primary">{studentsLoading ? '-' : markedCount}</span>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-border mt-2">
                            <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                                <span>Progress</span>
                                <span>{studentsLoading ? '0' : progressPercent}%</span>
                            </div>
                            <div className="w-full bg-accent rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${studentsLoading ? 0 : progressPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student List */}
            {
                selectedTeacher && (
                    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col flex-1 card-hover">
                        <div className="p-5 border-b border-border bg-accent/20 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-primary" />
                                <span className="font-black text-foreground uppercase tracking-wide">Student List</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span> Present</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span> Absent</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]"></span> Late</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"></span> Leave</div>
                            </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="overflow-x-auto min-h-[300px]">
                            {studentsLoading ? (
                                <div className="p-6"><LoadingShimmer rows={5} rowHeight="h-14" /></div>
                            ) : attendanceList.length === 0 ? (
                                <div className="flex items-center justify-center p-12 text-muted-foreground font-semibold">
                                    No students found for this class.
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead className="bg-accent/40 text-muted-foreground text-[10px] uppercase tracking-[0.1em] font-black">
                                        <tr>
                                            <th className="px-6 py-4 border-b border-border">Student Name</th>
                                            <th className="px-6 py-4 border-b border-border">Roll No</th>
                                            <th className="px-6 py-4 text-center border-b border-border">Status</th>
                                            <th className="px-6 py-4 border-b border-border">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {attendanceList.map((student) => {
                                            const isPresent = student.status === "Present";
                                            const isAbsent = student.status === "Absent";
                                            const isLate = student.status === "Late";
                                            const isLeave = student.status === "Leave";

                                            return (
                                                <tr key={student.student_id} className="group hover:bg-accent/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                                                                {student.full_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground text-[15px] group-hover:text-primary transition-colors">{student.full_name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground font-semibold">#{student.reg_no}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2 bg-card p-1.5 rounded-2xl border border-border w-fit mx-auto shadow-sm">
                                                            <button
                                                                onClick={() => handleStatusChange(student.student_id, "Present")}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all",
                                                                    isPresent
                                                                        ? "font-black bg-green-500 text-white shadow-[0_4px_10px_rgba(34,197,94,0.3)] scale-110"
                                                                        : "font-semibold text-muted-foreground hover:bg-green-500/10 hover:text-green-500 hover:scale-105"
                                                                )}
                                                                title="Present"
                                                            >
                                                                P
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(student.student_id, "Absent")}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all",
                                                                    isAbsent
                                                                        ? "font-black bg-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.3)] scale-110"
                                                                        : "font-semibold text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:scale-105"
                                                                )}
                                                                title="Absent"
                                                            >
                                                                A
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(student.student_id, "Late")}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all",
                                                                    isLate
                                                                        ? "font-black bg-yellow-500 text-white shadow-[0_4px_10px_rgba(234,179,8,0.3)] scale-110"
                                                                        : "font-semibold text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-500 hover:scale-105"
                                                                )}
                                                                title="Late"
                                                            >
                                                                L
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(student.student_id, "Leave")}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all",
                                                                    isLeave
                                                                        ? "font-black bg-blue-500 text-white shadow-[0_4px_10px_rgba(59,130,246,0.3)] scale-110"
                                                                        : "font-semibold text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 hover:scale-105"
                                                                )}
                                                                title="Leave"
                                                            >
                                                                Lv
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            className="pill-input w-full max-w-[180px] bg-card border border-border px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:ring-1 focus:ring-primary focus:border-primary"
                                                            placeholder="Add note..."
                                                            type="text"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Footer / Action Bar */}
            {
                attendanceList.length > 0 && !studentsLoading && (
                    <div className="sticky bottom-4 z-10 w-full mt-auto">
                        <div className="bg-card border border-border rounded-3xl shadow-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Marked</span>
                                    <span className="text-2xl font-black text-foreground">{markedCount} <span className="text-sm font-semibold text-muted-foreground">/ {totalStudents} Students</span></span>
                                </div>
                                <div className="h-10 w-px bg-border hidden sm:block"></div>

                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
                                        <span className="font-bold text-foreground">{presentCount} Present</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span>
                                        <span className="font-bold text-foreground">{absentCount} Absent</span>
                                    </div>
                                    {lateCount > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]"></span>
                                            <span className="font-bold text-foreground">{lateCount} Late</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex w-full sm:w-auto gap-3">
                                {submitSuccess ? (
                                    <button disabled className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-green-500/10 text-green-500 font-bold transition-all border border-green-500/20">
                                        <span>Success!</span>
                                        <CheckCircle className="h-5 w-5" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="flex-1 sm:flex-none px-6 py-3 rounded-full border border-border text-foreground font-bold hover:bg-accent transition-colors"
                                            onClick={() => window.location.reload()}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-forest text-white font-black shadow-md transition-all active:scale-95 disabled:opacity-70 fab-glow hover:bg-forest/90"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                    <span>Submitting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Submit Attendance</span>
                                                    <CheckCircle className="h-5 w-5" />
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
