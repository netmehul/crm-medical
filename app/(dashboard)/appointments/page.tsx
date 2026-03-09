"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, List, Plus, ChevronLeft, ChevronRight, Loader2,
  Clock, LayoutGrid, Columns3,
} from "lucide-react";
import { appointmentsApi } from "@/lib/api";
import { Appointment } from "@/lib/types";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import Modal from "@/components/ui/modal";
import { formatDate, formatTime, getDaysInMonth, getFirstDayOfMonth } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

type ViewMode = "month" | "week" | "day" | "list";

const statusVariant: Record<string, "info" | "success" | "muted" | "danger"> = {
  Scheduled: "info", Completed: "success", Cancelled: "muted", "No-show": "danger",
};

const statusDotColor: Record<string, string> = {
  Scheduled: "bg-secondary", Completed: "bg-success", Cancelled: "bg-text-muted", "No-show": "bg-danger",
};

const statusBgColor: Record<string, string> = {
  Scheduled: "bg-secondary/15 border-secondary/30 text-secondary",
  Completed: "bg-success/15 border-success/30 text-success",
  Cancelled: "bg-text-muted/15 border-text-muted/30 text-text-muted",
  "No-show": "bg-danger/15 border-danger/30 text-danger",
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
const SLOT_HEIGHT = 60; // px per hour
const HALF_SLOT = SLOT_HEIGHT / 2;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(baseDate: Date): Date[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    return dd;
  });
}

function dateToStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { addToast } = useToast();
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  // Drag state
  const [dragStart, setDragStart] = useState<{ date: string; minutes: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Quick create modal
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickDate, setQuickDate] = useState("");
  const [quickStartTime, setQuickStartTime] = useState("");
  const [quickEndTime, setQuickEndTime] = useState("");

  const today = todayStr();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const weekDates = getWeekDates(currentDate);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await appointmentsApi.list({ limit: 200 });
      setAppointments(result.items);
    } catch {
      addToast({ type: "error", title: "Failed to load appointments" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const getDateString = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const getAppointmentsForDay = (day: number) =>
    appointments.filter((a) => a.date === getDateString(day));
  const getAppointmentsForDate = (dateStr: string) =>
    appointments.filter((a) => a.date === dateStr);

  const dayAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  const handleCheckIn = async (apt: Appointment) => {
    try {
      await appointmentsApi.update(apt.id, { status: "checked_in" });
      setCheckedIn((prev) => new Set(prev).add(apt.id));
      addToast({ type: "success", title: `${apt.patientName} checked in` });
      fetchAppointments();
    } catch {
      addToast({ type: "error", title: "Failed to check in" });
    }
  };

  // Drag-to-create handlers
  const getMinutesFromY = (y: number, container: HTMLElement): number => {
    const rect = container.getBoundingClientRect();
    const relativeY = y - rect.top + container.scrollTop;
    const totalMinutes = (relativeY / SLOT_HEIGHT) * 60 + HOURS[0] * 60;
    return Math.round(totalMinutes / 15) * 15; // snap to 15 min
  };

  const handleGridMouseDown = (date: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-appointment]")) return;
    const container = gridRef.current;
    if (!container) return;
    const minutes = getMinutesFromY(e.clientY, container);
    if (minutes < HOURS[0] * 60 || minutes >= (HOURS[HOURS.length - 1] + 1) * 60) return;
    setDragStart({ date, minutes });
    setDragEnd(minutes + 30);
    setIsDragging(true);
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !gridRef.current) return;
    const minutes = getMinutesFromY(e.clientY, gridRef.current);
    const clamped = Math.max(dragStart.minutes + 15, Math.min(minutes, (HOURS[HOURS.length - 1] + 1) * 60));
    setDragEnd(Math.round(clamped / 15) * 15);
  };

  const handleGridMouseUp = () => {
    if (!isDragging || !dragStart || dragEnd === null) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);
    const startMin = Math.min(dragStart.minutes, dragEnd);
    const endMin = Math.max(dragStart.minutes, dragEnd);
    if (endMin - startMin < 15) return;

    setQuickDate(dragStart.date);
    setQuickStartTime(minutesToTime(startMin));
    setQuickEndTime(minutesToTime(endMin));
    setQuickCreateOpen(true);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleQuickBook = () => {
    const startMins = quickStartTime ? (parseInt(quickStartTime.split(":")[0]) * 60 + parseInt(quickStartTime.split(":")[1] || "0")) : 0;
    const endMins = quickEndTime ? (parseInt(quickEndTime.split(":")[0]) * 60 + parseInt(quickEndTime.split(":")[1] || "0")) : 30;
    const durationMins = Math.max(15, Math.min(120, endMins - startMins));
    const params = new URLSearchParams({
      date: quickDate,
      time: quickStartTime,
      duration: String(durationMins),
    });
    router.push(`/appointments/book?${params.toString()}`);
    setQuickCreateOpen(false);
  };

  // Navigation title
  const navTitle = (() => {
    if (view === "month") return `${monthName} ${year}`;
    if (view === "week") {
      const start = weekDates[0];
      const end = weekDates[6];
      const sameMonth = start.getMonth() === end.getMonth();
      if (sameMonth) {
        return `${start.toLocaleString("default", { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${start.toLocaleString("default", { month: "short" })} ${start.getDate()} – ${end.toLocaleString("default", { month: "short" })} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  })();

  // Render appointment block for week/day view
  const renderAppointmentBlock = (apt: Appointment, colWidth?: string) => {
    const startMins = timeToMinutes(apt.time);
    const durationMins = 30;
    const topOffset = ((startMins - HOURS[0] * 60) / 60) * SLOT_HEIGHT;
    const height = (durationMins / 60) * SLOT_HEIGHT;

    return (
      <div
        key={apt.id}
        data-appointment
        className={`absolute left-0.5 right-0.5 rounded-md border px-1.5 py-0.5 overflow-hidden cursor-pointer z-10 transition-opacity hover:opacity-90 ${statusBgColor[apt.status] || "bg-brand/15 border-brand/30 text-brand"}`}
        style={{ top: `${topOffset}px`, height: `${Math.max(height, 22)}px` }}
        onClick={() => router.push(`/appointments/book?patientId=${apt.patientId}`)}
        title={`${apt.patientName} - ${apt.type} - ${formatTime(apt.time)}`}
      >
        <p className="text-[10px] font-semibold truncate leading-tight">{apt.patientName}</p>
        {height > 28 && <p className="text-[9px] opacity-70 truncate">{formatTime(apt.time)} · {apt.type}</p>}
      </div>
    );
  };

  // Render drag selection overlay
  const renderDragOverlay = (dateStr: string) => {
    if (!isDragging || !dragStart || dragEnd === null || dragStart.date !== dateStr) return null;
    const startMin = Math.min(dragStart.minutes, dragEnd);
    const endMin = Math.max(dragStart.minutes, dragEnd);
    const topOffset = ((startMin - HOURS[0] * 60) / 60) * SLOT_HEIGHT;
    const height = ((endMin - startMin) / 60) * SLOT_HEIGHT;

    return (
      <div
        className="absolute left-0.5 right-0.5 bg-brand/20 border-2 border-brand/50 border-dashed rounded-md z-20 pointer-events-none"
        style={{ top: `${topOffset}px`, height: `${height}px` }}
      >
        <p className="text-[10px] font-semibold text-brand px-1.5 pt-0.5">
          {formatTime(minutesToTime(startMin))} – {formatTime(minutesToTime(endMin))}
        </p>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-primary">Appointments</h1>
          <p className="text-sm text-text-secondary mt-0.5">{appointments.length} total appointments</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* View Switcher - Scrollable on mobile */}
          <div className="flex bg-bg-surface border border-border-subtle rounded-xl overflow-x-auto no-scrollbar p-1">
            {[
              { mode: "month" as ViewMode, icon: <LayoutGrid size={14} />, label: "Month" },
              { mode: "week" as ViewMode, icon: <Columns3 size={14} />, label: "Week" },
              { mode: "day" as ViewMode, icon: <CalendarDays size={14} />, label: "Day" },
              { mode: "list" as ViewMode, icon: <List size={14} />, label: "List" },
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`flex-1 sm:flex-initial px-3 py-2 flex items-center justify-center gap-2 text-xs font-bold whitespace-nowrap transition-all rounded-lg cursor-pointer ${view === mode ? "bg-brand text-text-on-brand shadow-sm" : "text-text-muted hover:text-text-secondary"
                  }`}
              >
                {icon} <span className={view === mode ? "inline" : "hidden sm:inline"}>{label}</span>
              </button>
            ))}
          </div>

          <Link href="/appointments/book" className="flex">
            <Button className="flex-1 sm:flex-initial" size="md"><Plus size={18} /> Book Appointment</Button>
          </Link>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center justify-between glass-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-1 rounded-md text-xs font-medium border border-border-base bg-bg-surface text-text-secondary hover:bg-bg-hover cursor-pointer transition-colors">Today</button>
          <button onClick={goPrev} className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary cursor-pointer"><ChevronLeft size={18} /></button>
          <button onClick={goNext} className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary cursor-pointer"><ChevronRight size={18} /></button>
        </div>
        <h2 className="font-display font-semibold text-base text-text-primary">{navTitle}</h2>
        <div className="w-24" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand" />
        </div>
      ) : view === "month" ? (
        /* ─── Month View ─── */
        <div className="flex gap-5">
          <div className="flex-1 glass-card p-4">
            <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-lg overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-[11px] font-semibold text-text-muted py-2 bg-bg-surface">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-bg-base min-h-[80px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = getDateString(day);
                const dayApts = getAppointmentsForDay(day);
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`relative min-h-[80px] p-1.5 flex flex-col items-start transition-all cursor-pointer text-left ${isSelected ? "bg-brand/10 ring-1 ring-brand/40" :
                      isToday ? "bg-bg-hover" :
                        "bg-bg-base hover:bg-bg-hover"
                      }`}
                  >
                    <span className={`text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-brand text-bg-base font-bold" : "text-text-primary"
                      }`}>
                      {day}
                    </span>
                    <div className="mt-0.5 w-full space-y-0.5">
                      {dayApts.slice(0, 2).map((a) => (
                        <div key={a.id} className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate ${statusBgColor[a.status] || "bg-brand/10 text-brand"}`}>
                          {formatTime(a.time)} {a.patientName}
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <p className="text-[9px] text-text-muted px-1">+{dayApts.length - 2} more</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day detail sidebar */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80 glass-card p-5 shrink-0 self-start sticky top-20"
              >
                <h3 className="font-display font-semibold text-sm text-text-primary mb-1">{formatDate(selectedDate)}</h3>
                <p className="text-xs text-text-muted mb-4">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? "s" : ""}</p>
                <div className="space-y-2">
                  {dayAppointments.map((a) => (
                    <div key={a.id} className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar name={a.patientName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{a.patientName}</p>
                          <p className="text-xs text-text-muted font-mono">{formatTime(a.time)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={statusVariant[a.status]} className="text-[10px]">{a.status}</Badge>
                        <span className="text-[10px] text-text-muted">{a.type}</span>
                        {a.status === "Scheduled" && !checkedIn.has(a.id) && (
                          <button onClick={() => handleCheckIn(a)} className="ml-auto text-[10px] text-brand hover:underline cursor-pointer">Check In</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length === 0 && <p className="text-xs text-text-muted text-center py-4">No appointments</p>}
                </div>
                <div className="mt-4">
                  <Link href={`/appointments/book?date=${selectedDate}`}>
                    <Button size="sm" variant="ghost" className="w-full"><Plus size={14} /> Add Appointment</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : view === "week" ? (
        /* ─── Week View (Google Calendar style) ─── */
        <div className="glass-card overflow-hidden">
          {/* Week header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border-subtle">
            <div className="p-2" />
            {weekDates.map((d) => {
              const ds = dateToStr(d);
              const isToday2 = ds === today;
              return (
                <div key={ds} className={`text-center py-2 border-l border-border-subtle ${isToday2 ? "bg-brand/5" : ""}`}>
                  <p className="text-[10px] text-text-muted font-semibold uppercase">{d.toLocaleString("default", { weekday: "short" })}</p>
                  <p className={`text-lg font-mono font-medium mt-0.5 ${isToday2 ? "w-8 h-8 rounded-full bg-brand text-bg-base flex items-center justify-center mx-auto" : "text-text-primary"
                    }`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto select-none"
            style={{ maxHeight: "calc(100vh - 260px)" }}
            onMouseMove={handleGridMouseMove}
            onMouseUp={handleGridMouseUp}
            onMouseLeave={() => { if (isDragging) handleGridMouseUp(); }}
          >
            {/* Time labels */}
            <div className="relative">
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: `${SLOT_HEIGHT}px` }}>
                  <span className="absolute -top-2 right-2 text-[10px] text-text-muted font-mono">{formatHour(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((d) => {
              const ds = dateToStr(d);
              const isToday2 = ds === today;
              const dayApts = getAppointmentsForDate(ds);

              return (
                <div
                  key={ds}
                  className={`relative border-l border-border-subtle ${isToday2 ? "bg-brand/[0.02]" : ""}`}
                  onMouseDown={(e) => handleGridMouseDown(ds, e)}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div key={h} className="border-b border-border-subtle" style={{ height: `${SLOT_HEIGHT}px` }}>
                      <div className="border-b border-border-subtle/30 h-1/2" />
                    </div>
                  ))}

                  {/* Current time indicator */}
                  {isToday2 && (() => {
                    const now = new Date();
                    const nowMinutes = now.getHours() * 60 + now.getMinutes();
                    if (nowMinutes < HOURS[0] * 60 || nowMinutes > (HOURS[HOURS.length - 1] + 1) * 60) return null;
                    const top = ((nowMinutes - HOURS[0] * 60) / 60) * SLOT_HEIGHT;
                    return (
                      <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: `${top}px` }}>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                          <div className="flex-1 h-px bg-red-500" />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Appointment blocks */}
                  {dayApts.map((apt) => renderAppointmentBlock(apt))}

                  {/* Drag overlay */}
                  {renderDragOverlay(ds)}
                </div>
              );
            })}
          </div>
        </div>
      ) : view === "day" ? (
        /* ─── Day View ─── */
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-[60px_1fr] border-b border-border-subtle">
            <div className="p-2" />
            <div className={`text-center py-3 ${dateToStr(currentDate) === today ? "bg-brand/5" : ""}`}>
              <p className="text-xs text-text-muted font-semibold uppercase">{currentDate.toLocaleString("default", { weekday: "long" })}</p>
              <p className={`text-2xl font-mono font-medium mt-0.5 ${dateToStr(currentDate) === today ? "w-10 h-10 rounded-full bg-brand text-bg-base flex items-center justify-center mx-auto" : "text-text-primary"
                }`}>
                {currentDate.getDate()}
              </p>
            </div>
          </div>

          <div
            ref={view === "day" ? gridRef : undefined}
            className="grid grid-cols-[60px_1fr] overflow-y-auto select-none"
            style={{ maxHeight: "calc(100vh - 280px)" }}
            onMouseMove={handleGridMouseMove}
            onMouseUp={handleGridMouseUp}
            onMouseLeave={() => { if (isDragging) handleGridMouseUp(); }}
          >
            <div className="relative">
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: `${SLOT_HEIGHT}px` }}>
                  <span className="absolute -top-2 right-2 text-[10px] text-text-muted font-mono">{formatHour(h)}</span>
                </div>
              ))}
            </div>

            <div
              className={`relative border-l border-border-subtle ${dateToStr(currentDate) === today ? "bg-brand/[0.02]" : ""}`}
              onMouseDown={(e) => handleGridMouseDown(dateToStr(currentDate), e)}
            >
              {HOURS.map((h) => (
                <div key={h} className="border-b border-border-subtle" style={{ height: `${SLOT_HEIGHT}px` }}>
                  <div className="border-b border-border-subtle/30 h-1/2" />
                </div>
              ))}

              {dateToStr(currentDate) === today && (() => {
                const now = new Date();
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
                if (nowMinutes < HOURS[0] * 60 || nowMinutes > (HOURS[HOURS.length - 1] + 1) * 60) return null;
                const top = ((nowMinutes - HOURS[0] * 60) / 60) * SLOT_HEIGHT;
                return (
                  <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: `${top}px` }}>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-px bg-red-500" />
                    </div>
                  </div>
                );
              })()}

              {getAppointmentsForDate(dateToStr(currentDate)).map((apt) => renderAppointmentBlock(apt))}
              {renderDragOverlay(dateToStr(currentDate))}
            </div>
          </div>
        </div>
      ) : (
        /* ─── List View ─── */
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-base/30">
                    {["Date/Time", "Patient", "Doctor", "Type", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {appointments.map((a, i) => (
                    <tr
                      key={a.id}
                      className="hover:bg-bg-hover transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-text-primary">{formatDate(a.date)}</p>
                        <p className="text-[11px] text-text-muted font-mono mt-0.5">{formatTime(a.time)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.patientName} size="sm" />
                          <span className="text-sm font-medium text-text-primary">{a.patientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-text-secondary font-medium">{a.doctorName}</td>
                      <td className="px-4 py-4 text-sm text-text-secondary">{a.type}</td>
                      <td className="px-4 py-4"><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end">
                          {a.status === "Scheduled" && !checkedIn.has(a.id) && (
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCheckIn(a)}>Check In</Button>
                          )}
                          {checkedIn.has(a.id) && <Badge variant="success">Checked In</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {appointments.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted">
                    <CalendarDays size={24} />
                  </div>
                  <p className="text-sm text-text-muted font-medium">No appointments found</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="glass-card p-4 active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/appointments/book?patientId=${a.patientId}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.patientName} size="md" />
                    <div>
                      <h3 className="font-semibold text-text-primary">{a.patientName}</h3>
                      <p className="text-[11px] text-text-muted font-mono">{formatTime(a.time)} • {formatDate(a.date)}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-3 pb-4 border-b border-border-subtle/50">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-muted uppercase tracking-wider font-bold text-[10px]">Doctor</span>
                    <span className="text-sm text-text-secondary font-medium truncate">{a.doctorName}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-muted uppercase tracking-wider font-bold text-[10px]">Consultation Type</span>
                    <span className="text-sm text-text-secondary font-medium">{a.type}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex -space-x-2">
                    {/* Simplified checked in indicators if any? No, let's keep it simple */}
                  </div>
                  {a.status === "Scheduled" && !checkedIn.has(a.id) ? (
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleCheckIn(a); }}
                      className="w-full"
                    >
                      Check In Patient
                    </Button>
                  ) : checkedIn.has(a.id) ? (
                    <div className="w-full py-2 bg-success/10 text-success text-xs font-bold rounded-lg flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      Patient Checked In
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="w-full">View Details</Button>
                  )}
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-2 glass-card">
                <p className="text-sm text-text-muted font-medium">No appointments found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick Create Modal from Drag */}
      <Modal isOpen={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} title="Quick Book Appointment" size="sm">
        <div className="space-y-4">
          <div className="bg-bg-surface rounded-lg p-4 border border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <Clock size={18} className="text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{quickDate && formatDate(quickDate)}</p>
                <p className="text-xs text-text-muted font-mono">
                  {quickStartTime && formatTime(quickStartTime)} – {quickEndTime && formatTime(quickEndTime)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-text-secondary">Book an appointment for this time slot?</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setQuickCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleQuickBook} className="flex-1"><Plus size={14} /> Book Now</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
