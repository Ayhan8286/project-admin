import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingShimmerProps {
    /** Number of skeleton rows / blocks to show */
    rows?: number
    /** Extra className on the wrapper */
    className?: string
    /** Height of each row (Tailwind h-* class, e.g. 'h-8') */
    rowHeight?: string
}

/**
 * Animated shimmer skeleton — replaces Loader2 spinners for async data.
 */
export function LoadingShimmer({ rows = 3, className, rowHeight = "h-8" }: LoadingShimmerProps) {
    return (
        <div className={cn("space-y-3 w-full", className)} aria-busy="true" aria-label="Loading">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className={cn("shimmer-skeleton w-full rounded-lg", rowHeight)}
                    style={{ opacity: 1 - i * 0.15 }}
                />
            ))}
        </div>
    )
}

/** Single-block shimmer (e.g. for a stat card value) */
export function ShimmerBlock({ className }: { className?: string }) {
    return (
        <div className={cn("shimmer-skeleton rounded-md", className)} aria-hidden="true" />
    )
}
