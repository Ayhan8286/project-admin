"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getCourses, getStudentsByCourse, addCourse } from "@/lib/api/courses";
import { Course } from "@/types/student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Users, ArrowLeft, Plus, Library } from "lucide-react";
import { toast } from "sonner";

export default function SubjectsPage() {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState("");

    const queryClient = useQueryClient();

    const { data: courses = [], isLoading: coursesLoading } = useQuery({
        queryKey: ["courses"],
        queryFn: getCourses,
    });

    const { data: students = [], isLoading: studentsLoading } = useQuery({
        queryKey: ["studentsByCourse", selectedCourse?.id],
        queryFn: () => getStudentsByCourse(selectedCourse!.id),
        enabled: !!selectedCourse,
    });

    const addCourseMutation = useMutation({
        mutationFn: (name: string) => addCourse(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            toast.success("Subject added successfully");
            setIsAddDialogOpen(false);
            setNewCourseName("");
        },
        onError: () => {
            toast.error("Failed to add subject");
        }
    });

    if (selectedCourse) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedCourse(null)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-600 text-white">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            {selectedCourse.name} Students
                        </h1>
                        <p className="text-muted-foreground">
                            Students enrolled in {selectedCourse.name}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {students.length} Student{students.length !== 1 ? "s" : ""} Enrolled
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {studentsLoading ? (
                            <div className="p-8 text-center">Loading...</div>
                        ) : students.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">
                                No students found for this subject.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Reg. No.</TableHead>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>Time (PKT)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.student_id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/students/${student.student_id}`}
                                                    className="hover:underline text-blue-600 dark:text-blue-400"
                                                >
                                                    {student.student_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{student.student_reg_no}</TableCell>
                                            <TableCell>{student.teacher_name}</TableCell>
                                            <TableCell>{student.pak_time}</TableCell>
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
                    <p className="text-muted-foreground">
                        Manage academic subjects and view enrollment.
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Subject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Subject</DialogTitle>
                            <DialogDescription>
                                Create a new subject that can be assigned to classes.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newCourseName}
                                    onChange={(e) => setNewCourseName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="e.g. Quran Reading"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => addCourseMutation.mutate(newCourseName)} disabled={!newCourseName}>
                                Save Subject
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {coursesLoading ? (
                <div className="p-8 text-center">Loading subjects...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {courses.map((course) => (
                        <Card
                            key={course.id}
                            className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg group"
                            onClick={() => setSelectedCourse(course)}
                        >
                            <CardHeader className="pb-3 text-center">
                                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Library className="h-6 w-6" />
                                </div>
                                <CardTitle>{course.name}</CardTitle>
                                <CardDescription>Click to view students</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                    {courses.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No subjects found. Click "Add Subject" to create one.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
