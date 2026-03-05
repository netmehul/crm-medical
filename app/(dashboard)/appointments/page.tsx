"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, List, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { mockAppointments, mockPatients } from "@/lib/mock-data";
import { Appointment } from "@/lib/types";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { formatDate, formatTime, getDaysInMonth, getFirstDayOfMonth } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

type ViewMode = "calendar" | "list";

const statusVariant: Record<string, "info" | "success" | "muted" | "danger"> = {
  Scheduled: "info", Completed: "success", Cancelled: "muted", "No-show": "danger",
};

const statusDotColor: Record<string, string> = {
  Scheduled: "bg-secondary", Completed: "bg-success", Cancelled: "bg-text-muted", "No-show": "bg-danger",
};

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const appointmentTypes = ["General", "Follow-up", "Procedure", "Emergency"] as const;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [view, setView] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [month, setMonth] = useState(2); // March 2026 (0-indexed)
  const [year] = useState(2026);
  const { addToast } = useToast();
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  // Booking form
  const [bookForm, setBookForm] = useState({ patientId: "", date: "", time: "", type: "General" as string, notes: "" });
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });

  const filteredPatients = patientSearch
    ? mockPatients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 5)
    : [];

  const getDateString = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const getAppointmentsForDay = (day: number) => appointments.filter((a) => a.date === getDateString(day));

  const dayAppointments = selectedDate ? appointments.filter((a) => a.date === selectedDate) : [];

  const bookedSlots = bookForm.date ? appointments.filter((a) => a.date === bookForm.date).map((a) => a.time) : [];

  const handleBook = () => {
    const patient = mockPatients.find((p) => p.id === bookForm.patientId);
    if (!patient || !bookForm.date || !bookForm.time) return;

    const newApt: Appointment = {
      id: `A${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      doctorName: "Dr. Sharma",
      date: bookForm.date,
      time: bookForm.time,
      type: bookForm.type as Appointment["type"],
      status: "Scheduled",
      notes: bookForm.notes,
    };
    setAppointments((prev) => [...prev, newApt]);
    addToast({ type: "success", title: "Appointment booked", message: `${patient.name} on ${formatDate(bookForm.date)}` });
    setBookForm({ patientId: "", date: "", time: "", type: "General", notes: "" });
    setPatientSearch("");
    setBookingOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Appointments</h1>
          <p className="text-sm text-text-secondary mt-0.5">{appointments.length} total appointments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-bg-surface border border-border-subtle rounded-lg overflow-hidden">
            <button onClick={() => setView("calendar")} className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${view === "calendar" ? "bg-brand/15 text-brand" : "text-text-muted hover:text-text-secondary"}`}>
              <CalendarDays size={14} /> Calendar
            </button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${view === "list" ? "bg-brand/15 text-brand" : "text-text-muted hover:text-text-secondary"}`}>
              <List size={14} /> List
            </button>
          </div>
          <Button onClick={() => setBookingOpen(true)} size="sm"><Plus size={16} /> Book Appointment</Button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="flex gap-6">
          {/* Calendar Grid */}
          <div className="flex-1 glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setMonth((m) => (m === 0 ? 11 : m - 1))} className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary cursor-pointer"><ChevronLeft size={18} /></button>
              <h2 className="font-display font-semibold text-base text-text-primary">{monthName} {year}</h2>
              <button onClick={() => setMonth((m) => (m === 11 ? 0 : m + 1))} className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary cursor-pointer"><ChevronRight size={18} /></button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-text-muted py-2">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = getDateString(day);
                const dayApts = getAppointmentsForDay(day);
                const isToday = dateStr === "2026-03-05";
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative p-2 rounded-lg text-sm transition-all aspect-square flex flex-col items-center justify-start cursor-pointer ${
                      isSelected ? "bg-brand/15 border border-border-brand" :
                      isToday ? "bg-bg-hover ring-1 ring-brand/40" :
                      "hover:bg-bg-hover"
                    }`}
                  >
                    <span className={`font-mono text-xs ${isToday ? "text-brand font-bold" : "text-text-primary"}`}>{day}</span>
                    {dayApts.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayApts.slice(0, 3).map((a) => (
                          <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${statusDotColor[a.status]}`} />
                        ))}
                        {dayApts.length > 3 && <span className="text-[8px] text-text-muted">+{dayApts.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day detail panel */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80 glass-card p-5 shrink-0"
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
                          <button
                            onClick={() => { setCheckedIn((prev) => new Set(prev).add(a.id)); addToast({ type: "success", title: `${a.patientName} checked in` }); }}
                            className="ml-auto text-[10px] text-brand hover:underline cursor-pointer"
                          >
                            Check In
                          </button>
                        )}
                        {checkedIn.has(a.id) && <Badge variant="success" className="text-[10px] ml-auto">Checked In</Badge>}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length === 0 && <p className="text-xs text-text-muted text-center py-4">No appointments</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  {["Date/Time", "Patient", "Doctor", "Type", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-primary">{formatDate(a.date)}</p>
                      <p className="text-xs text-text-muted font-mono">{formatTime(a.time)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={a.patientName} size="sm" />
                        <span className="text-sm text-text-primary">{a.patientName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{a.doctorName}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{a.type}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
                    <td className="px-4 py-3">
                      {a.status === "Scheduled" && !checkedIn.has(a.id) && (
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setCheckedIn((prev) => new Set(prev).add(a.id)); addToast({ type: "success", title: `${a.patientName} checked in` }); }}>Check In</Button>
                      )}
                      {checkedIn.has(a.id) && <Badge variant="success">Checked In</Badge>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} title="Book Appointment" size="lg">
        <div className="space-y-5">
          {/* Patient search */}
          <div className="relative">
            <Input
              label="Patient"
              placeholder="Search patient by name..."
              value={patientSearch}
              onChange={(e) => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
              onFocus={() => setShowPatientDropdown(true)}
            />
            {showPatientDropdown && filteredPatients.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-subtle rounded-lg overflow-hidden shadow-xl">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setBookForm((f) => ({ ...f, patientId: p.id })); setPatientSearch(p.name); setShowPatientDropdown(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-hover text-left transition-colors cursor-pointer"
                  >
                    <Avatar name={p.name} size="sm" />
                    <div>
                      <p className="text-sm text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-muted">{p.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={bookForm.date} onChange={(e) => setBookForm((f) => ({ ...f, date: e.target.value, time: "" }))} />
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Appointment Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {appointmentTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setBookForm((f) => ({ ...f, type: t }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      bookForm.type === t ? "bg-brand/15 text-brand border border-border-brand" : "bg-bg-surface text-text-secondary border border-border-subtle hover:bg-bg-hover"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time slots */}
          {bookForm.date && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Time Slot</label>
              <div className="flex gap-2 flex-wrap">
                {timeSlots.map((t) => {
                  const booked = bookedSlots.includes(t);
                  const selected = bookForm.time === t;
                  return (
                    <button
                      key={t}
                      disabled={booked}
                      onClick={() => setBookForm((f) => ({ ...f, time: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        booked ? "bg-bg-surface text-text-muted opacity-40 cursor-not-allowed line-through" :
                        selected ? "bg-brand text-bg-base" :
                        "bg-bg-surface text-text-secondary border border-border-subtle hover:border-brand"
                      }`}
                    >
                      {formatTime(t)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
            <textarea
              value={bookForm.notes}
              onChange={(e) => setBookForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none h-20 focus:border-brand focus:shadow-[0_0_0_3px_rgba(11,179,122,0.15)]"
              placeholder="Additional notes..."
            />
          </div>

          {/* Summary */}
          {bookForm.patientId && bookForm.date && bookForm.time && (
            <div className="bg-bg-surface rounded-lg p-4 border border-border-subtle">
              <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm">
                <p className="text-text-primary">{mockPatients.find((p) => p.id === bookForm.patientId)?.name}</p>
                <p className="text-text-secondary">{formatDate(bookForm.date)} at {formatTime(bookForm.time)}</p>
                <p className="text-text-muted">{bookForm.type} Appointment</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setBookingOpen(false)}>Cancel</Button>
            <Button onClick={handleBook} disabled={!bookForm.patientId || !bookForm.date || !bookForm.time}>
              Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
