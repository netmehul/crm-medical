"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "brand" | "info" | "danger" | "success" | "warning" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  brand:   { bg: "bg-brand-dim",     text: "text-text-brand", dot: "bg-brand" },
  info:    { bg: "bg-info-dim",      text: "text-info",       dot: "bg-info" },
  danger:  { bg: "bg-danger-dim",    text: "text-danger",     dot: "bg-danger" },
  success: { bg: "bg-success-dim",   text: "text-success",    dot: "bg-success" },
  warning: { bg: "bg-warning-dim",   text: "text-warning",    dot: "bg-warning" },
  muted:   { bg: "bg-bg-overlay",    text: "text-text-muted", dot: "bg-text-muted" },
};

export default function Badge({ variant = "brand", dot = true, pulse = false, children, className }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span className={cn("pill", styles.bg, styles.text, className)}>
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          styles.dot,
          pulse && "animate-pulse"
        )} />
      )}
      {children}
    </span>
  );
}
