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

// 15-min slots from 8:00 to 19:00 to match calendar drag-select (8 AM - 7 PM)
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
  const { addToast } = useToast();

  const [patientId, setPatientId] = useState(patientIdParam || "");
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

  const [doctors, setDoctors] = useState<TeamMember[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isFromPatient = !!patientIdParam;

  useEffect(() => {
    const d = searchParams.get("date") || "";
    const t = searchParams.get("time") || "";
    const dur = searchParams.get("duration");
    if (d) setDate(d);
    if (t) setTime(t);
    if (dur) {
      const n = parseInt(dur, 10);
      if (!isNaN(n) && n >= 15 && n <= 120) {
        const options = [15, 30, 45, 60, 90];
        const closest = options.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
        setDuration(closest);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (patientIdParam) {
      setPatientId(patientIdParam);
      patientsApi.get(patientIdParam).then(setPatient).catch(() => setPatient(null));
    }
  }, [patientIdParam]);

  useEffect(() => {
    if (!patientSearch) {
      setSearchedPatients([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await patientsApi.list({ search: patientSearch });
        setSearchedPatients(result.items);
      } catch {
        setSearchedPatients([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const fetchDoctors = useCallback(async () => {
    try {
      const team = await orgApi.getTeam();
      const docList = team.filter((m) => m.branches?.some((b: { role: string }) => b.role === "org_admin"));
      setDoctors(docList.length > 0 ? docList : team);
      if (team.length > 0 && !doctorId) {
        setDoctorId(team[0].id);
      }
    } catch {
      setDoctors([]);
    }
  }, [doctorId]);

  useEffect(() => {
    if (!isFromPatient) fetchDoctors();
  }, [isFromPatient, fetchDoctors]);

  const [appointments, setAppointments] = useState<{ date: string; time: string }[]>([]);
  const fetchAppointments = useCallback(async () => {
    if (!date) return;
    try {
      const result = await appointmentsApi.list({ date, limit: 100 });
      setAppointments(result.items.map((a) => ({ date: a.date, time: a.time })));
    } catch {
      setAppointments([]);
    }
  }, [date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const bookedSlots = date ? appointments.filter((a) => a.date === date).map((a) => a.time) : [];

  const handleSubmit = async () => {
    const pid = isFromPatient ? patientIdParam : patientId;
    if (!pid || !date || !time) {
      addToast({ type: "warning", title: "Please fill required fields" });
      return;
    }

    const scheduledAtDate = new Date(`${date}T${time}:00`);
    if (scheduledAtDate < new Date(new Date().getTime() - 60000)) {
      addToast({ type: "error", title: "Cannot book in the past", message: "Please select a future date and time." });
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = `${date}T${time}:00.000Z`;
      await appointmentsApi.create({
        patient_id: pid,
        doctor_id: doctorId || undefined,
        scheduled_at: scheduledAt,
        appointment_date: date,
        start_time: time,
        duration_mins: duration,
        type,
        reason: reason || undefined,
        notes: notes || undefined,
      });
      addToast({ type: "success", title: "Appointment booked successfully" });
      if (isFromPatient) {
        router.push(`/patients/${pid}`);
      } else {
        router.push("/appointments");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to book appointment";
      addToast({ type: "error", title: "Failed to book appointment", message });
    } finally {
      setSubmitting(false);
    }
  };

  const effectivePatientId = isFromPatient ? patientIdParam : patientId;
  const effectivePatientName = isFromPatient ? patient?.name : patientSearch && searchedPatients.find((p) => p.id === patientId)?.name;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl space-y-6">
      <Link href={isFromPatient ? `/patients/${patientIdParam}` : "/appointments"} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft size={16} /> {isFromPatient ? "Back to Patient" : "Back to Appointments"}
      </Link>

      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary flex items-center gap-2">
          <CalendarPlus size={24} className="text-brand" /> Book Appointment
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {isFromPatient ? "Quick book for this patient" : "Schedule a new appointment"}
        </p>
      </div>

      <div className="glass-card p-4 md:p-6 space-y-6">
        {/* Patient: only when not from patient view */}
        {!isFromPatient && (
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
                      setShowPatientDropdown(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-bg-hover text-left transition-colors cursor-pointer border-b border-border-subtle last:border-0"
                  >
                    <Avatar name={p.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{p.name}</p>
                      <p className="text-xs text-text-muted">{p.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isFromPatient && patient && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-brand/20 shadow-sm">
            <Avatar name={patient.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">{patient.name}</p>
              <p className="text-xs text-text-muted transition-all">{patient.phone}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isFromPatient && doctors.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-2">Assign Doctor</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-4 py-3 text-base md:text-sm text-text-primary cursor-pointer outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 min-h-[48px]"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-2">Duration</label>
            <div className="flex bg-bg-surface p-1 rounded-xl border border-border-subtle overflow-x-auto no-scrollbar">
              {[15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 min-w-[60px] py-2 px-2 text-xs font-bold rounded-lg transition-all ${duration === d ? "bg-brand text-text-on-brand shadow-sm" : "text-text-muted hover:text-text-secondary"
                    }`}
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
                className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-bold transition-all border ${type === t.value ? "bg-brand/10 border-brand text-brand" : "bg-bg-base border-border-base text-text-muted hover:border-brand/30"
                  }`}
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
                const booked = bookedSlots.includes(t) || past;
                const selected = time === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={booked}
                    onClick={() => setTime(t)}
                    className={`h-11 flex items-center justify-center rounded-xl text-xs font-mono font-bold transition-all border ${booked ? "bg-bg-hover text-text-muted/40 border-transparent cursor-not-allowed line-through" :
                      selected ? "bg-brand border-brand text-white shadow-lg shadow-brand/20 scale-105" :
                        "bg-bg-base border-border-base text-text-secondary hover:border-brand"
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
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-tight mb-2">Patient Concern / Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-bg-base border border-border-base rounded-xl px-4 py-3 text-base md:text-sm text-text-primary placeholder:text-text-muted resize-none h-24 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none"
            placeholder="What is the patient visiting for?"
          />
        </div>

        {/* Summary Card for Mobile Sticky Feeling */}
        {effectivePatientId && date && time && (
          <div className="bg-brand/5 rounded-2xl p-4 border border-brand/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                <CheckCircle size={16} />
              </div>
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Booking Review</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Patient</p>
                <p className="text-sm font-bold text-text-primary truncate">{effectivePatientName || "Patient"}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Schedule</p>
                <p className="text-sm font-bold text-text-primary">{formatDate(date)} • {formatTime(time)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className="w-full h-12"
            onClick={handleSubmit}
            disabled={!effectivePatientId || !date || !time || submitting}
            isLoading={submitting}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CalendarPlus size={18} />}
            Confirm Appointment
          </Button>
          <Button variant="ghost" className="w-full h-12" onClick={() => router.back()}>Cancel Booking</Button>
        </div>
      </div>
    </motion.div>
  );
}
