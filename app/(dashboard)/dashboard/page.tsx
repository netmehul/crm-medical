"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, CalendarDays, Clock, AlertTriangle, Phone, CalendarPlus, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import StatCard from "@/components/modules/dashboard/stat-card";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import Button from "@/components/ui/button";
import { formatTime, timeAgo } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { patientsApi, appointmentsApi, inventoryApi, prescriptionsApi } from "@/lib/api";
import type { Appointment, InventoryItem, Prescription } from "@/lib/types";

const statusVariant: Record<string, "info" | "success" | "muted" | "danger"> = {
  Scheduled: "info",
  Completed: "success",
  Cancelled: "muted",
  "No-show": "danger",
};

const activityIcons: Record<string, React.ReactNode> = {
  appointment: <CalendarDays size={14} />,
  patient: <Users size={14} />,
  prescription: <CheckCircle size={14} />,
  inventory: <AlertTriangle size={14} />,
  followup: <Clock size={14} />,
};

const activityColors: Record<string, string> = {
  appointment: "bg-secondary/20 text-secondary",
  patient: "bg-brand/20 text-brand",
  prescription: "bg-success/20 text-success",
  inventory: "bg-warning/20 text-warning",
  followup: "bg-danger/20 text-danger",
};

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-bg-hover ${className}`} />;
}

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { clinic } = useAuth();
  const hasInventory = !!clinic?.planModules?.inventory;
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);

  const upcomingBookings = allAppointments.filter((a) => a.status === "Scheduled").slice(0, 3);
  const pendingFollowUps = allAppointments.filter((a) => a.status === "Scheduled").length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const [patientsRes, todayRes, allRes, lowStock, rxRes] = await Promise.all([
        patientsApi.list({ limit: 1 }),
        appointmentsApi.list({ date: todayStr, limit: 20 }),
        appointmentsApi.list({ limit: 50 }),
        hasInventory ? inventoryApi.lowStock() : Promise.resolve([]),
        prescriptionsApi.list({ limit: 5 }),
      ]);

      setTotalPatients(patientsRes.total);
      setTodayAppointments(todayRes.items);
      setAllAppointments(allRes.items);
      setLowStockItems(lowStock);
      setRecentPrescriptions(rxRes.items);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      addToast({ type: "error", title: "Failed to load dashboard data" });
    } finally {
      setLoading(false);
    }
  }, [addToast, hasInventory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async (id: string, name: string) => {
    try {
      await appointmentsApi.update(id, { status: "completed" });
      setCheckedIn((prev) => new Set(prev).add(id));
      addToast({ type: "success", title: `${name} checked in` });
      fetchData();
    } catch {
      addToast({ type: "error", title: `Failed to check in ${name}` });
    }
  };

  const handleConfirm = (id: string, name: string) => {
    setConfirmed((prev) => new Set(prev).add(id));
    addToast({ type: "success", title: `Booking confirmed for ${name}` });
  };

  const donutData = [
    { name: "Scheduled", value: allAppointments.filter((a) => a.status === "Scheduled").length, color: "#3B82F6" },
    { name: "Completed", value: allAppointments.filter((a) => a.status === "Completed").length, color: "#10B981" },
    { name: "Cancelled", value: allAppointments.filter((a) => a.status === "Cancelled").length, color: "#9CA3AF" },
    { name: "No-show", value: allAppointments.filter((a) => a.status === "No-show").length, color: "#EF4444" },
  ];

  const recentActivity = [
    ...recentPrescriptions.map((rx) => ({
      id: rx.id,
      type: "prescription" as const,
      description: `Prescription for ${rx.patientName} — ${rx.diagnosis}`,
      timestamp: rx.date,
    })),
    ...todayAppointments
      .filter((a) => a.status === "Completed")
      .map((a) => ({
        id: a.id,
        type: "appointment" as const,
        description: `${a.patientName}'s appointment completed`,
        timestamp: `${a.date}T${a.time}:00`,
      })),
    ...lowStockItems.slice(0, 2).map((item) => ({
      id: item.id,
      type: "inventory" as const,
      description: `${item.name} stock is ${item.status.toLowerCase()}`,
      timestamp: item.lastUpdated,
    })),
  ]
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonBlock className="h-7 w-40 mb-2" />
            <SkeletonBlock className="h-4 w-64" />
          </div>
          <SkeletonBlock className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonBlock key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonBlock className="lg:col-span-2 h-72" />
          <SkeletonBlock className="h-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonBlock key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-primary">Dashboard</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">Welcome back. Here&apos;s your clinic overview.</p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted font-mono bg-bg-surface px-3 py-1.5 rounded-lg border border-border-subtle w-fit">
          <CalendarDays size={14} className="text-brand" />
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
        </div>
      </div>

      {/* KPI Row - Fixed 2x2 on small, 4-in-a-row on large */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Patients" value={totalPatients} icon={<Users size={20} />} color="var(--brand)" sparklineData={[3, 4, 5, 5, 6, 7, totalPatients]} delay={0} />
        <StatCard label="Today" value={todayAppointments.length} icon={<CalendarDays size={20} />} color="var(--secondary)" sparklineData={[4, 6, 3, 5, 7, 4, todayAppointments.length]} delay={0.1} />
        <StatCard label="Follow-ups" value={pendingFollowUps} icon={<Clock size={20} />} color="var(--warning)" sparklineData={[2, 3, 4, 3, 5, 4, pendingFollowUps]} delay={0.2} />
        {hasInventory ? (
          <StatCard label="Low Stock" value={lowStockItems.length} icon={<AlertTriangle size={20} />} color="var(--danger)" sparklineData={[1, 2, 1, 3, 2, 3, lowStockItems.length]} delay={0.3} />
        ) : (
          <StatCard label="Prescriptions" value={recentPrescriptions.length} icon={<CheckCircle size={20} />} color="var(--success)" sparklineData={[5, 8, 4, 6, 9, 3, 5]} delay={0.3} />
        )}
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments — 2/3 */}
        <div className="lg:col-span-2 glass-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-base md:text-lg text-text-primary">Today&apos;s Schedule</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {todayAppointments.length} sessions booked for today
              </p>
            </div>
            <Link href="/appointments" className="h-8 px-3 rounded-lg bg-brand/10 text-brand text-[11px] font-bold flex items-center gap-1.5 hover:bg-brand/20 transition-colors">
              VIEW ALL <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted">
                  <CalendarDays size={24} />
                </div>
                <p className="text-sm text-text-muted font-medium">No appointments for today.</p>
              </div>
            ) : (
              todayAppointments.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/patients/${apt.patientId}`)}
                  className="flex items-center gap-3 md:gap-4 p-3 rounded-xl bg-bg-base border border-transparent hover:border-border-subtle hover:bg-bg-hover transition-all group cursor-pointer"
                >
                  <Avatar name={apt.patientName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{apt.patientName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] sm:text-xs text-text-muted font-medium flex items-center gap-1">
                        <Clock size={10} /> {formatTime(apt.time)}
                      </span>
                      <span className="hidden sm:inline text-[10px] text-text-muted">•</span>
                      <span className="hidden sm:inline text-[10px] text-text-muted truncate">{apt.type}</span>
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center gap-4 mr-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Doctor</span>
                      <span className="text-xs text-text-secondary font-medium">{apt.doctorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[apt.status]}>{apt.status}</Badge>
                    {apt.status === "Scheduled" && !checkedIn.has(apt.id) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCheckIn(apt.id, apt.patientName); }}
                        className="hidden sm:flex h-8 px-3 items-center justify-center rounded-lg bg-success text-text-on-brand text-xs font-bold hover:brightness-110"
                      >
                        Check In
                      </button>
                    )}
                    {checkedIn.has(apt.id) && (
                      <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Follow-up Reminders — 1/3 */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display font-semibold text-base text-text-primary">Upcoming Scheduled</h2>
            {upcomingBookings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-warning pulse-dot" />
            )}
          </div>

          <div className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm">No upcoming appointments.</div>
            ) : (
              upcomingBookings.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-bg-surface border border-border-subtle hover:border-border-brand transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-text-primary">{apt.patientName}</p>
                    <Badge variant="info" className="text-[10px]">Scheduled</Badge>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1 mb-2">
                    {apt.type} — {apt.date} at {formatTime(apt.time)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1 text-xs text-brand hover:underline cursor-pointer"
                      onClick={() => addToast({ type: "info", title: `Calling ${apt.patientName}...`, message: "Opening dialer" })}
                    >
                      <Phone size={12} /> Call
                    </button>
                    <button
                      className="flex items-center gap-1 text-xs text-secondary hover:underline cursor-pointer"
                      onClick={() => router.push("/appointments")}
                    >
                      <CalendarPlus size={12} /> View
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary widgets row */}
      <div className={`grid grid-cols-1 gap-6 ${hasInventory ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {/* Donut chart */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Appointment Status</h3>
          <div className="h-48 flex items-center justify-center">
            {allAppointments.length === 0 ? (
              <p className="text-sm text-text-muted">No appointment data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {donutData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-center py-8 text-text-muted text-sm">No recent activity.</p>
            ) : (
              recentActivity.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${activityColors[act.type]}`}>
                    {activityIcons[act.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary">{act.description}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{timeAgo(act.timestamp)}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts — only when inventory module is available */}
        {hasInventory && (
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Low Stock Alerts</h3>
            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <p className="text-center py-8 text-text-muted text-sm">All items sufficiently stocked.</p>
              ) : (
                lowStockItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-subtle"
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-danger/10 text-danger">
                      <AlertTriangle size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-muted">
                        {item.currentStock} {item.unit} remaining
                      </p>
                    </div>
                    <Badge variant={item.status === "Out of Stock" ? "danger" : "warning"}>
                      {item.status}
                    </Badge>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
