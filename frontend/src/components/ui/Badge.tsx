import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        destructive: "border-transparent bg-red-50 text-red-700 hover:bg-red-100",
        warning: "border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100",
        outline: "text-slate-600 border border-slate-200",
        ai: "bg-violet-50 text-violet-700 border border-violet-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

