"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BottomNavProps {
    onMoreClick: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
    const pathname = usePathname();

    const navItems = [
        { label: "Home", href: "/dashboard", icon: <LayoutDashboard size={22} /> },
        { label: "Patients", href: "/patients", icon: <Users size={22} /> },
        { label: "Appts", href: "/appointments", icon: <CalendarDays size={22} /> },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface/95 backdrop-blur-md border-t border-border-subtle lg:hidden pb-[env(safe-area-inset-bottom)] h-[spacing-bottom-nav]">
            <div className="flex items-center justify-around h-full px-2">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full relative transition-colors",
                                active ? "text-brand" : "text-text-muted hover:text-text-secondary"
                            )}
                        >
                            {active && (
                                <motion.div
                                    layoutId="bottom-nav-indicator"
                                    className="absolute top-0 w-8 h-1 bg-brand rounded-b-full"
                                />
                            )}
                            {item.icon}
                            <span className="text-[10px] font-medium font-sans">{item.label}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={onMoreClick}
                    className="flex flex-col items-center justify-center gap-1 min-w-[64px] h-full text-text-muted hover:text-text-secondary cursor-pointer"
                >
                    <MoreHorizontal size={22} />
                    <span className="text-[10px] font-medium font-sans">More</span>
                </button>
            </div>
        </nav>
    );
}
