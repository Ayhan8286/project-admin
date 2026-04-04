"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { updateTeacher } from "@/lib/api/classes";
import { getSupervisors } from "@/lib/api/supervisors";
import {
    Dialog,
    DialogContent,
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
import { Loader2, Save } from "lucide-react";
import { Teacher } from "@/types/student";
import { Supervisor } from "@/types/supervisor";
import { toast } from "sonner";
import { FormInput } from "@/components/ui/form-input";

interface EditTeacherDialogProps {
    teacher: Teacher | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}



export function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: "",
        staff_id: "",
        email: "",
        phone: "",
        timing: "",
        supervisor_id: "",
    });

    useEffect(() => {
        if (teacher && open) {
            setFormData({
                name: teacher.name || "",
                staff_id: teacher.staff_id || "",
                email: teacher.email || "",
                phone: teacher.phone || "",
                timing: teacher.timing || "",
                supervisor_id: teacher.supervisor_id || "",
            });
        }
    }, [teacher, open]);

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!teacher) throw new Error("No teacher selected");
            return await updateTeacher(teacher.id, {
                name: formData.name,
                staff_id: formData.staff_id,
                email: formData.email || null,
                phone: formData.phone || null,
                timing: formData.timing || null,
                supervisor_id: formData.supervisor_id || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            onOpenChange(false);
            toast.success("Teacher updated successfully");
        },
        onError: () => {
            toast.error("Failed to update teacher");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] rounded-[32px] border-border bg-card max-h-[90vh] overflow-y-auto shadow-2xl">
                <DialogHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm">
                            {teacher?.name?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">Edit Teacher</DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Update teacher details and assignment.</p>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Identity */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                label="Full Name *"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. John Doe"
                            />
                            <FormInput
                                label="Staff ID *"
                                name="staff_id"
                                value={formData.staff_id}
                                onChange={handleChange}
                                required
                                placeholder="e.g. STAFF-123"
                            />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. john@school.com"
                            />
                            <FormInput
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. +92 300 1234567"
                            />
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assignment</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Timing</label>
                                <Select value={formData.timing || "none"} onValueChange={(val) => setFormData(prev => ({ ...prev, timing: val === "none" ? "" : val }))}>
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium focus:ring-2 focus:ring-primary">
                                        <SelectValue placeholder="Select Timing" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="Morning">Morning</SelectItem>
                                        <SelectItem value="Night">Night</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Supervisor</label>
                                <Select value={formData.supervisor_id || "none"} onValueChange={(val) => setFormData(prev => ({ ...prev, supervisor_id: val === "none" ? "" : val }))}>
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium focus:ring-2 focus:ring-primary">
                                        <SelectValue placeholder="Select Supervisor" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">None</SelectItem>
                                        {supervisors.map((s: Supervisor) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {updateMutation.isPending ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="h-4 w-4" /> Save Changes</>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
