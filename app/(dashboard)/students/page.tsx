"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/departments/students");
    }, [router]);

    return (
        <div className="flex-1 flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}
