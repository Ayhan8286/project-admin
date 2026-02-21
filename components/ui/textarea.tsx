import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "input-glass min-h-[80px] w-full rounded-lg px-3 py-2 text-sm resize-none",
                "placeholder:text-slate-500 selection:bg-violet-500/40 selection:text-white",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
                className
            )}
            {...props}
        />
    )
}

export { Textarea }
