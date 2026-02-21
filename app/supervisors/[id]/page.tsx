"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupervisorById } from "@/lib/api/supervisors";
import { getStudents, updateStudent } from "@/lib/api/students";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, ArrowLeft, Calendar, UserCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function SupervisorDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const supervisorId = resolvedParams.id;
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

    // Fetch Supervisor Details
    const { data: supervisor, isLoading: isLoadingSupervisor } = useQuery({
        queryKey: ["supervisor", supervisorId],
        queryFn: () => getSupervisorById(supervisorId),
    });

    // Fetch All Students (to filter for this supervisor and for assignment)
    const { data: allStudents = [], isLoading: isLoadingStudents } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    const assignedStudents = allStudents.filter(s => s.supervisor_id === supervisorId);

    // Mutation to Assign/Unassign Student
    const updateStudentMutation = useMutation({
        mutationFn: ({ studentId, supervisorId }: { studentId: string, supervisorId: string | null }) =>
            updateStudent(studentId, { supervisor_id: supervisorId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            toast.success("Student list updated successfully");
            setIsAddStudentOpen(false);
        },
        onError: (error) => {
            toast.error("Failed to update student assignment");
            console.error(error);
        }
    });

    const handleRemoveStudent = (studentId: string) => {
        if (confirm("Are you sure you want to remove this student from the supervisor?")) {
            updateStudentMutation.mutate({ studentId, supervisorId: null });
        }
    };

    if (isLoadingSupervisor || isLoadingStudents) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (!supervisor) {
        return <div className="p-8">Supervisor not found</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center space-x-2">
                <Link href="/supervisors">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">{supervisor.name}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Students</div>
                    <div className="text-2xl font-bold">{assignedStudents.length}</div>
                </div>
                {/* Add more stats if needed */}
            </div>

            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Assigned Students</h3>
                <Button onClick={() => setIsAddStudentOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Assign Student
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reg No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assignedStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No students assigned to this supervisor.
                                </TableCell>
                            </TableRow>
                        ) : (
                            assignedStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.reg_no}</TableCell>
                                    <TableCell className="font-medium">{student.full_name}</TableCell>
                                    <TableCell>{student.status}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link href={`/attendance/student/${student.id}`}>
                                            <Button variant="outline" size="sm" title="View Attendance">
                                                <UserCheck className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/students/${student.id}/timetable`}>
                                            {/* Assuming timetable route exists or similar, sticking to verified paths mostly */}
                                            <Button variant="outline" size="sm" title="View Timetable">
                                                <Calendar className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveStudent(student.id)}
                                            disabled={updateStudentMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddStudentDialog
                open={isAddStudentOpen}
                onOpenChange={setIsAddStudentOpen}
                currentSupervisorId={supervisorId}
                allStudents={allStudents}
                onAssign={(studentId) => updateStudentMutation.mutate({ studentId, supervisorId })}
                isPending={updateStudentMutation.isPending}
            />
        </div>
    );
}

function AddStudentDialog({
    open,
    onOpenChange,
    currentSupervisorId,
    allStudents,
    onAssign,
    isPending
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSupervisorId: string;
    allStudents: any[];
    onAssign: (studentId: string) => void;
    isPending: boolean;
}) {
    const [selectedStudentId, setSelectedStudentId] = useState("");

    // Filter students who are NOT assigned to ANY supervisor or at least not THIS supervisor? 
    // Requirement says "add students", implies picking from pool. 
    // Usually unassigned students. Let's filter out students already assigned to THIS supervisor.
    // If they are assigned to another, we might want to warn or allow stealing. 
    // For simplicity, showing all students not assigned to THIS supervisor.
    const availableStudents = allStudents.filter(s => s.supervisor_id !== currentSupervisorId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentId) {
            onAssign(selectedStudentId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Student</DialogTitle>
                    <DialogDescription>
                        Select a student to assign to this supervisor.
                    </DialogDescription>
                </DialogHeader>
                {availableStudents.length > 0 ? (
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="student">Student</Label>
                                <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStudents.map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.full_name} ({student.reg_no}) {student.supervisor_id ? "(Assigned)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={!selectedStudentId || isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Assign
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="py-6 text-center text-muted-foreground">
                        No students available to assign.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
