"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { getTeachers, getStudentsByTeacher } from "@/lib/api/classes";
import { submitAttendance } from "@/lib/api/attendance";
import { Teacher, AttendanceRecord } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarIcon, Check, Loader2, UserCheck, UserX, Clock, History, CalendarOff } from "lucide-react";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance Manager</h1>
                    <p className="text-muted-foreground">
                        Mark and submit daily attendance for students.
                    </p>
                </div>
                <Link href="/attendance/records">
                    <Button variant="outline" className="gap-2">
                        <History className="h-4 w-4" />
                        View Records
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Class</CardTitle>
                    <CardDescription>Choose a teacher and date to mark attendance</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <div className="w-full sm:w-64">
                        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger>
                                <SelectValue placeholder={teachersLoading ? "Loading..." : "Select Teacher"} />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((teacher: Teacher) => (
                                    <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name} ({teacher.staff_id})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-[240px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            {/* Student List */}
            {selectedTeacher && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Student Attendance</CardTitle>
                            <CardDescription>
                                {attendanceList.length} student(s) • {format(selectedDate, "EEEE, MMMM d, yyyy")}
                            </CardDescription>
                        </div>
                        {attendanceList.length > 0 && (
                            <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-1 text-green-600">
                                    <UserCheck className="h-4 w-4" /> {presentCount}
                                </span>
                                <span className="flex items-center gap-1 text-red-600">
                                    <UserX className="h-4 w-4" /> {absentCount}
                                </span>
                                <span className="flex items-center gap-1 text-yellow-600">
                                    <Clock className="h-4 w-4" /> {lateCount}
                                </span>
                                <span className="flex items-center gap-1 text-blue-600">
                                    <CalendarOff className="h-4 w-4" /> {leaveCount}
                                </span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {studentsLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : attendanceList.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">
                                No students found for this teacher.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {attendanceList.map((student) => (
                                    <div
                                        key={student.student_id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div>
                                            <p className="font-medium">{student.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{student.reg_no}</p>
                                        </div>
                                        <ToggleGroup
                                            type="single"
                                            value={student.status}
                                            onValueChange={(value) =>
                                                value && handleStatusChange(student.student_id, value as AttendanceStatus)
                                            }
                                            className="gap-1"
                                        >
                                            <ToggleGroupItem
                                                value="Present"
                                                className="data-[state=on]:bg-green-100 data-[state=on]:text-green-800 dark:data-[state=on]:bg-green-900 dark:data-[state=on]:text-green-200"
                                            >
                                                <UserCheck className="h-4 w-4 mr-1" />
                                                Present
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value="Absent"
                                                className="data-[state=on]:bg-red-100 data-[state=on]:text-red-800 dark:data-[state=on]:bg-red-900 dark:data-[state=on]:text-red-200"
                                            >
                                                <UserX className="h-4 w-4 mr-1" />
                                                Absent
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value="Late"
                                                className="data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-800 dark:data-[state=on]:bg-yellow-900 dark:data-[state=on]:text-yellow-200"
                                            >
                                                <Clock className="h-4 w-4 mr-1" />
                                                Late
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value="Leave"
                                                className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800 dark:data-[state=on]:bg-blue-900 dark:data-[state=on]:text-blue-200"
                                            >
                                                <CalendarOff className="h-4 w-4 mr-1" />
                                                Leave
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Submit Button */}
            {attendanceList.length > 0 && (
                <div className="flex items-center gap-4">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Submit Attendance
                            </>
                        )}
                    </Button>
                    {submitSuccess && (
                        <span className="text-green-600 flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Attendance submitted successfully!
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
