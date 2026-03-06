import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 backdrop-blur-sm",
    {
        variants: {
            variant: {
                default: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
                secondary: "bg-white/8 text-muted-foreground border border-border",
                destructive: "bg-red-500/15 text-red-300 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]",
                outline: "text-muted-foreground border border-border",
                // Neon status pills
                present: "badge-present",
                absent: "badge-absent",
                late: "badge-late",
                leave: "badge-leave",
                pending: "badge-pending",
                resolved: "badge-resolved",
                warning: "badge-warning",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
