"use client";

import { getInitials, getAvatarColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  ringColor?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export default function Avatar({ name, size = "md", ringColor }: AvatarProps) {
  const bg = getAvatarColor(name);
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold font-sans shrink-0`}
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
