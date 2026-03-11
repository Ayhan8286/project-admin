/**
 * Centralised React Query timing configuration.
 * Import these objects into useQuery calls to keep caching behaviour consistent.
 *
 * Usage:
 *   useQuery({ queryKey: ["supervisors"], queryFn: getSupervisors, ...STALE_LONG })
 */

/** 5-minute stale time — for mostly-static data (supervisors, teachers) */
export const STALE_LONG = {
    staleTime: 5 * 60 * 1000,   // 5 min
    gcTime: 10 * 60 * 1000,  // 10 min (keep in memory after unmount)
} as const;

/** 1-minute stale time — for frequently-updated data (students, classes, attendance) */
export const STALE_SHORT = {
    staleTime: 60 * 1000,       // 1 min
    gcTime: 5 * 60 * 1000,   // 5 min
} as const;

/** No stale time — always fresh (live dashboards, today's attendance) */
export const STALE_NONE = {
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
} as const;
