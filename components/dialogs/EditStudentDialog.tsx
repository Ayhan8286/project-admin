"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { updateStudent } from "@/lib/api/students";
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
import { Student } from "@/types/student";

interface EditStudentDialogProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({ student, open, onOpenChange }: EditStudentDialogProps) {
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        full_name: "",
        reg_no: "",
        guardian_name: "",
        status: "Active",
        shift: "",
        supervisor_id: "",
    });

    useEffect(() => {
        if (student && open) {
            setFormData({
                full_name: student.full_name || "",
                reg_no: student.reg_no || "",
                guardian_name: student.guardian_name || "",
                status: student.status || "Active",
                shift: student.shift || "",
                supervisor_id: student.supervisor_id || "",
            });
        }
    }, [student, open]);

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!student) throw new Error("No student selected");
            return await updateStudent(student.id, {
                full_name: formData.full_name,
                reg_no: formData.reg_no,
                status: formData.status,
                shift: formData.shift,
                supervisor_id: formData.supervisor_id || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["student", student?.id] });
            onOpenChange(false);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const getFieldClass = () =>
        "w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] rounded-3xl border-border bg-card max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm">
                            {student?.full_name?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-foreground">Edit Student</DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Update student profile details.</p>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Student Info Section */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student Info</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Full Name *</label>
                                <input
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                    className={getFieldClass()}
                                    placeholder="e.g. Ahmed Khan"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Registration No *</label>
                                <input
                                    name="reg_no"
                                    value={formData.reg_no}
                                    onChange={handleChange}
                                    required
                                    className={getFieldClass()}
                                    placeholder="e.g. AHN-0001"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Guardian Name</label>
                            <input
                                name="guardian_name"
                                value={formData.guardian_name}
                                onChange={handleChange}
                                className={getFieldClass()}
                                placeholder="e.g. Mohammad Khan"
                            />
                        </div>
                    </div>

                    {/* Enrollment Info Section */}
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enrollment Info</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Status</label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                                >
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium focus:ring-2 focus:ring-primary">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                        <SelectItem value="Trial">Trial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Shift / Timing</label>
                                <input
                                    name="shift"
                                    value={formData.shift}
                                    onChange={handleChange}
                                    className={getFieldClass()}
                                    placeholder="e.g. Morning"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Supervisor</label>
                            <Select
                                value={formData.supervisor_id || "none"}
                                onValueChange={(val) =>
                                    setFormData((prev) => ({ ...prev, supervisor_id: val === "none" ? "" : val }))
                                }
                            >
                                <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium focus:ring-2 focus:ring-primary">
                                    <SelectValue placeholder="Select Supervisor" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="none">None</SelectItem>
                                    {supervisors.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
