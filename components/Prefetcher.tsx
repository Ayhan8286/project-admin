"use client";

/**
 * Prefetcher — mounts invisibly in the root layout and silently
 * warms the React Query cache for every tab's data.
 *
 * This means by the time a user clicks a sidebar link, the data
 * is already in memory and the page shows instantly.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStudents } from "@/lib/api/students";
import { getTeachers, getAllClasses, getAllTeacherAvailability } from "@/lib/api/classes";
import { getSupervisors } from "@/lib/api/supervisors";
import { getComplaints } from "@/lib/api/complaints";
import { getPlatforms } from "@/lib/api/platforms";

export function Prefetcher() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Stagger the prefetches so they don't all fire at once and
        // compete with the initial dashboard render.

        // Tier 1: Most-visited tabs — fire immediately
        queryClient.prefetchQuery({ queryKey: ["teachers"], queryFn: getTeachers });
        queryClient.prefetchQuery({ queryKey: ["students"], queryFn: getStudents });

        // Tier 2: Secondary tabs — slight delay so dashboard paint isn't delayed
        const t1 = setTimeout(() => {
            queryClient.prefetchQuery({ queryKey: ["supervisors"], queryFn: getSupervisors });
            queryClient.prefetchQuery({ queryKey: ["complaints"], queryFn: getComplaints });
        }, 800);

        // Tier 3: Heavy / less-visited data — fetch last
        const t2 = setTimeout(() => {
            queryClient.prefetchQuery({ queryKey: ["allClasses"], queryFn: getAllClasses });
            queryClient.prefetchQuery({ queryKey: ["allAvailability"], queryFn: getAllTeacherAvailability });
            queryClient.prefetchQuery({ queryKey: ["platforms"], queryFn: getPlatforms });
        }, 1800);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
        // Only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Renders nothing — purely a side-effect component
    return null;
}
