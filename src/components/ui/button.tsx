import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-heading text-sm font-semibold leading-tight transition-colors outline-none disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-pr-navy-600 active:bg-pr-navy-700",
        secondary:
          "border border-border bg-transparent text-foreground hover:bg-foreground/[0.07] active:bg-foreground/[0.14]",
        ghost: "text-primary hover:bg-primary/10 active:bg-primary/[0.18]",
      },
      size: {
        default: "px-[18px] py-2",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
