"use client";

import { getInitials, getAvatarColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  ringColor?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-16 h-16 text-xl md:w-20 md:h-20 md:text-2xl",
};

export default function Avatar({ name, size = "md", ringColor, className = "" }: AvatarProps) {
  const bg = getAvatarColor(name);
  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-full flex items-center justify-center font-semibold font-sans shrink-0`}
      style={{
        backgroundColor: bg + "18",
        color: bg,
        boxShadow: ringColor ? `0 0 0 2px ${ringColor}` : undefined,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
