import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-base text-zinc-100 transition-all duration-300 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-zinc-500 focus-visible:border-lime-500/50 focus-visible:bg-white/10 focus-visible:ring-4 focus-visible:ring-lime-500/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white/5 disabled:opacity-50 aria-invalid:border-red-500/50 aria-invalid:ring-4 aria-invalid:ring-red-500/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
