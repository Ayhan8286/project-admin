"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addTeacher } from "@/lib/api/classes";
import { getSupervisors } from "@/lib/api/supervisors";
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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddTeacherDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AddTeacherDialog({ open, onOpenChange, onSuccess }: AddTeacherDialogProps) {
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: "",
        staff_id: "",
        supervisor_id: "",
    });

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    const addMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name: formData.name,
                staff_id: formData.staff_id,
                supervisor_id: formData.supervisor_id || null,
            };
            return await addTeacher(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            if (onSuccess) onSuccess();
            onOpenChange(false);
            setFormData({ name: "", staff_id: "", supervisor_id: "" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMutation.mutate();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Teacher</DialogTitle>
                    <DialogDescription>
                        Create a new teacher profile to assign classes.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="E.g. John Doe"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="staff_id">Staff ID *</Label>
                            <Input
                                id="staff_id"
                                name="staff_id"
                                value={formData.staff_id}
                                onChange={handleInputChange}
                                placeholder="E.g. STAFF-123"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="supervisor">Supervisor</Label>
                            <Select
                                value={formData.supervisor_id || "none"}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, supervisor_id: val === "none" ? "" : val }))}
                            >
                                <SelectTrigger id="supervisor">
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
                        <Button type="submit" disabled={addMutation.isPending}>
                            {addMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Teacher"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
