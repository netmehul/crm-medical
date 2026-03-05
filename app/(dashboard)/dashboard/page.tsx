"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, CalendarDays, Clock, AlertTriangle, Phone, CalendarPlus, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import StatCard from "@/components/modules/dashboard/stat-card";
import { mockAppointments, mockFollowUps, mockActivity, mockInventory } from "@/lib/mock-data";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import Button from "@/components/ui/button";
import { formatTime, timeAgo } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

const statusVariant: Record<string, "info" | "success" | "muted" | "danger"> = {
  Scheduled: "info",
  Completed: "success",
  Cancelled: "muted",
  "No-show": "danger",
};

const followUpVariant: Record<string, "danger" | "warning" | "brand" | "success"> = {
  Overdue: "danger",
  Today: "warning",
  Upcoming: "brand",
  Completed: "success",
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

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const todayAppointments = mockAppointments.filter((a) => a.date === "2026-03-05");
  const lowStockItems = mockInventory.filter((i) => i.status !== "In Stock");
  const upcomingBookings = mockAppointments.filter((a) => a.status === "Scheduled").slice(0, 3);

  const handleCheckIn = (id: string, name: string) => {
    setCheckedIn((prev) => new Set(prev).add(id));
    addToast({ type: "success", title: `${name} checked in` });
  };

  const handleConfirm = (id: string, name: string) => {
    setConfirmed((prev) => new Set(prev).add(id));
    addToast({ type: "success", title: `Booking confirmed for ${name}` });
  };

  const donutData = [
    { name: "Scheduled", value: mockAppointments.filter((a) => a.status === "Scheduled").length, color: "#3B82F6" },
    { name: "Completed", value: mockAppointments.filter((a) => a.status === "Completed").length, color: "#10B981" },
    { name: "Cancelled", value: mockAppointments.filter((a) => a.status === "Cancelled").length, color: "#9CA3AF" },
    { name: "No-show", value: mockAppointments.filter((a) => a.status === "No-show").length, color: "#EF4444" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">Welcome back. Here&apos;s your clinic overview.</p>
        </div>
        <p className="text-sm text-text-muted font-mono">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={8} icon={<Users size={24} />} color="var(--brand)" sparklineData={[3, 4, 5, 5, 6, 7, 8]} delay={0} />
        <StatCard label="Today's Appointments" value={todayAppointments.length} icon={<CalendarDays size={24} />} color="var(--secondary)" sparklineData={[4, 6, 3, 5, 7, 4, 5]} delay={0.1} />
        <StatCard label="Pending Follow-ups" value={mockFollowUps.filter((f) => f.status !== "Completed").length} icon={<Clock size={24} />} color="var(--warning)" sparklineData={[2, 3, 4, 3, 5, 4, 5]} delay={0.2} />
        <StatCard label="Low Stock Alerts" value={lowStockItems.length} icon={<AlertTriangle size={24} />} color="var(--danger)" sparklineData={[1, 2, 1, 3, 2, 3, 3]} delay={0.3} />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments — 2/3 */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-base text-text-primary">Today&apos;s Appointments</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <Link href="/appointments" className="text-xs text-brand hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm">No appointments for today.</div>
            ) : (
              todayAppointments.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-hover transition-colors group"
                >
                  <Avatar name={apt.patientName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{apt.patientName}</p>
                    <p className="text-xs text-text-muted">
                      {apt.patientAge && `${apt.patientAge}y • `}{apt.type}
                    </p>
                  </div>
                  <span className="text-sm font-mono text-text-secondary">{formatTime(apt.time)}</span>
                  <span className="text-xs text-text-muted">{apt.doctorName}</span>
                  <Badge variant={statusVariant[apt.status]}>{apt.status}</Badge>
                  {apt.status === "Scheduled" && !checkedIn.has(apt.id) && (
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCheckIn(apt.id, apt.patientName)}>
                      Check In
                    </Button>
                  )}
                  {checkedIn.has(apt.id) && (
                    <Badge variant="success">Checked In</Badge>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Follow-up Reminders — 1/3 */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display font-semibold text-base text-text-primary">Follow-ups Due</h2>
            {mockFollowUps.some((f) => f.status === "Overdue") && (
              <span className="w-2 h-2 rounded-full bg-warning pulse-dot" />
            )}
          </div>

          <div className="space-y-3">
            {mockFollowUps.filter((f) => f.status !== "Completed").map((fu, i) => (
              <motion.div
                key={fu.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-lg bg-bg-surface border border-border-subtle hover:border-border-brand transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-text-primary">{fu.patientName}</p>
                  <Badge variant={followUpVariant[fu.status]} className="text-[10px]">{fu.status}</Badge>
                </div>
                <p className="text-xs text-text-muted line-clamp-1 mb-2">{fu.reason}</p>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1 text-xs text-brand hover:underline cursor-pointer"
                    onClick={() => addToast({ type: "info", title: `Calling ${fu.patientName}...`, message: "Opening dialer" })}
                  >
                    <Phone size={12} /> Call
                  </button>
                  <button
                    className="flex items-center gap-1 text-xs text-secondary hover:underline cursor-pointer"
                    onClick={() => router.push("/appointments")}
                  >
                    <CalendarPlus size={12} /> Book
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Donut chart */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Appointment Status</h3>
          <div className="h-48 flex items-center justify-center">
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
            {mockActivity.map((act, i) => (
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
            ))}
          </div>
        </div>

        {/* New Booking Alerts */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Upcoming Bookings</h3>
          <div className="space-y-3">
            {upcomingBookings.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-subtle"
              >
                <Avatar name={b.patientName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{b.patientName}</p>
                  <p className="text-xs text-text-muted font-mono">{formatTime(b.time)}</p>
                </div>
                {confirmed.has(b.id) ? (
                  <Badge variant="success">Confirmed</Badge>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => handleConfirm(b.id, b.patientName)}>Confirm</Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
