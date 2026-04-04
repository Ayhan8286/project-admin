"use client";

import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimeSelectProps {
    value: string; // "h:mm AM/PM"
    onChange: (newValue: string) => void;
    label?: string;
    className?: string;
}

export function TimeSelect({ value, onChange, label, className }: TimeSelectProps) {
    const parseValue = (val: string) => {
        const match = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
            return {
                hour: match[1],
                minute: match[2],
                period: match[3].toUpperCase() as "AM" | "PM",
            };
        }
        return { hour: "12", minute: "00", period: "AM" as "AM" | "PM" };
    };

    const [parts, setParts] = useState(parseValue(value || "12:00 AM"));

    useEffect(() => {
        if (value) {
            setParts(parseValue(value));
        }
    }, [value]);

    const handleChange = (newParts: Partial<typeof parts>) => {
        const updated = { ...parts, ...newParts };
        setParts(updated);
        onChange(`${updated.hour}:${updated.minute} ${updated.period}`);
    };

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

    return (
        <div className={cn("space-y-1.5", className)}>
            {label && <label className="text-xs font-bold text-foreground">{label}</label>}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="flex h-11 w-full items-center gap-2 rounded-2xl border border-border bg-accent/30 px-4 text-sm font-bold transition-all hover:bg-accent/50 text-left focus:ring-2 focus:ring-primary/20"
                    >
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="flex-1">
                            {parts.hour}:{parts.minute} {parts.period}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 rounded-3xl border-border bg-card shadow-2xl overflow-hidden" align="start">
                    <div className="flex h-[240px]">
                        {/* Hours */}
                        <div 
                            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-2 space-y-1"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1 sticky top-0 bg-card z-10 border-b border-border/50 pb-2 mb-2">Hour</p>
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleChange({ hour: h })}
                                    className={cn(
                                        "w-full px-3 py-2 text-xs font-bold rounded-xl transition-all text-left",
                                        parts.hour === h ? "bg-primary text-white" : "hover:bg-accent"
                                    )}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                        {/* Minutes */}
                        <div 
                            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-2 space-y-1 border-l border-r border-border"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1 sticky top-0 bg-card z-10 border-b border-border/50 pb-2 mb-2">Min</p>
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleChange({ minute: m })}
                                    className={cn(
                                        "w-full px-3 py-2 text-xs font-bold rounded-xl transition-all text-left",
                                        parts.minute === m ? "bg-primary text-white" : "hover:bg-accent"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        {/* Period */}
                        <div 
                            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-2 space-y-1 bg-accent/10"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1 sticky top-0 bg-accent z-10 border-b border-border/50 pb-2 mb-2">Period</p>
                            {["AM", "PM"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleChange({ period: p as "AM" | "PM" })}
                                    className={cn(
                                        "w-full px-3 py-2 text-xs font-black rounded-xl transition-all text-left",
                                        parts.period === p ? "bg-primary text-white" : "hover:bg-accent"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
