"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Bell, X, CreditCard, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { notificationsApi } from "@/lib/api";
import { Notification } from "@/lib/types";
import Avatar from "@/components/ui/avatar";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

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
  "/suppliers": "Suppliers",
  "/settings": "Settings",
  "/settings/subscription": "Subscription",
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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.getUnreadCount()
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read failed");
    }
  };

  const handleNotifClick = async (n: Notification) => {
    try {
      if (!n.isRead) {
        await notificationsApi.markRead(n.id);
        fetchNotifications();
      }
      setNotifOpen(false);
      
      // Navigate based on type
      if (n.type === 'payment_due' || n.type === 'payment_overdue') {
        router.push('/inventory');
      } else if (n.type === 'low_stock') {
        router.push('/inventory');
      }
    } catch (err) {
      console.error("Notif click error");
    }
  };

  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "MediCRM", href: "/dashboard" },
    ...pathSegments
      .filter((seg) => seg !== "dashboard")
      .map((seg, i, arr) => {
        const fullPath = "/" + arr.slice(0, i + 1).join("/");
        const customLabel = customLabels[fullPath];
        const isTechnicalId = UUID_REGEX.test(seg) || /^[A-Za-z0-9]{12}$/.test(seg);
        const label = customLabel || breadcrumbMap[fullPath] || (isTechnicalId ? (seg.length > 8 ? seg.slice(0, 8) + "…" : seg) : seg.charAt(0).toUpperCase() + seg.slice(1));
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

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'payment_due': return <CreditCard size={16} className="text-warning" />;
      case 'payment_overdue': return <AlertCircle size={16} className="text-danger" />;
      case 'low_stock': return <Info size={16} className="text-warning" />;
      default: return <Bell size={16} className="text-brand" />;
    }
  };

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
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand text-[8px] font-black text-white flex items-center justify-center shadow-lg transform translate-x-1 -translate-y-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, type: 'spring', damping: 20 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 glass-card p-0 overflow-hidden z-[100] shadow-2xl border-brand/20"
              >
                <div className="px-4 py-3 bg-brand/5 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-brand">Notifications</h3>
                  <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-brand hover:text-brand-dark transition-colors uppercase cursor-pointer">Mark all as read</button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto divide-y divide-border-subtle/30">
                  {notifications.length > 0 ? notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-4 hover:bg-bg-hover transition-all flex gap-3 group cursor-pointer ${!n.isRead ? "bg-white" : "bg-bg-surface/30 opacity-70"}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${n.isRead ? 'bg-bg-surface' : 'bg-brand/10'}`}>
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-0.5">
                            <p className={`text-xs font-bold truncate ${!n.isRead ? "text-text-primary" : "text-text-secondary"}`}>{n.title}</p>
                            {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" />}
                         </div>
                         <p className="text-[11px] leading-relaxed text-text-secondary line-clamp-2">{n.message}</p>
                         <div className="mt-2 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-text-muted">{formatDate(n.createdAt)}</span>
                            {n.dueDate && <span className="text-[9px] font-bold text-warning uppercase">Due: {n.dueDate}</span>}
                         </div>
                      </div>
                    </button>
                  )) : (
                    <div className="py-12 text-center text-text-muted italic opacity-50 flex flex-col items-center gap-2">
                       <CheckCircle2 size={32} />
                       <p className="text-xs">You're all caught up!</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-bg-surface border-t border-border-subtle text-center">
                   <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">End of stream</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop User avatar / Mobile settings link */}
        <div className="hidden lg:block relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 cursor-pointer rounded-full hover:bg-bg-hover p-1 transition-all"
            aria-label="User menu"
          >
            <Avatar name={user?.name || "User"} size="sm" ringColor={roleColor} />
            <div className="text-left hidden lg:block mr-2">
               <p className="text-[10px] font-black text-text-primary leading-none mb-0.5">{user?.name}</p>
               <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider leading-none">{user?.role === 'org_admin' ? 'Administrator' : user?.role}</p>
            </div>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 glass-card p-1 overflow-hidden z-[100] shadow-2xl"
              >
                <div className="px-3 py-3 border-b border-border-subtle bg-bg-surface/50">
                  <p className="text-xs font-bold text-text-primary">{user?.email}</p>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 italic">{clinic?.name}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text-secondary hover:bg-brand/10 hover:text-brand rounded-lg transition-all"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text-secondary hover:bg-brand/10 hover:text-brand rounded-lg transition-all"
                  >
                    System Settings
                  </Link>
                </div>
                <div className="border-t border-border-subtle pt-1 pb-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); router.push("/auth/login"); }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                  >
                    Logout Session
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Avatar (directly links or opens menu? Bottom nav has more, so direct menu or settings is fine) */}
        <div className="lg:hidden">
          <Link href="/settings" className="block p-1">
            <Avatar name={user?.name || "User"} size="sm" ringColor={roleColor} />
          </Link>
        </div>
      </div>
    </header>
  );
}
