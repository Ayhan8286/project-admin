"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getStudentById, getSiblings, updateStudent } from "@/lib/api/students";
import { getStudentClasses, updateClass, getTeachers } from "@/lib/api/classes";
import { getAppAccounts } from "@/lib/api/platforms";
import { getSupervisors } from "@/lib/api/supervisors";
import { Student, ClassSchedule } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Edit, Users, Calendar, Loader2 } from "lucide-react";

export default function StudentProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const queryClient = useQueryClient();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isClassEditOpen, setIsClassEditOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    const [editForm, setEditForm] = useState<{
        full_name: string;
        reg_no: string;
        status: string;
        shift: string;
        supervisor_id: string;
    }>({
        full_name: "",
        reg_no: "",
        status: "",
        shift: "",
        supervisor_id: "",
    });

    const [classForm, setClassForm] = useState<Partial<ClassSchedule>>({
        teacher_id: "",
        app_account_id: "",
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
    });

    // Queries
    const { data: student, isLoading: studentLoading } = useQuery({
        queryKey: ["student", id],
        queryFn: () => getStudentById(id),
    });

    const { data: siblings = [] } = useQuery({
        queryKey: ["siblings", id],
        queryFn: () => (student ? getSiblings(student) : Promise.resolve([])),
        enabled: !!student,
    });

    const { data: classes = [] } = useQuery({
        queryKey: ["studentClasses", id],
        queryFn: () => getStudentClasses(id),
    });

    const { data: teachers = [] } = useQuery({
        queryKey: ["activeTeachers"],
        queryFn: getTeachers,
    });

    const { data: appAccounts = [] } = useQuery({
        queryKey: ["appAccounts"],
        queryFn: getAppAccounts,
    });

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    // Mutations
    const updateMutation = useMutation({
        mutationFn: (updates: Partial<Pick<Student, "full_name" | "status" | "shift" | "reg_no" | "supervisor_id">>) =>
            updateStudent(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student", id] });
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setIsEditOpen(false);
        },
    });

    const updateClassMutation = useMutation({
        mutationFn: (updates: Partial<ClassSchedule>) =>
            selectedClassId ? updateClass(selectedClassId, updates) : Promise.reject("No class selected"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["studentClasses", id] });
            setIsClassEditOpen(false);
            setSelectedClassId(null);
        },
    });

    // Handlers
    const handleEditOpen = () => {
        if (student) {
            setEditForm({
                full_name: student.full_name,
                reg_no: student.reg_no,
                status: student.status,
                shift: student.shift || "",
                supervisor_id: student.supervisor_id || "",
            });
        }
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(editForm);
    };

    const handleClassEditOpen = (cls: ClassSchedule) => {
        setSelectedClassId(cls.id);
        setClassForm({
            teacher_id: cls.teacher_id,
            app_account_id: cls.app_account_id || "",
            pak_start_time: cls.pak_start_time,
            pak_end_time: cls.pak_end_time,
            uk_start_time: cls.uk_start_time,
            uk_end_time: cls.uk_end_time,
        });
        setIsClassEditOpen(true);
    };

    const handleClassSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateClassMutation.mutate(classForm);
    };

    if (studentLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="space-y-4">
                <Link href="/students" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Students
                </Link>
                <p className="text-red-500">Student not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/students" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{student.full_name}</h1>
                        <p className="text-muted-foreground">Student Profile</p>
                    </div>
                </div>

                {/* Student Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2" onClick={handleEditOpen}>
                            <Edit className="h-4 w-4" />
                            Edit Student
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Student</DialogTitle>
                            <DialogDescription>
                                Update the student&apos;s information below.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_full_name">Full Name</Label>
                                    <Input
                                        id="edit_full_name"
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_reg_no">Registration No.</Label>
                                    <Input
                                        id="edit_reg_no"
                                        value={editForm.reg_no}
                                        onChange={(e) => setEditForm({ ...editForm, reg_no: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_status">Status</Label>
                                    <Select
                                        value={editForm.status}
                                        onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Trial">Trial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_shift">Shift / Timing</Label>
                                    <Input
                                        id="edit_shift"
                                        value={editForm.shift}
                                        onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                                        placeholder="e.g., Morning, Evening, Night"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_supervisor">Supervisor</Label>
                                    <Select
                                        value={editForm.supervisor_id || "none"}
                                        onValueChange={(val) => setEditForm({ ...editForm, supervisor_id: val === "none" ? "" : val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Supervisor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {supervisors.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Student Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Details</CardTitle>
                        <CardDescription>Personal and academic information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Registration No.</p>
                                <p className="font-medium">{student.reg_no}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${student.status?.toLowerCase() === "active"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                        }`}
                                >
                                    {student.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Guardian Name</p>
                                <p className="font-medium">{student.guardian_name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Shift / Timing</p>
                                <p className="font-medium">{student.shift || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Supervisor</p>
                                <p className="font-medium">{student.supervisor?.name || "—"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Siblings Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle>Siblings</CardTitle>
                            <CardDescription>Students with the same guardian</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {siblings.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No siblings found.</p>
                        ) : (
                            <ul className="space-y-2">
                                {siblings.map((sibling) => (
                                    <li key={sibling.id} className="flex items-center justify-between">
                                        <Link
                                            href={`/students/${sibling.id}`}
                                            className="text-sm font-medium hover:underline"
                                        >
                                            {sibling.full_name}
                                        </Link>
                                        <span className="text-xs text-muted-foreground">{sibling.reg_no}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Class Schedule Section */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <CardTitle>Class Schedule</CardTitle>
                        <CardDescription>Assigned classes and teachers</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {classes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No classes assigned.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Time (PK)</TableHead>
                                    <TableHead>Time (UK)</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((cls: ClassSchedule) => (
                                    <TableRow key={cls.id}>
                                        <TableCell className="font-medium">
                                            {cls.teacher?.name || "—"}
                                        </TableCell>
                                        <TableCell>
                                            {cls.app_account ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{cls.app_account.platform}</span>
                                                    <span className="text-xs text-muted-foreground">{cls.app_account.account_identifier}</span>
                                                </div>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {cls.pak_start_time} - {cls.pak_end_time}
                                        </TableCell>
                                        <TableCell>
                                            {cls.uk_start_time} - {cls.uk_end_time}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {cls.schedule_days &&
                                                    Object.entries(cls.schedule_days).map(([day, type]) => (
                                                        <span
                                                            key={day}
                                                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                                        >
                                                            {day}
                                                        </span>
                                                    ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleClassEditOpen(cls)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Class Dialog */}
            <Dialog open={isClassEditOpen} onOpenChange={setIsClassEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Class Schedule</DialogTitle>
                        <DialogDescription>
                            Update teacher, platform, and timing for this class.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleClassSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="teacher">Teacher</Label>
                                <Select
                                    value={classForm.teacher_id}
                                    onValueChange={(val) => setClassForm({ ...classForm, teacher_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map((teacher: any) => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="platform">Platform Account</Label>
                                <Select
                                    value={classForm.app_account_id || ""}
                                    onValueChange={(val) => setClassForm({ ...classForm, app_account_id: val === "none" ? null : val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {appAccounts.map((account: any) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.platform} - {account.account_identifier}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="pak_start">PK Start</Label>
                                    <Input
                                        id="pak_start"
                                        value={classForm.pak_start_time}
                                        onChange={(e) => setClassForm({ ...classForm, pak_start_time: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pak_end">PK End</Label>
                                    <Input
                                        id="pak_end"
                                        value={classForm.pak_end_time}
                                        onChange={(e) => setClassForm({ ...classForm, pak_end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="uk_start">UK Start</Label>
                                    <Input
                                        id="uk_start"
                                        value={classForm.uk_start_time}
                                        onChange={(e) => setClassForm({ ...classForm, uk_start_time: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="uk_end">UK End</Label>
                                    <Input
                                        id="uk_end"
                                        value={classForm.uk_end_time}
                                        onChange={(e) => setClassForm({ ...classForm, uk_end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={updateClassMutation.isPending}>
                                {updateClassMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
