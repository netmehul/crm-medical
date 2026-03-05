"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { mockNotifications } from "@/lib/mock-data";
import Avatar from "@/components/ui/avatar";
import ModeToggle from "@/components/ui/mode-toggle";
import Link from "next/link";

const breadcrumbMap: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/appointments": "Appointments",
  "/prescriptions": "Prescriptions",
  "/history": "History & Follow-ups",
  "/medical-reps": "Medical Reps",
  "/inventory": "Inventory",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "MediCRM", href: "/dashboard" },
    ...pathSegments
      .filter((seg) => seg !== "dashboard")
      .map((seg, i, arr) => ({
        label: breadcrumbMap["/" + arr.slice(0, i + 1).join("/")] || seg.charAt(0).toUpperCase() + seg.slice(1),
        href: "/" + arr.slice(0, i + 1).join("/"),
      })),
  ];

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roleColor = user?.role === "doctor"
    ? "var(--brand)"
    : user?.role === "receptionist"
      ? "var(--secondary)"
      : "var(--warning)";

  return (
    <header
      className="h-16 sticky top-0 z-30 flex items-center justify-between px-6 border-b border-border-subtle"
      style={{ background: "var(--bg-base)", backdropFilter: "blur(20px)", opacity: 0.95 }}
    >
      <nav className="flex items-center gap-2 text-sm font-sans">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-muted">/</span>}
            {i < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="text-text-muted hover:text-text-brand">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-text-primary font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center bg-bg-base border border-border-base rounded-full px-3 py-1.5"
              >
                <Search size={16} className="text-text-muted shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients, appointments..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted ml-2 font-sans"
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-text-muted hover:text-text-primary cursor-pointer">
                  <X size={14} />
                </button>
              </motion.div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer" aria-label="Search">
                <Search size={18} />
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* Mode toggle */}
        <ModeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand text-[10px] font-bold text-text-on-brand flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 glass-card p-0 overflow-hidden"
              >
                <div className="p-3 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                  <button onClick={() => setNotifOpen(false)} className="text-xs text-text-brand hover:underline cursor-pointer">Mark all read</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {mockNotifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        if (n.type === "warning") router.push("/history");
                        else if (n.type === "error") router.push("/inventory");
                        else router.push("/appointments");
                      }}
                      className={`w-full text-left px-3 py-2.5 border-b border-border-subtle/50 hover:bg-bg-hover cursor-pointer ${!n.read ? "bg-brand/5" : ""}`}
                    >
                      <p className="text-sm text-text-primary">{n.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 cursor-pointer rounded-full hover:bg-bg-hover p-1"
            aria-label="User menu"
          >
            <Avatar name={user?.name || "User"} size="sm" ringColor={roleColor} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-56 glass-card p-1 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-border-subtle">
                  <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                  <p className="text-xs text-text-muted capitalize">{user?.role}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary rounded"
                >
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary rounded"
                >
                  Settings
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
