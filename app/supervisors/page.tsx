"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupervisors, addSupervisor, deleteSupervisor } from "@/lib/api/supervisors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Loader2, Users, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SupervisorsPage() {
    const [search, setSearch] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteSupervisor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supervisors"] });
            toast.success("Supervisor deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete supervisor");
        },
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            deleteMutation.mutate(id);
        }
    };

    const { data: supervisors = [], isLoading } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    const filteredSupervisors = supervisors.filter((supervisor) =>
        supervisor.name.toLowerCase().includes(search.toLowerCase()) ||
        (supervisor.email && supervisor.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Supervisors</h2>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Supervisor
                    </Button>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search supervisors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredSupervisors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No supervisors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSupervisors.map((supervisor) => (
                                <TableRow key={supervisor.id}>
                                    <TableCell className="font-medium">{supervisor.name}</TableCell>
                                    <TableCell>{supervisor.email || "-"}</TableCell>
                                    <TableCell>{supervisor.phone || "-"}</TableCell>
                                    <TableCell>
                                        {supervisor.created_at
                                            ? (() => {
                                                try {
                                                    return format(new Date(supervisor.created_at), "PPP");
                                                } catch (e) {
                                                    return "Invalid Date";
                                                }
                                            })()
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/supervisors/${supervisor.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    View Students
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                onClick={() => handleDelete(supervisor.id, supervisor.name)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddSupervisorDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
        </div>
    );
}

function AddSupervisorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const addMutation = useMutation({
        mutationFn: addSupervisor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supervisors"] });
            onOpenChange(false);
            setFormData({ name: "", email: "", phone: "" });
            toast.success("Supervisor added successfully");
        },
        onError: (error) => {
            toast.error("Failed to add supervisor");
            console.error("Supervisors Page Error:", JSON.stringify(error, null, 2));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Supervisor</DialogTitle>
                    <DialogDescription>
                        Add a new supervisor to the system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={addMutation.isPending}>
                            {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Supervisor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
