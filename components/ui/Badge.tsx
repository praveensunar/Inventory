import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "default",
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    destructive: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    outline: "text-foreground border-border bg-background/50",
  };

  const dotColors = {
    default: "bg-primary",
    secondary: "bg-muted-foreground",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    destructive: "bg-red-500",
    outline: "bg-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
