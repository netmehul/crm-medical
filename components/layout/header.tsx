"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import Avatar from "@/components/ui/avatar";
import Link from "next/link";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  "/billing": "Billing",
  "/upgrade": "Upgrade",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clinic, logout } = useAuth();
  const breadcrumb = useBreadcrumb();
  const customLabels = breadcrumb?.customLabels || {};
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: "1", title: "Welcome to MediCRM", message: "Your clinic is set up and ready to go", type: "success", read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "MediCRM", href: "/dashboard" },
    ...pathSegments
      .filter((seg) => seg !== "dashboard")
      .map((seg, i, arr) => {
        const fullPath = "/" + arr.slice(0, i + 1).join("/");
        const customLabel = customLabels[fullPath];
        const isUuid = UUID_REGEX.test(seg);
        const label = customLabel || breadcrumbMap[fullPath] || (isUuid ? "…" : seg.charAt(0).toUpperCase() + seg.slice(1));
        return { label, href: fullPath };
      }),
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

  const roleColor = user?.role === "org_admin"
    ? "var(--brand)"
    : user?.role === "receptionist"
      ? "var(--secondary)"
      : "var(--warning)";

  return (
    <header
      className="h-[spacing-header] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 border-b border-border-subtle"
      style={{ background: "var(--bg-base)", backdropFilter: "blur(20px)", opacity: 0.95 }}
    >
      <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-hover cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Breadcrumbs / Mobile Title */}
        <div className="hidden lg:block">
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
        </div>

        {/* Mobile Title - App Name / Clinic Name */}
        <div className="lg:hidden flex-1 truncate">
          <Link href="/dashboard" className="font-display font-extrabold text-sm text-text-primary">
            {clinic?.name || "MediCRM"}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        {/* Search */}
        <div className="relative">
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-0 top-0 h-[spacing-header] bg-bg-base flex items-center px-4 lg:relative lg:inset-auto lg:h-auto lg:bg-transparent lg:border lg:border-border-base lg:rounded-full lg:px-3 lg:py-1.5 z-50"
              >
                <Search size={16} className="text-text-muted shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients, appointments..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted ml-2 font-sans overflow-visible h-full lg:h-auto"
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-text-muted hover:text-text-primary cursor-pointer p-2">
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer" aria-label="Search">
                <Search size={18} />
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 glass-card p-0 overflow-hidden z-[100]"
              >
                <div className="p-3 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                  <button onClick={() => setNotifOpen(false)} className="text-xs text-text-brand hover:underline cursor-pointer">Mark all read</button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        router.push("/dashboard");
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border-subtle/50 hover:bg-bg-hover cursor-pointer ${!n.read ? "bg-brand/5" : ""}`}
                    >
                      <p className="text-sm text-text-primary font-medium">{n.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop User avatar / Mobile settings link */}
        <div className="hidden lg:block relative" ref={userMenuRef}>
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
                className="absolute right-0 top-12 w-56 glass-card p-1 overflow-hidden z-[100]"
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
                <button
                  onClick={() => { setUserMenuOpen(false); logout(); router.push("/auth/login"); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-bg-hover rounded cursor-pointer"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Avatar (directly links or opens menu? Bottom nav has more, so direct menu or settings is fine) */}
        <div className="lg:hidden">
          <Link href="/settings">
            <Avatar name={user?.name || "User"} size="sm" ringColor={roleColor} />
          </Link>
        </div>
      </div>
    </header>
  );
}
