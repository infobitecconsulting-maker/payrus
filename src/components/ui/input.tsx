import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-h-9 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors",
        "placeholder:text-foreground/65",
        "hover:border-foreground/45",
        "focus-visible:border-primary",
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
