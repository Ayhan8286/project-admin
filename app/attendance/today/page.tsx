"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttendanceByDate, submitAttendance } from "@/lib/api/attendance";
import { getAllClasses } from "@/lib/api/classes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserCheck, UserX, Clock, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AttendanceRecord, ClassSchedule } from "@/types/student";

export default function TodayAttendancePage() {
    const queryClient = useQueryClient();
    const today = new Date().toISOString().split('T')[0];
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue" etc.

    // State for Time Slot Dialog
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
    const [timeZone, setTimeZone] = useState<'PKT' | 'UKT'>('PKT');

    // Queries
    const { data: attendanceData = [], isLoading: isAttendanceLoading } = useQuery({
        queryKey: ["attendance", today],
        queryFn: () => getAttendanceByDate(today),
    });

    const { data: classesData = [], isLoading: isClassesLoading } = useQuery({
        queryKey: ["classes"],
        queryFn: getAllClasses,
    });

    // Mutation
    const attendanceMutation = useMutation({
        mutationFn: submitAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance", today] });
            toast.success("Attendance marked successfully");
            setIsSlotDialogOpen(false);
        },
        onError: (error) => {
            toast.error("Failed to mark attendance");
            console.error(error);
        }
    });

    // Derived Data
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'leave': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const presentStudents = attendanceData.filter(r => r.status === 'Present');
    const absentStudents = attendanceData.filter(r => r.status === 'Absent');
    const lateStudents = attendanceData.filter(r => r.status === 'Late');
    const leaveStudents = attendanceData.filter(r => r.status === 'Leave');

    // Group Classes by Time Slot
    const todaysClasses = classesData.filter((cls: any) => cls.schedule_days && cls.schedule_days[currentDay]);

    const classesByTime: Record<string, any[]> = {};
    if (todaysClasses) {
        todaysClasses.forEach((cls: any) => {
            // Choose time based on selected zone
            // Note: Database field is 'pak_start_time' or 'uk_start_time'
            const time = timeZone === 'PKT'
                ? (cls.pak_start_time || "Unscheduled")
                : (cls.uk_start_time || "Unscheduled");

            if (!classesByTime[time]) classesByTime[time] = [];
            classesByTime[time].push(cls);
        });
    }

    // Sort times
    const sortedTimes = Object.keys(classesByTime).sort((a, b) => {
        // Simple string sort for "HH:MM AM/PM" might work if format is consistent,
        // but strictly better to parse. assuming standard format for now.
        return a.localeCompare(b);
    });

    const handleMarkAttendance = (studentId: string, status: AttendanceRecord['status']) => {
        attendanceMutation.mutate([{
            student_id: studentId,
            date: today,
            status: status
        }]);
    };

    const StudentTable = ({ data }: { data: any[] }) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Reg. No.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No records found for this category.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.student?.full_name || 'Unknown'}</TableCell>
                                <TableCell>{record.student?.reg_no || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`border-0 ${getStatusColor(record.status)}`}>
                                        {record.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Today's Attendance</h1>
                <p className="text-muted-foreground">
                    Detailed view of student attendance for {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
                </p>
            </div>

            {isAttendanceLoading || isClassesLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="all">All Records ({attendanceData.length})</TabsTrigger>
                        <TabsTrigger value="slots" className="text-indigo-600 font-medium">Time Slots</TabsTrigger>
                        <TabsTrigger value="present" className="text-green-600">Present ({presentStudents.length})</TabsTrigger>
                        <TabsTrigger value="absent" className="text-red-600">Absent ({absentStudents.length})</TabsTrigger>
                        <TabsTrigger value="late" className="text-yellow-600">Late ({lateStudents.length})</TabsTrigger>
                        <TabsTrigger value="leave" className="text-blue-600">Leave ({leaveStudents.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        <StudentTable data={attendanceData} />
                    </TabsContent>

                    <TabsContent value="slots">
                        <div className="flex justify-end mb-4">
                            <div className="inline-flex items-center rounded-lg bg-muted p-1 text-muted-foreground">
                                <button
                                    onClick={() => setTimeZone('PKT')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeZone === 'PKT' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    PKT (Pakistan)
                                </button>
                                <button
                                    onClick={() => setTimeZone('UKT')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeZone === 'UKT' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    UKT (UK)
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedTimes.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No classes scheduled for today ({currentDay}) in {timeZone}.
                                </div>
                            ) : (
                                sortedTimes.map((time) => (
                                    <Card
                                        key={time}
                                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-indigo-500"
                                        onClick={() => {
                                            setSelectedSlot(time);
                                            setIsSlotDialogOpen(true);
                                        }}
                                    >
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex justify-between items-center">
                                                {time}
                                                <Badge variant="secondary" className="ml-2">
                                                    {classesByTime[time].length} Classes
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>
                                                {classesByTime[time].length} Students scheduled ({timeZone})
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="present">
                        <StudentTable data={presentStudents} />
                    </TabsContent>
                    <TabsContent value="absent">
                        <StudentTable data={absentStudents} />
                    </TabsContent>
                    <TabsContent value="late">
                        <StudentTable data={lateStudents} />
                    </TabsContent>
                    <TabsContent value="leave">
                        <StudentTable data={leaveStudents} />
                    </TabsContent>
                </Tabs>
            )}

            {/* Slot Details Dialog */}
            <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Classes for {selectedSlot}</DialogTitle>
                        <DialogDescription>
                            Mark attendance for students scheduled at this time.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto space-y-4">
                        {selectedSlot && classesByTime[selectedSlot]?.map((cls: any) => {
                            // Check if student already has attendance today
                            const studentAttendance = attendanceData.find(r => r.student_id === cls.student_id);

                            return (
                                <div key={cls.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                    <div className="mb-4 sm:mb-0">
                                        <h4 className="font-semibold text-base">{cls.student?.full_name}</h4>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>Reg: {cls.student?.reg_no}</p>
                                            <p>Teacher: {cls.teacher?.name}</p>
                                            <p className="text-xs">Subject/Platform: {cls.app_account?.platform || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-wrap justify-end">
                                        {studentAttendance ? (
                                            <div className="flex items-center gap-2">
                                                <Badge className={`text-sm px-3 py-1 ${getStatusColor(studentAttendance.status)}`}>
                                                    Example: {studentAttendance.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">Marked</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleMarkAttendance(cls.student_id, "Present")}>
                                                    Present
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleMarkAttendance(cls.student_id, "Absent")}>
                                                    Absent
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" onClick={() => handleMarkAttendance(cls.student_id, "Late")}>
                                                    Late
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleMarkAttendance(cls.student_id, "Leave")}>
                                                    Leave
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsSlotDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
