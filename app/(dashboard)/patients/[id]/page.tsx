"use client";

import { useState, use } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Droplets, CalendarPlus, FileText, ArrowLeft, Calendar, Clock, Pill } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockPatients, mockAppointments, mockPrescriptions, mockFollowUps } from "@/lib/mock-data";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

type Tab = "overview" | "appointments" | "prescriptions" | "history";

const statusVariant: Record<string, "info" | "success" | "muted" | "danger"> = {
  Scheduled: "info",
  Completed: "success",
  Cancelled: "muted",
  "No-show": "danger",
};

export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const patient = mockPatients.find((p) => p.id === id);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const router = useRouter();
  const { addToast } = useToast();

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Patient not found. <Link href="/patients" className="text-brand ml-2 hover:underline">Go back</Link>
      </div>
    );
  }

  const patientAppointments = mockAppointments.filter((a) => a.patientId === patient.id);
  const patientPrescriptions = mockPrescriptions.filter((p) => p.patientId === patient.id);
  const patientFollowUps = mockFollowUps.filter((f) => f.patientId === patient.id);
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "appointments", label: "Appointments" },
    { key: "prescriptions", label: "Prescriptions" },
    { key: "history", label: "History" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Back */}
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Patients
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar name={patient.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-semibold text-2xl text-text-primary">{patient.name}</h1>
              <Badge variant={patient.status === "Active" ? "brand" : patient.status === "Follow-up Due" ? "warning" : "info"}>{patient.status}</Badge>
            </div>
            <p className="text-sm text-text-secondary">
              {patient.age}y • {patient.gender} • ID: <span className="font-mono">{patient.id}</span>
            </p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-text-muted"><Phone size={13} /> {patient.phone}</span>
              {patient.email && <span className="flex items-center gap-1.5 text-xs text-text-muted"><Mail size={13} /> {patient.email}</span>}
              {patient.bloodGroup && <span className="flex items-center gap-1.5 text-xs text-text-muted"><Droplets size={13} /> {patient.bloodGroup}</span>}
              {patient.address && <span className="flex items-center gap-1.5 text-xs text-text-muted"><MapPin size={13} /> {patient.address}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => router.push("/appointments")}><CalendarPlus size={16} /> Book Appointment</Button>
            <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "Note added", message: `Note saved for ${patient.name}` })}><FileText size={16} /> Add Note</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer ${
              activeTab === tab.key ? "text-brand" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Contact Information</h3>
            <div className="space-y-3">
              {[
                { label: "Phone", value: patient.phone },
                { label: "Email", value: patient.email || "—" },
                { label: "Blood Group", value: patient.bloodGroup || "—" },
                { label: "Doctor", value: patient.doctor || "—" },
                { label: "Registered", value: formatDate(patient.createdAt) },
                { label: "Last Visit", value: patient.lastVisit ? formatDate(patient.lastVisit) : "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-xs text-text-muted">{item.label}</span>
                  <span className="text-sm text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Quick Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Appointments", value: patientAppointments.length, icon: <Calendar size={18} />, color: "text-secondary" },
                { label: "Prescriptions", value: patientPrescriptions.length, icon: <Pill size={18} />, color: "text-success" },
                { label: "Follow-ups", value: patientFollowUps.length, icon: <Clock size={18} />, color: "text-warning" },
              ].map((s) => (
                <div key={s.label} className="bg-bg-surface rounded-lg p-3 border border-border-subtle">
                  <div className={`mb-1.5 ${s.color}`}>{s.icon}</div>
                  <p className="text-2xl font-mono font-medium text-text-primary">{s.value}</p>
                  <p className="text-xs text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Date", "Time", "Type", "Doctor", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patientAppointments.map((a) => (
                <tr key={a.id} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">{formatDate(a.date)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{formatTime(a.time)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.type}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.doctorName}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {patientAppointments.length === 0 && <div className="py-8 text-center text-sm text-text-muted">No appointments yet</div>}
        </div>
      )}

      {activeTab === "prescriptions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patientPrescriptions.map((rx) => (
            <div key={rx.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-primary">{rx.diagnosis}</p>
                <Badge variant={rx.status === "Finalized" ? "success" : "warning"}>{rx.status}</Badge>
              </div>
              <p className="text-xs text-text-muted mb-2">{formatDate(rx.date)} • {rx.doctorName}</p>
              <div className="space-y-1">
                {rx.medications.map((m) => (
                  <p key={m.id} className="text-xs text-text-secondary">
                    <span className="font-medium">{m.drugName}</span> — {m.dosage}, {m.frequency}, {m.duration}
                  </p>
                ))}
              </div>
              <Link href="/prescriptions" className="text-xs text-brand hover:underline mt-3 inline-block">View Full →</Link>
            </div>
          ))}
          {patientPrescriptions.length === 0 && (
            <div className="col-span-2 py-8 text-center text-sm text-text-muted">No prescriptions yet</div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="relative ml-4">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border-subtle" />
          {[...patientAppointments].reverse().map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative pl-8 pb-6"
            >
              <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-brand -translate-x-[5px]" />
              <Badge variant="brand" className="mb-2">{formatDate(a.date)}</Badge>
              <div className="glass-card p-4 ml-0">
                <p className="text-sm font-medium text-text-primary">{a.type} Consultation</p>
                <p className="text-xs text-text-muted mt-1">{a.doctorName} • {formatTime(a.time)}</p>
                <Badge variant={statusVariant[a.status]} className="mt-2">{a.status}</Badge>
              </div>
            </motion.div>
          ))}
          {patientAppointments.length === 0 && <div className="py-8 text-center text-sm text-text-muted">No history available</div>}
        </div>
      )}
    </motion.div>
  );
}
