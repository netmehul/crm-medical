"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, LogOut, ChevronLeft, ChevronRight,
  Shield, CreditCard,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { cn } from "@/lib/utils";
import ModeToggle from "@/components/ui/mode-toggle";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Plans", href: "/admin/plans", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isPlatformAdmin, isLoading, user, logout } = useAuth();
  const { customLabels = {} } = useBreadcrumb() ?? {};
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isPlatformAdmin) {
      router.push("/auth/login");
    }
  }, [isPlatformAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-brand pulse-dot" />
          </div>
          <p className="text-sm text-text-muted font-sans">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPlatformAdmin) return null;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-bg-surface border-r border-border-subtle overflow-hidden"
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-4 gap-3 border-b border-border-subtle shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#ef4444]/15 flex items-center justify-center shrink-0">
            <Shield size={16} className="text-[#ef4444]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-display font-bold text-base text-text-primary whitespace-nowrap leading-tight">
                  MediCRM <span className="text-[#ef4444]">Admin</span>
                </span>
                <span className="text-[10px] text-text-muted font-sans leading-tight">Platform Control Center</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted"
              >
                Menu
              </motion.p>
            )}
          </AnimatePresence>

          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg group relative font-sans",
                  active
                    ? "bg-[#ef4444]/10 text-[#ef4444]"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={cn("shrink-0", active ? "text-[#ef4444]" : "text-text-muted group-hover:text-[#ef4444]")}>
                  <item.icon size={20} />
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
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-2 mb-2 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover flex items-center justify-center cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* User */}
        <div className="border-t border-border-subtle px-3 py-3 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#ef4444]/15 flex items-center justify-center text-[#ef4444] text-xs font-bold shrink-0">
            {user?.name?.charAt(0) || "A"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                    <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); router.push("/auth/login"); }}
                    className="text-text-muted hover:text-[#ef4444] shrink-0"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main content */}
      <div
        className="flex-1 flex flex-col transition-[margin] duration-300"
        style={{ marginLeft: collapsed ? 64 : 260 }}
      >
        {/* Top bar */}
        <header className="h-14 sticky top-0 z-30 flex items-center justify-between px-6 border-b border-border-subtle bg-bg-base/95 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-text-muted font-sans">
            <Link href="/admin" className="hover:text-text-primary">Admin</Link>
            {pathname !== "/admin" && (() => {
              const segments = pathname.split("/").filter(Boolean).slice(1);
              const parts = segments.map((seg, i) => {
                const fullPath = "/admin/" + segments.slice(0, i + 1).join("/");
                const label = customLabels[fullPath] ?? seg.replace(/-/g, " ");
                return label;
              });
              return (
                <>
                  <span>/</span>
                  <span className="text-text-primary font-medium capitalize">
                    {parts.join(" / ") || "Dashboard"}
                  </span>
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <span className="text-[10px] font-mono bg-[#ef4444]/10 text-[#ef4444] px-2 py-0.5 rounded-full font-medium">
              PLATFORM
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
