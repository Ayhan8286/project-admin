"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getStudents, addStudent, deleteStudent } from "@/lib/api/students";
import { getTeachers, addClass } from "@/lib/api/classes";
import { getAppAccounts } from "@/lib/api/platforms";
import { Student } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Loader2, Trash2 } from "lucide-react";
import { AddStudentDialog } from "@/components/students/AddStudentDialog";

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Queries
    const { data: students = [], isLoading, error } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        return students.filter((student: Student) =>
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500">Error loading students. Please check your Supabase connection.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                    <p className="text-muted-foreground">
                        Manage student records and information.
                    </p>
                </div>

                <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Student
                </Button>
            </div>
            <AddStudentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by student name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Reg. No.</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Guardian Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    <p className="text-muted-foreground mt-2">Loading students...</p>
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? "No students found matching your search."
                                            : "No students found. Add your first student!"}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student: Student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/students/${student.id}`}
                                            className="hover:underline text-blue-600 dark:text-blue-400"
                                        >
                                            {student.full_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{student.reg_no}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {student.classes?.map((c, i) => (
                                                c.course?.name ? (
                                                    <span key={i} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                                        {c.course.name}
                                                    </span>
                                                ) : null
                                            ))}
                                            {!student.classes?.length && <span className="text-muted-foreground text-xs">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{student.guardian_name}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${student.status?.toLowerCase() === "active"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                                }`}
                                        >
                                            {student.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                                            onClick={() => handleDelete(student.id, student.full_name)}
                                            disabled={deleteMutation.isPending}
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
        </div >
    );
}
