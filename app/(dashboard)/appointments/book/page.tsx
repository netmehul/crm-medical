"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarPlus, Loader2, CheckCircle } from "lucide-react";
import { appointmentsApi, patientsApi, orgApi, type TeamMember } from "@/lib/api";
import type { Patient } from "@/lib/types";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import { formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const timeSlots = Array.from({ length: 45 }, (_, i) => {
  const totalMins = 8 * 60 + i * 15;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const appointmentTypes = [
  { label: "General", value: "general" },
  { label: "Follow-up", value: "follow_up" },
  { label: "Procedure", value: "procedure" },
  { label: "Emergency", value: "emergency" },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");
  const editId = searchParams.get("editId");
  const { addToast } = useToast();

  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [searchedPatients, setSearchedPatients] = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("general");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(30);
  const [doctorId, setDoctorId] = useState<string>("");
  const [status, setStatus] = useState("scheduled");

  const [doctors, setDoctors] = useState<TeamMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFromPatient = !!patientIdParam && !editId;

  // Load edit data
  useEffect(() => {
    async function loadEdit() {
      if (!editId) return;
      try {
        setLoading(true);
        const apt = await appointmentsApi.get(editId);
        setDate(apt.date || "");
        setTime(apt.time || "");
        setType(apt.type.toLowerCase().replace(/-/g, "_"));
        setReason(apt.reason || "");
        setNotes(apt.notes || "");
        setDoctorId(apt.doctorId || "");
        setStatus(apt.status.toLowerCase());
        setPatientId(apt.patientId);
        const p = await patientsApi.get(apt.patientId);
        setPatient(p);
      } catch {
        addToast({ type: "error", title: "Failed to load appointment details" });
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadEdit();
  }, [editId, addToast, router]);

  // Handle params for new booking
  useEffect(() => {
    const d = searchParams.get("date") || "";
    const t = searchParams.get("time") || "";
    const dur = searchParams.get("duration");
    if (d && !editId) setDate(d);
    if (t && !editId) setTime(t);
    if (dur && !editId) {
      const n = parseInt(dur, 10);
      if (!isNaN(n) && n >= 15 && n <= 120) setDuration(Math.round(n / 15) * 15);
    }
  }, [searchParams, editId]);

  useEffect(() => {
    if (patientIdParam && !editId) {
      setPatientId(patientIdParam);
      patientsApi.get(patientIdParam).then(setPatient).catch(() => setPatient(null));
    }
  }, [patientIdParam, editId]);

  useEffect(() => {
    if (!patientSearch || editId) return;
    const timer = setTimeout(async () => {
      try {
        const result = await patientsApi.list({ search: patientSearch });
        setSearchedPatients(result.items);
      } catch {
        setSearchedPatients([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, editId]);

  const fetchDoctors = useCallback(async () => {
    try {
      const team = await orgApi.getTeam();
      setDoctors(team);
      if (team.length > 0 && !doctorId) {
        setDoctorId(team[0].id);
      }
    } catch {
      setDoctors([]);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const [dayAppointments, setDayAppointments] = useState<{ date: string; time: string }[]>([]);
  const fetchDayAppointments = useCallback(async () => {
    if (!date) return;
    try {
      const result = await appointmentsApi.list({ date, limit: 100 });
      setDayAppointments(result.items.map((a) => ({ date: a.date, time: a.time })));
    } catch {
      setDayAppointments([]);
    }
  }, [date]);

  useEffect(() => {
    fetchDayAppointments();
  }, [fetchDayAppointments]);

  const bookedSlots = date ? dayAppointments.filter((a) => a.date === date).map((a) => a.time) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = patientId || patientIdParam;
    if (!pid || !date || !time) {
      addToast({ type: "warning", title: "Please fill required fields" });
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = `${date} ${time}:00`;
      const payload = {
        patient_id: pid,
        doctor_id: doctorId || undefined,
        scheduled_at: scheduledAt,
        appointment_date: date,
        start_time: time,
        duration_mins: duration,
        type,
        status: editId ? status : "scheduled",
        reason: reason || undefined,
        notes: notes || undefined,
      };

      if (editId) {
        await appointmentsApi.update(editId, payload);
        addToast({ type: "success", title: "Appointment updated successfully" });
      } else {
        await appointmentsApi.create(payload);
        addToast({ type: "success", title: "Appointment booked successfully" });
      }

      if (isFromPatient) {
        router.push(`/patients/${pid}`);
      } else {
        router.push("/appointments");
      }
    } catch (err: any) {
      const message = err.message || `Failed to ${editId ? "update" : "book"} appointment`;
      addToast({ type: "error", title: `Failed to ${editId ? "update" : "book"} appointment`, message });
    } finally {
      setSubmitting(false);
    }
  };

  const effectivePatientId = patientId || patientIdParam;
  const effectivePatientName = patient?.name || patientSearch || "Patient";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl space-y-6">
      <Link href={isFromPatient ? `/patients/${patientIdParam}` : "/appointments"} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft size={16} /> {isFromPatient ? "Back to Patient" : "Back to Appointments"}
      </Link>

      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary flex items-center gap-2">
          <CalendarPlus size={24} className="text-brand" /> {editId ? "Edit Appointment" : "Book Appointment"}
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {editId ? "Update appointment details" : (isFromPatient ? "Quick book for this patient" : "Schedule a new appointment")}
        </p>
      </div>

      <div className="glass-card p-4 md:p-6 space-y-6">
        {!isFromPatient && !editId && (
          <div className="relative">
            <Input
              label="Select Patient"
              placeholder="Search by name or phone..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowPatientDropdown(true);
              }}
              onFocus={() => setShowPatientDropdown(true)}
              autoComplete="off"
              required
            />
            {showPatientDropdown && searchedPatients.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-bg-elevated border border-border-base rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
                {searchedPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPatientId(p.id);
                      setPatientSearch(p.name);
                      setPatient(p);
                      setShowPatientDropdown(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-bg-hover text-left transition-colors cursor-pointer border-b border-border-subtle last:border-0"
                  >
                    <Avatar name={p.name} size="md" />
                    <div>
                      <p className="text-sm font-bold text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-muted">{p.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {effectivePatientId && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand/5 border border-brand/10">
            <Avatar name={effectivePatientName} size="sm" />
            <div>
              <p className="text-sm font-bold text-text-primary">{effectivePatientName}</p>
              <p className="text-xs text-text-muted">Selected Patient</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-2">Doctor</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full bg-bg-base border border-border-base rounded-xl px-4 py-3 text-base md:text-sm text-text-primary outline-none focus:border-brand"
            >
              <option value="">Select Doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-2">Duration</label>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${duration === d ? "bg-brand/10 border-brand text-brand" : "bg-bg-base border-border-base text-text-muted"}`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Input
            label="Appointment Date"
            type="date"
            value={date}
            min={getTodayStr()}
            onChange={(e) => { setDate(e.target.value); setTime(""); }}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-2">Consultation Type</label>
          <div className="grid grid-cols-2 sm:flex gap-2">
            {appointmentTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-bold border transition-all ${type === t.value ? "bg-brand/10 border-brand text-brand" : "bg-bg-base border-border-base text-text-muted"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {date && (
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-3">Available Slots</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {timeSlots.map((t) => {
                const isToday = date === getTodayStr();
                const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
                const past = isToday && timeToMinutes(t) < nowMins;
                const isCurrent = editId && t === time;
                const booked = (bookedSlots.includes(t) && !isCurrent) || (past && !isCurrent);
                const selected = time === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={booked}
                    onClick={() => setTime(t)}
                    className={`h-11 flex items-center justify-center rounded-xl text-xs font-mono font-bold border transition-all ${booked ? "bg-bg-hover text-text-muted/40 border-transparent cursor-not-allowed line-through" : selected ? "bg-brand border-brand text-white shadow-lg" : "bg-bg-base border-border-base text-text-secondary"}`}
                  >
                    {formatTime(t)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-bg-base border border-border-base rounded-xl px-4 py-3 text-base md:text-sm text-text-primary h-24 focus:border-brand outline-none"
            placeholder="Add any additional notes here..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className="w-full h-12"
            onClick={handleSubmit}
            disabled={!effectivePatientId || !date || !time || submitting}
            isLoading={submitting}
          >
            <CalendarPlus size={18} />
            {editId ? "Update Appointment" : "Confirm Appointment"}
          </Button>
          <Button variant="ghost" className="w-full h-12" onClick={() => router.back()}>Cancel</Button>
        </div>
      </div>
    </motion.div>
  );
}
