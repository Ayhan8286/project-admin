"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import Link from "next/link";
import { getAttendanceByDate, AttendanceWithStudent } from "@/lib/api/attendance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CalendarIcon, UserCheck, UserX, Clock, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "Present" | "Absent" | "Late";

export default function AttendanceRecordsPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(subDays(new Date(), 1)); // Default to yesterday
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const { data: records = [], isLoading } = useQuery({
        queryKey: ["attendanceRecords", format(selectedDate, "yyyy-MM-dd")],
        queryFn: () => getAttendanceByDate(format(selectedDate, "yyyy-MM-dd")),
    });

    const filteredRecords = statusFilter === "all"
        ? records
        : records.filter((r) => r.status === statusFilter);

    const summary = {
        total: records.length,
        present: records.filter((r) => r.status === "Present").length,
        absent: records.filter((r) => r.status === "Absent").length,
        late: records.filter((r) => r.status === "Late").length,
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            Present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            Absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
        return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/attendance">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
                    <p className="text-muted-foreground">
                        View recorded attendance by date
                    </p>
                </div>
            </div>

            {/* Date Picker & Summary */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Select Date</CardTitle>
                        <CardDescription>Choose a date to view attendance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Pick a date"}
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

                        {/* Quick date buttons */}
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDate(new Date())}
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDate(subDays(new Date(), 1))}
                            >
                                Yesterday
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                        <CardDescription>{format(selectedDate, "MMMM d, yyyy")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div
                                    className={cn(
                                        "rounded-lg p-3 cursor-pointer transition-colors",
                                        statusFilter === "all" ? "bg-blue-100 dark:bg-blue-900" : "bg-muted hover:bg-blue-50"
                                    )}
                                    onClick={() => setStatusFilter("all")}
                                >
                                    <p className="text-2xl font-bold">{summary.total}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                                <div
                                    className={cn(
                                        "rounded-lg p-3 cursor-pointer transition-colors",
                                        statusFilter === "Present" ? "bg-green-100 dark:bg-green-900" : "bg-muted hover:bg-green-50"
                                    )}
                                    onClick={() => setStatusFilter("Present")}
                                >
                                    <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                                    <p className="text-xs text-muted-foreground">Present</p>
                                </div>
                                <div
                                    className={cn(
                                        "rounded-lg p-3 cursor-pointer transition-colors",
                                        statusFilter === "Absent" ? "bg-red-100 dark:bg-red-900" : "bg-muted hover:bg-red-50"
                                    )}
                                    onClick={() => setStatusFilter("Absent")}
                                >
                                    <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                                    <p className="text-xs text-muted-foreground">Absent</p>
                                </div>
                                <div
                                    className={cn(
                                        "rounded-lg p-3 cursor-pointer transition-colors",
                                        statusFilter === "Late" ? "bg-yellow-100 dark:bg-yellow-900" : "bg-muted hover:bg-yellow-50"
                                    )}
                                    onClick={() => setStatusFilter("Late")}
                                >
                                    <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
                                    <p className="text-xs text-muted-foreground">Late</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Records Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {statusFilter === "all" ? "All Records" : `${statusFilter} Students`}
                        <span className="text-sm font-normal text-muted-foreground">
                            ({filteredRecords.length})
                        </span>
                    </CardTitle>
                    {statusFilter !== "all" && (
                        <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
                            Clear Filter
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">
                            {records.length === 0
                                ? "No attendance recorded for this date."
                                : `No ${statusFilter.toLowerCase()} records for this date.`}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Reg. No.</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.map((record: AttendanceWithStudent) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">
                                            {record.student?.id ? (
                                                <Link
                                                    href={`/students/${record.student.id}`}
                                                    className="hover:underline text-blue-600 dark:text-blue-400"
                                                >
                                                    {record.student.full_name}
                                                </Link>
                                            ) : (
                                                "Unknown Student"
                                            )}
                                        </TableCell>
                                        <TableCell>{record.student?.reg_no || "—"}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                getStatusBadge(record.status)
                                            )}>
                                                {record.status === "Present" && <UserCheck className="h-3 w-3" />}
                                                {record.status === "Absent" && <UserX className="h-3 w-3" />}
                                                {record.status === "Late" && <Clock className="h-3 w-3" />}
                                                {record.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {record.remarks || "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
