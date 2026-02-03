"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getTeachers, getTeacherClasses, getAllClasses, getAllTeacherAvailability, addClass, updateClass, deleteClass } from "@/lib/api/classes";
import { getStudents } from "@/lib/api/students";
import { Teacher, ClassSchedule, TeacherAvailability } from "@/types/student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Clock, Loader2, CheckCircle2, Plus, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Time range: 12 PM (noon) to 6 AM (next day) -> Displayed as 12 to 30
// 19 hour span (including end hour)
const START_HOUR = 12; // 12 PM
const END_HOUR = 30;   // 6 AM (next day)
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Width configuration
const HOUR_WIDTH = 160; // Pixels per hour
const TOTAL_WIDTH = (END_HOUR - START_HOUR + 1) * HOUR_WIDTH; // ~3000px

// Helper to convert "h:mm A" string to decimal hours (0-23.99)
const timeToDecimal = (timeStr: string) => {
    if (!timeStr) return 0;

    // Check format (basic check)
    if (!timeStr.includes(" ") && !timeStr.toLowerCase().includes("m")) {
        // Fallback for 24h format if needed
        const [h, m] = timeStr.split(":").map(Number);
        const dec = h + m / 60;
        return dec < 12 ? dec + 24 : dec;
    }

    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (hours === 12) {
        hours = 0;
    }
    if (modifier && modifier.toUpperCase() === "PM") {
        hours += 12;
    }

    let decimalTime = hours + minutes / 60;

    // Shift logic: If time represents early morning (0 AM - 11 AM), 
    // treat it as "next day" for the visualization (24 - 35)
    if (decimalTime < 12) {
        decimalTime += 24;
    }

    return decimalTime;
};

// Helper to format display hour
const formatDisplayHour = (hour: number) => {
    const normalized = hour % 24;
    const h = Math.floor(normalized);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH} ${ampm}`;
};

// Helper to check if a class falls within our display range
const isClassVisible = (start: number, end: number) => {
    return end > START_HOUR && start < END_HOUR;
};

import { AddStudentDialog } from "@/components/students/AddStudentDialog"; // Import new component

export default function TeachersPage() {
    const queryClient = useQueryClient();
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");

    // Dialog States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false); // New state
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    // Forms
    const [addForm, setAddForm] = useState({
        student_id: "",
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
        schedule_days: [] as string[], // Simplified for now, or just handle string input if easier? The API expects JSON.
        // Let's assume user inputs days as comma separated for now or we build a UI. 
        // For speed, let's use Simple Input for days initially or a multi-select if possible.
        // The existing type is Record<string, string>. Let's keep it simple for MVP.
        days_input: "",
    });

    const [editForm, setEditForm] = useState({
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
        days_input: "",
    });

    const { data: teachers = [], isLoading: teachersLoading } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
    });

    const { data: teacherClasses = [], isLoading: classesLoading } = useQuery({
        queryKey: ["teacherClasses", selectedTeacher],
        queryFn: () => getTeacherClasses(selectedTeacher),
        enabled: !!selectedTeacher,
    });

    const { data: allClasses = [], isLoading: allClassesLoading } = useQuery({
        queryKey: ["allClasses"],
        queryFn: getAllClasses,
    });

    const { data: allAvailability = [], isLoading: availabilityLoading } = useQuery({
        queryKey: ["allAvailability"],
        queryFn: getAllTeacherAvailability,
    });

    const { data: students = [] } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    // Mutations
    const addClassMutation = useMutation({
        mutationFn: (newClass: any) => addClass(newClass),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
            setIsAddOpen(false);
            setAddForm({ student_id: "", pak_start_time: "", pak_end_time: "", uk_start_time: "", uk_end_time: "", days_input: "", schedule_days: [] });
        },
    });

    const updateClassMutation = useMutation({
        mutationFn: (updates: any) =>
            selectedClassId ? updateClass(selectedClassId, updates) : Promise.reject("No class selected"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
            setIsEditOpen(false);
        },
    });

    const deleteClassMutation = useMutation({
        mutationFn: (id: string) => deleteClass(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
        },
    });


    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const daysObj: Record<string, string> = {};
        if (addForm.days_input) {
            addForm.days_input.split(",").forEach(d => {
                const day = d.trim();
                if (day) daysObj[day] = "Class";
            });
        }

        addClassMutation.mutate({
            teacher_id: selectedTeacher,
            student_id: addForm.student_id,
            pak_start_time: addForm.pak_start_time,
            pak_end_time: addForm.pak_end_time,
            uk_start_time: addForm.uk_start_time,
            uk_end_time: addForm.uk_end_time,
            schedule_days: daysObj
        });
    };

    const handleEditClick = (cls: any) => {
        setSelectedClassId(cls.id);
        const daysStr = cls.schedule_days ? Object.keys(cls.schedule_days).join(", ") : "";
        setEditForm({
            pak_start_time: cls.pak_start_time,
            pak_end_time: cls.pak_end_time,
            uk_start_time: cls.uk_start_time,
            uk_end_time: cls.uk_end_time,
            days_input: daysStr,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const daysObj: Record<string, string> = {};
        if (editForm.days_input) {
            editForm.days_input.split(",").forEach(d => {
                const day = d.trim();
                if (day) daysObj[day] = "Class";
            });
        }

        updateClassMutation.mutate({
            pak_start_time: editForm.pak_start_time,
            pak_end_time: editForm.pak_end_time,
            uk_start_time: editForm.uk_start_time,
            uk_end_time: editForm.uk_end_time,
            schedule_days: daysObj
        });
    };

    const handleDeleteClick = (id: string) => {
        if (confirm("Are you sure you want to remove this student from the class?")) {
            deleteClassMutation.mutate(id);
        }
    };



    const selectedTeacherData = teachers.find((t: Teacher) => t.id === selectedTeacher);

    // Group classes by schedule days
    const scheduleSummary = teacherClasses.reduce((acc: Record<string, number>, cls: ClassSchedule) => {
        if (cls.schedule_days) {
            Object.keys(cls.schedule_days).forEach((day) => {
                if (!acc[day]) acc[day] = 0;
                acc[day]++;
            });
        }
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Teachers & Schedule</h1>
                <p className="text-muted-foreground">
                    Manage teacher assignments and view availability.
                </p>
            </div>

            <Tabs defaultValue="availability" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="availability">Visual Availability Grid</TabsTrigger>
                    <TabsTrigger value="profile">Teacher Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    {/* Teacher Profile Content - Unchanged */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Teacher</CardTitle>
                            <CardDescription>Choose a teacher to view their specific timetable</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full sm:w-80">
                                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={teachersLoading ? "Loading..." : "Select a teacher"} />
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
                        </CardContent>
                    </Card>

                    {selectedTeacher && (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Teacher</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{selectedTeacherData?.name}</div>
                                        <p className="text-xs text-muted-foreground">Staff ID: {selectedTeacherData?.staff_id}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{teacherClasses.length}</div>
                                        <p className="text-xs text-muted-foreground">Assigned classes</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Schedule</CardTitle>
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(scheduleSummary).map(([day, count]) => (
                                                <span key={day} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                                    {day}: {count}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle>Class Timetable</CardTitle>
                                            <CardDescription>All assigned students and their class times</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setIsCreateStudentOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Student
                                        </Button>
                                        <Button size="sm" onClick={() => setIsAddOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Assign Class
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {classesLoading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : teacherClasses.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-10">No classes assigned to this teacher.</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Reg. No.</TableHead>
                                                    <TableHead>PK Time</TableHead>
                                                    <TableHead>UK Time</TableHead>
                                                    <TableHead>Schedule Days</TableHead>
                                                    <TableHead className="w-[80px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {teacherClasses.map((cls: ClassSchedule & { student: { id: string; full_name: string; reg_no: string } }) => (
                                                    <TableRow key={cls.id}>
                                                        <TableCell className="font-medium">
                                                            <Link href={`/students/${cls.student?.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                                                {cls.student?.full_name || "Unknown"}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>{cls.student?.reg_no || "—"}</TableCell>
                                                        <TableCell>{cls.pak_start_time} - {cls.pak_end_time}</TableCell>
                                                        <TableCell>{cls.uk_start_time} - {cls.uk_end_time}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {cls.schedule_days && Object.entries(cls.schedule_days).map(([day, type]) => (
                                                                    <span key={day} className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-200">{day}</span>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEditClick(cls)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDeleteClick(cls.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>



                <TabsContent value="availability">
                    <Card className="overflow-hidden border-2">
                        {/* ... existing availability content ... */}
                        <CardHeader className="bg-muted/10 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Teacher Availability Matrix</CardTitle>
                                    <CardDescription className="mt-1 flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <span className="inline-block w-4 h-4 border border-dashed border-gray-400 rounded shadow-sm bg-white dark:bg-black"></span>
                                            <span className="text-muted-foreground font-medium">Free Slot</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="inline-block w-4 h-4 bg-blue-600 rounded shadow-sm"></span>
                                            <span className="text-blue-700 font-medium">Class / Occupied</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="inline-block w-4 h-4 bg-muted/20 border-dashed border rounded shadow-sm"></span>
                                            <span className="text-muted-foreground/50 font-medium">Off Shift</span>
                                        </span>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                            {allClassesLoading || availabilityLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <div style={{ minWidth: `${TOTAL_WIDTH}px` }} className="border-t bg-muted/5">
                                    {/* Timeline Header */}
                                    <div className="flex border-b bg-background sticky top-0 z-20 shadow-md">
                                        <div className="w-64 flex-shrink-0 p-4 font-bold border-r bg-background sticky left-0 z-30 flex items-center justify-between shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                                            <span>Teacher</span>
                                            <span className="text-xs font-normal text-muted-foreground">Stats</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            {HOURS.map((hour) => (
                                                <div
                                                    key={hour}
                                                    style={{ width: `${HOUR_WIDTH}px` }}
                                                    className="flex-shrink-0 p-2 text-sm font-medium text-center border-r border-dashed border-gray-200 last:border-r-0 text-muted-foreground uppercase flex items-center justify-center bg-muted/5"
                                                >
                                                    {formatDisplayHour(hour)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Teacher Rows */}
                                    <div className="divide-y relative">
                                        {/* Grid Background Lines */}
                                        <div className="absolute inset-0 flex pl-64 pointer-events-none z-0">
                                            {HOURS.map((hour) => (
                                                <div
                                                    key={hour}
                                                    style={{ width: `${HOUR_WIDTH}px` }}
                                                    className="flex-shrink-0 border-r border-dashed border-gray-200 dark:border-gray-800 last:border-r-0"
                                                />
                                            ))}
                                        </div>

                                        {teachers.map((teacher: Teacher) => {
                                            const teacherSchedule = allClasses.filter((c: ClassSchedule) => c.teacher_id === teacher.id);
                                            const teacherAvailability = allAvailability.filter((a: TeacherAvailability) => a.teacher_id === teacher.id);
                                            const scheduleCount = teacherSchedule.length;

                                            return (
                                                <div key={teacher.id} className="flex h-24 relative hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors group/row border-b last:border-b-0 bg-emerald-50/30 dark:bg-emerald-900/10">
                                                    {/* Teacher Name Column */}
                                                    <div className="w-64 flex-shrink-0 p-3 border-r bg-background sticky left-0 z-10 flex flex-col justify-center shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-sm truncate text-foreground" title={teacher.name}>
                                                                {teacher.name}
                                                            </div>
                                                            {scheduleCount === 0 && (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{teacher.staff_id}</div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className={cn(
                                                                "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                                                                scheduleCount > 0
                                                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                                                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                            )}>
                                                                {scheduleCount > 0 ? `${scheduleCount} Classes` : "Fully Open"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Timeline Content */}
                                                    <div className="flex-1 relative z-0">

                                                        {/* Classes are overlaid on the green background */}
                                                        {teacherSchedule.map((cls: ClassSchedule) => {
                                                            const start = timeToDecimal(cls.pak_start_time);
                                                            const end = timeToDecimal(cls.pak_end_time);

                                                            if (!isClassVisible(start, end)) return null;

                                                            let validEnd = end;
                                                            const leftPx = (start - START_HOUR) * HOUR_WIDTH;
                                                            const widthPx = (validEnd - start) * HOUR_WIDTH;

                                                            const key = `${teacher.id}-${cls.id}`;

                                                            return (
                                                                <div
                                                                    key={key}
                                                                    className="absolute top-2 bottom-2 rounded-md bg-blue-600 dark:bg-blue-600 shadow-md border border-blue-500 z-10 hover:z-50 hover:scale-[1.05] transition-all cursor-pointer group/block flex flex-col justify-center px-2 overflow-hidden"
                                                                    style={{
                                                                        left: `${leftPx}px`,
                                                                        width: `${widthPx}px`,
                                                                    }}
                                                                >
                                                                    <div className="text-[11px] font-bold text-white truncate leading-tight">
                                                                        {cls.pak_start_time}
                                                                    </div>
                                                                    {widthPx > 60 && (
                                                                        <div className="text-[9px] text-blue-100 truncate mt-0.5">
                                                                            Student {cls.student_id ? `#${cls.student_id.substring(0, 4)}` : "?"}
                                                                        </div>
                                                                    )}

                                                                    <div className="absolute opacity-0 group-hover/block:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-3 w-[200px] p-3 bg-slate-900 text-white text-xs rounded-lg shadow-2xl border border-slate-700 pointer-events-none transition-opacity">
                                                                        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                                                                            <span className="font-bold text-blue-400">Class Details</span>
                                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-y-1">
                                                                            <span className="text-slate-400">Start:</span>
                                                                            <span className="font-mono text-right">{cls.pak_start_time}</span>
                                                                            <span className="text-slate-400">End:</span>
                                                                            <span className="font-mono text-right">{cls.pak_end_time}</span>
                                                                            <span className="text-slate-400">Days:</span>
                                                                            <span className="text-right truncate">{cls.schedule_days ? Object.keys(cls.schedule_days).join(", ") : "-"}</span>
                                                                        </div>
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Class Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Student to Class</DialogTitle>
                        <DialogDescription>Add a new class schedule for {selectedTeacherData?.name}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="student">Student</Label>
                                <Select onValueChange={(val) => setAddForm({ ...addForm, student_id: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map((student: any) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.full_name} ({student.reg_no})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>PK Start</Label>
                                    <Input value={addForm.pak_start_time} onChange={e => setAddForm({ ...addForm, pak_start_time: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>PK End</Label>
                                    <Input value={addForm.pak_end_time} onChange={e => setAddForm({ ...addForm, pak_end_time: e.target.value })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>UK Start</Label>
                                    <Input value={addForm.uk_start_time} onChange={e => setAddForm({ ...addForm, uk_start_time: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>UK End</Label>
                                    <Input value={addForm.uk_end_time} onChange={e => setAddForm({ ...addForm, uk_end_time: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Schedule Days (comma separated, e.g. Mon, Wed, Fri)</Label>
                                <Input value={addForm.days_input} onChange={e => setAddForm({ ...addForm, days_input: e.target.value })} placeholder="Mon, Wed, Fri" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={addClassMutation.isPending}>
                                {addClassMutation.isPending ? "Adding..." : "Assign Student"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Class Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Class Schedule</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>PK Start</Label>
                                    <Input value={editForm.pak_start_time} onChange={e => setEditForm({ ...editForm, pak_start_time: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>PK End</Label>
                                    <Input value={editForm.pak_end_time} onChange={e => setEditForm({ ...editForm, pak_end_time: e.target.value })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>UK Start</Label>
                                    <Input value={editForm.uk_start_time} onChange={e => setEditForm({ ...editForm, uk_start_time: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>UK End</Label>
                                    <Input value={editForm.uk_end_time} onChange={e => setEditForm({ ...editForm, uk_end_time: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Schedule Days (comma separated)</Label>
                                <Input value={editForm.days_input} onChange={e => setEditForm({ ...editForm, days_input: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={updateClassMutation.isPending}>
                                {updateClassMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AddStudentDialog
                open={isCreateStudentOpen}
                onOpenChange={setIsCreateStudentOpen}
                defaultTeacherId={selectedTeacher}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["teacherClasses"] });
                    queryClient.invalidateQueries({ queryKey: ["allClasses"] });
                    queryClient.invalidateQueries({ queryKey: ["students"] });
                }}
            />

        </div>
    );
}
