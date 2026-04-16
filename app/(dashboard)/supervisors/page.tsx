"use client";

import { SupervisorsTab } from "@/components/departments/SupervisorsTab";

export default function SupervisorsPageWrapper() {
    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative">
            {/* Organic Background Elements */}
            <div className="organic-blob bg-primary-container/20 w-[600px] h-[600px] -top-48 -left-24 fixed"></div>
            <div className="organic-blob bg-tertiary-container/20 w-[500px] h-[500px] bottom-0 right-0 fixed"></div>

            <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full relative z-10">
                <div className="mb-4">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/60">Redirected from legacy view</p>
                </div>
                <SupervisorsTab />
            </div>
        </div>
    );
}
