"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addStudent } from "@/lib/api/students";
import { getTeachers, addClass } from "@/lib/api/classes";
import { getAppAccounts } from "@/lib/api/platforms";
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

    // Mutation
    const addMutation = useMutation({
        mutationFn: async () => {
            // 1. Create Student
            const newStudent = await addStudent({
                ...formData,
                guardian_id: null,
                shift_id: null,
            });

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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                        Enter student details and assign initial class.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 py-4">
                        {/* Student Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Student Info</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="full_name">Full Name *</Label>
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="reg_no">Registration No *</Label>
                                    <Input
                                        id="reg_no"
                                        name="reg_no"
                                        value={formData.reg_no}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="guardian_name">Guardian Name *</Label>
                                    <Input
                                        id="guardian_name"
                                        name="guardian_name"
                                        value={formData.guardian_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Trial">Trial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="shift">Shift / Timing</Label>
                                <Input
                                    id="shift"
                                    name="shift"
                                    value={formData.shift}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Morning"
                                />
                            </div>
                        </div>

                        {/* Class Details Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Initial Class Class</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="teacher">Teacher</Label>
                                    <Select
                                        value={classFormData.teacher_id}
                                        onValueChange={(val) => setClassFormData(prev => ({ ...prev, teacher_id: val }))}
                                    >
                                        <SelectTrigger id="teacher">
                                            <SelectValue placeholder="Select Teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teachers.map((t: any) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="platform">Platform</Label>
                                    <Select
                                        value={classFormData.app_account_id}
                                        onValueChange={(val) => setClassFormData(prev => ({ ...prev, app_account_id: val === "none" ? "" : val }))}
                                    >
                                        <SelectTrigger id="platform">
                                            <SelectValue placeholder="Select Platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {appAccounts.map((a: any) => (
                                                <SelectItem key={a.id} value={a.id}>{a.platform} - {a.account_identifier}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="pak_start_time">PK Start Time</Label>
                                    <Input
                                        id="pak_start_time"
                                        name="pak_start_time"
                                        value={classFormData.pak_start_time}
                                        onChange={handleClassInputChange}
                                        placeholder="e.g. 14:00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pak_end_time">PK End Time</Label>
                                    <Input
                                        id="pak_end_time"
                                        name="pak_end_time"
                                        value={classFormData.pak_end_time}
                                        onChange={handleClassInputChange}
                                        placeholder="e.g. 15:00"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="uk_start_time">UK Start Time</Label>
                                    <Input
                                        id="uk_start_time"
                                        name="uk_start_time"
                                        value={classFormData.uk_start_time}
                                        onChange={handleClassInputChange}
                                        placeholder="e.g. 09:00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="uk_end_time">UK End Time</Label>
                                    <Input
                                        id="uk_end_time"
                                        name="uk_end_time"
                                        value={classFormData.uk_end_time}
                                        onChange={handleClassInputChange}
                                        placeholder="e.g. 10:00"
                                    />
                                </div>
                            </div>
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
                                "Save Student"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
