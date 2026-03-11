"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addStudent } from "@/lib/api/students";
import { getTeachers, addClass } from "@/lib/api/classes";
import { getAppAccounts } from "@/lib/api/platforms";
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

const inputClass = "w-full px-4 py-3 bg-accent/30 border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all";

interface AddStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    defaultTeacherId?: string;
}

export function AddStudentDialog({ open, onOpenChange, onSuccess, defaultTeacherId }: AddStudentDialogProps) {
    const queryClient = useQueryClient();

    // Form States
    const [formData, setFormData] = useState({
        full_name: "",
        reg_no: "",
        guardian_name: "",
        status: "Active",
        shift: "",
        supervisor_id: "",
    });

    const [classFormData, setClassFormData] = useState({
        teacher_id: defaultTeacherId || "",
        app_account_id: "",
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
        schedule_days: {} as Record<string, string>,
    });

    // Effect to update defaultTeacherId if it changes
    useEffect(() => {
        if (defaultTeacherId) {
            setClassFormData(prev => ({ ...prev, teacher_id: defaultTeacherId }));
        }
    }, [defaultTeacherId]);

    // Queries
    const { data: teachers = [] } = useQuery({
        queryKey: ["activeTeachers"],
        queryFn: getTeachers,
    });

    const { data: appAccounts = [] } = useQuery({
        queryKey: ["appAccounts"],
        queryFn: getAppAccounts,
    });

    const { data: supervisors = [] } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    // Mutation
    const addMutation = useMutation({
        mutationFn: async () => {
            // 1. Create Student
            const studentPayload = {
                ...formData,
                supervisor_id: formData.supervisor_id || null, // Fix UUID error
                guardian_id: null,
                shift_id: null,
            };
            const newStudent = await addStudent(studentPayload);

            // 2. Create Class (if enough info provided)
            if (newStudent && newStudent.id && classFormData.teacher_id) {
                await addClass({
                    student_id: newStudent.id,
                    teacher_id: classFormData.teacher_id,
                    app_account_id: classFormData.app_account_id || null,
                    pak_start_time: classFormData.pak_start_time,
                    pak_end_time: classFormData.pak_end_time,
                    uk_start_time: classFormData.uk_start_time,
                    uk_end_time: classFormData.uk_end_time,
                    schedule_days: {}, // Default empty for now
                    course_id: null,
                });
            }
            return newStudent;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["studentsCount"] });
            if (onSuccess) onSuccess();
            onOpenChange(false);
            resetForms();
        },
    });

    const resetForms = () => {
        setFormData({
            full_name: "",
            reg_no: "",
            guardian_name: "",
            status: "Active",
            shift: "",
            supervisor_id: "",
        });
        setClassFormData({
            teacher_id: defaultTeacherId || "",
            app_account_id: "",
            pak_start_time: "",
            pak_end_time: "",
            uk_start_time: "",
            uk_end_time: "",
            schedule_days: {},
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMutation.mutate();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleClassInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setClassFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-black">Add New Student</DialogTitle>
                    <p className="text-xs text-muted-foreground font-medium">Enter student details and assign an initial class.</p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">

                    {/* Student Info */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student Info</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Full Name *</label>
                                <input name="full_name" value={formData.full_name} onChange={handleInputChange} required className={inputClass} placeholder="e.g. Ahmed Ali" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Registration No *</label>
                                <input name="reg_no" value={formData.reg_no} onChange={handleInputChange} required className={inputClass} placeholder="e.g. REG-001" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Guardian Name *</label>
                            <input name="guardian_name" value={formData.guardian_name} onChange={handleInputChange} required className={inputClass} placeholder="e.g. Ali Khan" />
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assignment</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Status *</label>
                                <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
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
                                <input name="shift" value={formData.shift} onChange={handleInputChange} className={inputClass} placeholder="e.g. Morning" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Supervisor</label>
                            <Select value={formData.supervisor_id || "none"} onValueChange={(val) => setFormData(prev => ({ ...prev, supervisor_id: val === "none" ? "" : val }))}>
                                <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                    <SelectValue placeholder="Select Supervisor" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="none">None</SelectItem>
                                    {supervisors.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Initial Class */}
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initial Class <span className="normal-case tracking-normal font-medium text-muted-foreground/60">(optional)</span></p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Teacher</label>
                                <Select value={classFormData.teacher_id || "none"} onValueChange={(val) => setClassFormData(prev => ({ ...prev, teacher_id: val === "none" ? "" : val }))}>
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                        <SelectValue placeholder="Select Teacher" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">None</SelectItem>
                                        {teachers.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Platform</label>
                                <Select value={classFormData.app_account_id || "none"} onValueChange={(val) => setClassFormData(prev => ({ ...prev, app_account_id: val === "none" ? "" : val }))}>
                                    <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                        <SelectValue placeholder="Select Platform" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="none">None</SelectItem>
                                        {appAccounts.map((a: any) => (
                                            <SelectItem key={a.id} value={a.id}>{a.platform} — {a.account_identifier}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">🇵🇰 PK Start Time</label>
                                <input name="pak_start_time" value={classFormData.pak_start_time} onChange={handleClassInputChange} className={inputClass} placeholder="e.g. 2:00 PM" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">🇵🇰 PK End Time</label>
                                <input name="pak_end_time" value={classFormData.pak_end_time} onChange={handleClassInputChange} className={inputClass} placeholder="e.g. 3:00 PM" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">🇬🇧 UK Start Time</label>
                                <input name="uk_start_time" value={classFormData.uk_start_time} onChange={handleClassInputChange} className={inputClass} placeholder="e.g. 9:00 AM" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">🇬🇧 UK End Time</label>
                                <input name="uk_end_time" value={classFormData.uk_end_time} onChange={handleClassInputChange} className={inputClass} placeholder="e.g. 10:00 AM" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={addMutation.isPending}
                            className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {addMutation.isPending ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="h-4 w-4" /> Save Student</>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
