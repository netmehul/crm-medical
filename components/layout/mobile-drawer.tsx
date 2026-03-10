"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/avatar";

/* Standardized Navigation from Sidebar */
import {
    LayoutDashboard, Users, CalendarDays, FileText, History,
    Package, Settings, Briefcase, Building2, CreditCard, UserCog, FlaskConical,
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    moduleKey?: string;
    adminOnly?: boolean;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const allNavSections: NavSection[] = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
        ],
    },
    {
        title: "Patients",
        items: [
            { label: "Patients", href: "/patients", icon: <Users size={20} /> },
            { label: "Appointments", href: "/appointments", icon: <CalendarDays size={20} /> },
            { label: "Prescriptions", href: "/prescriptions", icon: <FileText size={20} /> },
            { label: "Follow-ups", href: "/history", icon: <History size={20} /> },
        ],
    },
    {
        title: "Operations",
        items: [
            { label: "Medical Reps", href: "/medical-reps", icon: <Briefcase size={20} />, moduleKey: "mrManagement" },
            { label: "Inventory", href: "/inventory", icon: <Package size={20} />, moduleKey: "inventory" },
            { label: "External Labs", href: "/labs", icon: <FlaskConical size={20} />, moduleKey: "external_labs" },
        ],
    },
    {
        title: "Management",
        items: [
            { label: "Branches", href: "/branches", icon: <Building2 size={20} />, adminOnly: true },
            { label: "Team", href: "/team", icon: <UserCog size={20} />, adminOnly: true },
            { label: "Billing", href: "/billing", icon: <CreditCard size={20} />, adminOnly: true },
            { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
        ],
    },
];

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const pathname = usePathname();
    const { user, clinic, logout, isPlatformAdmin } = useAuth();
    const role = user?.role || "receptionist";
    const isOrgAdmin = role === "org_admin" && !isPlatformAdmin;
    const planModules = clinic?.planModules || {};

    const filteredSections = allNavSections.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (item.moduleKey && !planModules[item.moduleKey]) return false;
            if (item.adminOnly && !isOrgAdmin) return false;
            return true;
        }),
    })).filter(section => section.items.length > 0);

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-bg-void/60 backdrop-blur-sm lg:hidden"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 bottom-0 z-[70] w-[280px] bg-bg-surface border-r border-border-subtle lg:hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                            <Link href="/dashboard" onClick={onClose} className="font-display font-extrabold text-lg text-text-primary">
                                Medi<span className="text-brand">CRM</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-hover cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Profile Summary */}
                        <div className="p-4 bg-bg-base/50 border-b border-border-subtle flex items-center gap-3">
                            <Avatar name={user?.name || "User"} size="md" ringColor="var(--brand)" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
                                <p className="text-xs text-text-muted">{clinic?.name}</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                            {filteredSections.map((section) => (
                                <div key={section.title} className="space-y-1">
                                    <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                                        {section.title}
                                    </p>
                                    {section.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                                                isActive(item.href)
                                                    ? "bg-brand/10 text-brand"
                                                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                                            )}
                                        >
                                            <span className={isActive(item.href) ? "text-brand" : "text-text-muted"}>
                                                {item.icon}
                                            </span>
                                            <div className="flex flex-1 items-center justify-between">
                                                <span className="text-sm font-medium">{item.label}</span>
                                                {item.label === "Billing" && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand uppercase tracking-wider">
                                                        Soon
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ))}

                            {clinic?.plan === "free" && (
                                <Link
                                    href="/upgrade"
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl bg-brand/10 text-brand text-sm font-medium border border-brand/20"
                                >
                                    <Sparkles size={18} />
                                    Upgrade to Pro
                                </Link>
                            )}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-border-subtle">
                            <button
                                onClick={() => { logout(); onClose(); }}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                            >
                                <LogOut size={18} />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
