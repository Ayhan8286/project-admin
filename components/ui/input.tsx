import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Glass base
        "input-glass h-11 w-full min-w-0 rounded-2xl px-4 py-2 text-sm",
        // File inputs
        "file:text-slate-300 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // States
        "placeholder:text-slate-500 selection:bg-violet-500/40 selection:text-white",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:box-shadow-[inset_0_0_0_1px_rgba(239,68,68,0.6)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
