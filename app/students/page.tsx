"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getStudents, addStudent } from "@/lib/api/students";
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
import { Plus, Search, Loader2 } from "lucide-react";
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
                            <TableHead>Guardian Name</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    <p className="text-muted-foreground mt-2">Loading students...</p>
                                </TableCell>
                            </TableRow>
                        ) : filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
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
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
