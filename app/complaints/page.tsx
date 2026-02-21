"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComplaints, updateComplaintStatus } from "@/lib/api/complaints";
import { AddComplaintDialog } from "@/components/complaints/AddComplaintDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { Plus, MessageSquareWarning } from "lucide-react";
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
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">Complaints &amp; Issues</h1>
                    <p className="text-slate-400">
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
                        <div className="py-8"><LoadingShimmer rows={4} rowHeight="h-10" /></div>
                    ) : complaints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                                <MessageSquareWarning className="h-8 w-8 text-violet-400/50" />
                            </div>
                            <p className="text-slate-400 text-sm">No complaints logged yet.</p>
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
                                            <div className="text-slate-200">{complaint.teacher?.name}</div>
                                            <div className="text-xs text-slate-500">{complaint.teacher?.staff_id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{complaint.title || "Untitled"}</div>
                                            <p className="line-clamp-1 text-sm text-muted-foreground" title={complaint.description}>
                                                {complaint.description}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={complaint.status === "Pending" ? "pending" : "resolved"}>
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
                                                    <span className="text-violet-400 flex items-center gap-1">Mark Reviewed</span>
                                                ) : (
                                                    <span className="text-slate-500 flex items-center gap-1">Mark Pending</span>
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
