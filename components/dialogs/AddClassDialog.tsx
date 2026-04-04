"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addClass } from "@/lib/api/classes";
import { updateStudent } from "@/lib/api/students";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormInput } from "@/components/ui/form-input";
import { cn } from "@/lib/utils";
import { ClassSchedule, Student, Teacher } from "@/types/student";
import { toTimeInput, fromTimeInput } from "@/lib/utils/time";
import { TimeSelect } from "@/components/ui/time-select";

interface AddClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacherId: string;
    teacherName: string;
    supervisorId?: string | null;
    students: Student[];
    onSuccess?: () => void;
    convertPkToUk: (time: string) => string;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHORT_DAYS: Record<string, string> = {
    Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
    Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export function AddClassDialog({
    open,
    onOpenChange,
    teacherId,
    teacherName,
    supervisorId,
    students,
    onSuccess,
    convertPkToUk
}: AddClassDialogProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        student_id: "",
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
        selectedDays: new Set<string>(),
    });

    const mutation = useMutation({
        mutationFn: async (newClass: Omit<ClassSchedule, "id" | "teacher" | "app_account" | "course">) => {
            // 1. Add the class
            const result = await addClass(newClass);
            
            // 2. Sync student supervisor if teacher has one
            if (supervisorId) {
                await updateStudent(newClass.student_id, { supervisor_id: supervisorId });
            }
            
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses", teacherId] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
            queryClient.invalidateQueries({ queryKey: ["student", form.student_id] });
            onOpenChange(false);
            setForm({ student_id: "", pak_start_time: "", pak_end_time: "", uk_start_time: "", uk_end_time: "", selectedDays: new Set() });
            onSuccess?.();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const schedule_days: Record<string, string> = {};
        form.selectedDays.forEach(d => { schedule_days[d] = "Class"; });

        mutation.mutate({
            teacher_id: teacherId,
            student_id: form.student_id,
            pak_start_time: form.pak_start_time,
            pak_end_time: form.pak_end_time,
            uk_start_time: form.uk_start_time,
            uk_end_time: form.uk_end_time,
            schedule_days,
            course_id: null,
            app_account_id: null
        });
    };

    const toggleDay = (day: string) => {
        const next = new Set(form.selectedDays);
        if (next.has(day)) next.delete(day); else next.add(day);
        setForm({ ...form, selectedDays: next });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] rounded-3xl border-border bg-card">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Assign Student to Class</DialogTitle>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Add a new class schedule for {teacherName}</p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student</p>
                        <Select onValueChange={(val) => setForm({ ...form, student_id: val })}>
                            <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium">
                                <SelectValue placeholder="Select Student" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {students.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.full_name} ({student.reg_no})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">🇵🇰 Pakistan Time</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <TimeSelect
                                    label="PK Start"
                                    value={form.pak_start_time || "10:00 AM"}
                                    onChange={(val) => {
                                        setForm(f => ({ ...f, pak_start_time: val, uk_start_time: convertPkToUk(val) || f.uk_start_time }));
                                    }}
                                />
                                {form.pak_start_time && (
                                    <p className="text-[10px] text-muted-foreground/60 font-medium px-1">
                                        🇬🇧 UK: {convertPkToUk(form.pak_start_time)}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <TimeSelect
                                    label="PK End"
                                    value={form.pak_end_time}
                                    onChange={(val) => {
                                        setForm(f => ({ ...f, pak_end_time: val, uk_end_time: convertPkToUk(val) || f.uk_end_time }));
                                    }}
                                />
                                {form.pak_end_time && (
                                    <p className="text-[10px] text-muted-foreground/60 font-medium px-1">
                                        🇬🇧 UK: {convertPkToUk(form.pak_end_time)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schedule Days</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_DAYS.map((day) => {
                                const selected = form.selectedDays.has(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={cn(
                                            "px-3 py-2 rounded-full text-xs font-black border transition-all",
                                            selected
                                                ? "bg-primary/15 text-primary border-primary/40"
                                                : "bg-accent/30 text-muted-foreground border-border hover:bg-accent"
                                        )}
                                    >
                                        {SHORT_DAYS[day]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {mutation.isPending ? "Assigning..." : "Assign Student"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
