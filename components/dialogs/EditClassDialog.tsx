"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClass } from "@/lib/api/classes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormInput } from "@/components/ui/form-input";
import { cn } from "@/lib/utils";
import { ClassSchedule } from "@/types/student";
import { toTimeInput, fromTimeInput } from "@/lib/utils/time";
import { TimeSelect } from "@/components/ui/time-select";

interface EditClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacherId: string;
    classData: (ClassSchedule & { student?: { full_name: string } }) | null;
    onSuccess?: () => void;
    convertPkToUk: (time: string) => string;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHORT_DAYS: Record<string, string> = {
    Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
    Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

// Normalize day names to full form
function normalizeDay(d: string): string {
    const lower = d.trim().toLowerCase();
    for (const full of ALL_DAYS) {
        if (full.toLowerCase() === lower || full.toLowerCase().startsWith(lower.slice(0, 3))) {
            return full;
        }
    }
    return d.trim();
}

export function EditClassDialog({
    open,
    onOpenChange,
    teacherId,
    classData,
    onSuccess,
    convertPkToUk
}: EditClassDialogProps) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        pak_start_time: "",
        pak_end_time: "",
        uk_start_time: "",
        uk_end_time: "",
        selectedDays: new Set<string>(),
    });

    useEffect(() => {
        if (classData && open) {
            const days = new Set<string>(
                classData.schedule_days ? Object.keys(classData.schedule_days).map(normalizeDay) : []
            );
            setForm({
                pak_start_time: classData.pak_start_time || "",
                pak_end_time: classData.pak_end_time || "",
                uk_start_time: classData.uk_start_time || "",
                uk_end_time: classData.uk_end_time || "",
                selectedDays: days,
            });
        }
    }, [classData, open]);

    const mutation = useMutation({
        mutationFn: (updates: Partial<ClassSchedule>) =>
            classData ? updateClass(classData.id, updates) : Promise.reject("No class selected"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherClasses", teacherId] });
            queryClient.invalidateQueries({ queryKey: ["allClasses"] });
            onOpenChange(false);
            onSuccess?.();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const schedule_days: Record<string, string> = {};
        form.selectedDays.forEach(d => { schedule_days[d] = "Class"; });

        mutation.mutate({
            pak_start_time: form.pak_start_time,
            pak_end_time: form.pak_end_time,
            uk_start_time: form.uk_start_time,
            uk_end_time: form.uk_end_time,
            schedule_days,
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
                <DialogHeader className="pb-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm">
                            {classData?.student?.full_name?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-foreground">Edit Class Schedule</DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Adjust timings for {classData?.student?.full_name || "student"}.</p>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">🇵🇰 Pakistan Time</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <TimeSelect
                                    label="PK Start"
                                    value={form.pak_start_time}
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
                            {mutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
