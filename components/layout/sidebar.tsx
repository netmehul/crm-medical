"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarDays, FileText, History,
  Package, Settings, ChevronLeft, ChevronRight, Briefcase,
  Building2, CreditCard, UserCog, Sparkles, LogOut, FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  moduleKey?: string; // plan_modules key — show only if planModules[moduleKey] is true
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

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, clinic, logout } = useAuth();

  const plan = clinic?.plan || "free";
  const planModules = clinic?.planModules || {};
  const role = user?.role || "receptionist";
  const isOrgAdmin = role === "org_admin";

  const navSections = allNavSections.map(section => ({
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
    <motion.aside
      animate={{ width: collapsed ? 64 : 248 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-bg-surface border-r border-border-subtle overflow-hidden"
    >
      <Link href="/dashboard" className="h-16 flex items-center px-4 gap-3 border-b border-border-subtle shrink-0 hover:bg-bg-hover">
        <div className="relative shrink-0">
          <span className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-brand pulse-dot" />
          </span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display font-extrabold text-lg text-text-primary whitespace-nowrap"
            >
              Medi<span className="text-brand">CRM</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted"
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg group relative font-sans",
                      active
                        ? "nav-active text-text-brand"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={cn("shrink-0", active ? "text-brand" : "text-text-muted group-hover:text-brand")}>
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-bg-elevated border border-border-base rounded text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-2 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover flex items-center justify-center cursor-pointer"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {!collapsed && plan === "free" && isOrgAdmin && (
        <div className="mx-2 mb-2">
          <Link href="/upgrade" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition-colors">
            <Sparkles size={16} />
            Upgrade to Pro
          </Link>
        </div>
      )}

      <div className="border-t border-border-subtle p-3 flex items-center gap-3 shrink-0">
        <Link href="/settings" className="shrink-0 hover:opacity-80" title="My Profile">
          <Avatar name={user?.name || "User"} size="sm" ringColor="var(--brand)" />
        </Link>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center justify-between">
                <Link href="/settings" className="block hover:text-text-brand min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                  <p className="text-xs text-text-muted capitalize">{role === "org_admin" ? "Org Admin" : role}</p>
                </Link>
                <button onClick={logout} className="text-text-muted hover:text-danger shrink-0" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
