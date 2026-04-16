"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupervisorById } from "@/lib/api/supervisors";
import { EmployeeDashboard } from "@/components/departments/EmployeeDashboard";
import { Loader2, AlertCircle } from "lucide-react";
import { STALE_LONG } from "@/lib/query-config";

export default function EmployeePersonalDashboard({ params }: { params: Promise<{ slug: string, id: string }> }) {
    const resolvedParams = use(params);
    const { id, slug } = resolvedParams;

    const { data: employee, isLoading, error } = useQuery({
        queryKey: ["employee", id],
        queryFn: () => getSupervisorById(id),
        ...STALE_LONG
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
                <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Profile Not Found</h3>
                <p className="text-muted-foreground mt-2">We couldn't retrieve the requested dashboard.</p>
            </div>
        );
    }

    // Capitalize slug for display
    const departmentName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative min-h-screen">
            <div className="organic-blob bg-primary-container/10 w-[600px] h-[600px] -top-48 -left-24 fixed blur-[120px]"></div>
            <div className="organic-blob bg-tertiary-container/10 w-[500px] h-[500px] bottom-0 right-0 fixed blur-[100px]"></div>

            <div className="p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full relative z-10">
                <EmployeeDashboard 
                    employeeId={employee.id}
                    employeeName={employee.name}
                    department={departmentName}
                />
            </div>
        </div>
    );
}
