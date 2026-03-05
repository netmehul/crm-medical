"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect";
}

export default function Skeleton({ className, variant = "text" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "text" && "h-4 w-full rounded",
        variant === "circle" && "h-10 w-10 rounded-full",
        variant === "rect" && "h-24 w-full rounded-xl",
        className
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton variant="circle" className="h-7 w-7" />
      </div>
      <Skeleton className="h-9 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
