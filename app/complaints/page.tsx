"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComplaints, updateComplaintStatus } from "@/lib/api/complaints";
import { AddComplaintDialog } from "@/components/complaints/AddComplaintDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, MessageSquareWarning, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { Complaint } from "@/types/complaint";

export default function ComplaintsPage() {
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);

    const { data: complaints = [], isLoading } = useQuery({
        queryKey: ["complaints"],
        queryFn: getComplaints,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateComplaintStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complaints"] });
        },
    });

    const handleStatusChange = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "Pending" ? "Reviewed" : "Pending";
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Complaints & Issues</h1>
                    <p className="text-muted-foreground">
                        Manage and track student complaints concerning teachers.
                    </p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Complaint
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquareWarning className="h-5 w-5 text-orange-500" />
                        Complaints Log
                    </CardTitle>
                    <CardDescription>Recent complaints submitted by students.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <MessageSquareWarning className="h-10 w-10 mb-2 opacity-20" />
                            <p>No complaints found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead className="w-[40%]">Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {complaints.map((complaint: Complaint) => (
                                    <TableRow key={complaint.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {format(new Date(complaint.created_at), "MMM d, yyyy h:mm a")}
                                        </TableCell>
                                        <TableCell>
                                            <div>{complaint.student?.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{complaint.student?.reg_no}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div>{complaint.teacher?.name}</div>
                                            <div className="text-xs text-muted-foreground">{complaint.teacher?.staff_id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{complaint.title || "Untitled"}</div>
                                            <p className="line-clamp-1 text-sm text-muted-foreground" title={complaint.description}>
                                                {complaint.description}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={complaint.status === "Reviewed" ? "default" : "secondary"}
                                                className={complaint.status === "Pending" ? "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-100" : "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"}
                                            >
                                                {complaint.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStatusChange(complaint.id, complaint.status)}
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                {complaint.status === "Pending" ? (
                                                    <span className="text-blue-600 flex items-center gap-1">Mark Reviewed</span>
                                                ) : (
                                                    <span className="text-muted-foreground flex items-center gap-1">Mark Pending</span>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AddComplaintDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
        </div>
    );
}
