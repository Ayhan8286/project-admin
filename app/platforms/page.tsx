"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getPlatforms, getStudentsByPlatform } from "@/lib/api/platforms";
import { Platform } from "@/types/student";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Video, Monitor, Layers, Loader2, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const platformIcons: Record<string, typeof Video> = {
    Zoom: Video,
    Teams: Monitor,
    Hybrid: Layers,
};

const platformColors: Record<string, string> = {
    Zoom: "from-blue-500 to-blue-600",
    Teams: "from-purple-500 to-purple-600",
    Hybrid: "from-orange-500 to-orange-600",
};

export default function PlatformsPage() {
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

    const { data: platforms = [], isLoading: platformsLoading } = useQuery({
        queryKey: ["platforms"],
        queryFn: getPlatforms,
    });

    const { data: students = [], isLoading: studentsLoading } = useQuery({
        queryKey: ["studentsByPlatform", selectedPlatform?.id],
        queryFn: () => getStudentsByPlatform(selectedPlatform!.id),
        enabled: !!selectedPlatform,
    });

    if (selectedPlatform) {
        const Icon = platformIcons[selectedPlatform.name] || Video;
        const gradient = platformColors[selectedPlatform.name] || "from-gray-500 to-gray-600";

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPlatform(null)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            {selectedPlatform.name} Students
                        </h1>
                        <p className="text-muted-foreground">
                            Students whose classes are conducted on {selectedPlatform.name}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {students.length} Student{students.length !== 1 ? "s" : ""} Found
                        </CardTitle>
                        <CardDescription>
                            With their account identifiers and class details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {studentsLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : students.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">
                                No students found for this platform.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Reg. No.</TableHead>
                                        <TableHead>Account Identifier</TableHead>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>PK Time</TableHead>
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
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                                    {student.account_identifier}
                                                </span>
                                            </TableCell>
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platforms</h1>
                <p className="text-muted-foreground">
                    View students by their class platform (Zoom, Teams, Hybrid).
                </p>
            </div>

            {platformsLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    {platforms.map((platform) => {
                        const Icon = platformIcons[platform.name] || Video;
                        const gradient = platformColors[platform.name] || "from-gray-500 to-gray-600";

                        return (
                            <Card
                                key={platform.id}
                                className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                                onClick={() => setSelectedPlatform(platform)}
                            >
                                <CardHeader className="pb-3">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-2`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle>{platform.name}</CardTitle>
                                    <CardDescription>Click to view students</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        View all students whose classes are conducted on {platform.name}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
