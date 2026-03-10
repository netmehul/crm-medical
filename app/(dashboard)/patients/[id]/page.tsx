"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone, Mail, MapPin, Droplets, CalendarPlus, FileText, ArrowLeft, Calendar, Clock, Pill, Loader2,
  FlaskConical, Send, MessageCircle, Printer, Plus, X, AlertTriangle, CheckCircle2, Package, ExternalLink,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { patientsApi, appointmentsApi, prescriptionsApi, patientFilesApi, referralsApi, labsApi } from "@/lib/api";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import type { Patient, Appointment, Prescription, PatientNote, LabReferral, ExternalLab, ReferralStatus, ReferralUrgency } from "@/lib/types";
import Modal from "@/components/ui/modal";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import ReportsTab from "@/components/modules/patients/ReportsTab";
import UploadReportModal from "@/components/modules/patients/UploadReportModal";

type Tab = "overview" | "appointments" | "prescriptions" | "reports" | "referrals" | "history";

const statusVariant: Record<string, "info" | "success" | "muted" | "danger"> = {
  Scheduled: "info",
  Completed: "success",
  Cancelled: "muted",
  "No-show": "danger",
};

const referralStatusConfig: Record<ReferralStatus, { label: string; variant: "warning" | "info" | "brand" | "success" | "muted" }> = {
  pending: { label: "Pending", variant: "warning" },
  sent: { label: "Sent", variant: "info" },
  appointment_confirmed: { label: "Confirmed", variant: "brand" },
  sample_collected: { label: "Collected", variant: "brand" },
  results_received: { label: "Results In", variant: "success" },
  cancelled: { label: "Cancelled", variant: "muted" },
};

const urgencyConfig: Record<ReferralUrgency, { label: string; color: string }> = {
  routine: { label: "Routine", color: "text-emerald-500" },
  urgent: { label: "Urgent", color: "text-amber-500" },
  emergency: { label: "Emergency", color: "text-red-500" },
};

export default function PatientProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [referrals, setReferrals] = useState<LabReferral[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Create Referral modal state
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralStep, setReferralStep] = useState(1);
  const [availableLabs, setAvailableLabs] = useState<ExternalLab[]>([]);
  const [referralForm, setReferralForm] = useState({
    labId: "", urgency: "routine" as ReferralUrgency,
    clinicalNotes: "", specialInstructions: "",
    tests: [{ testName: "", testCode: "", instructions: "" }] as { testName: string; testCode: string; instructions: string }[],
  });
  const [creatingSaving, setCreatingSaving] = useState(false);

  // Send modal state
  const [sendingReferralId, setSendingReferralId] = useState<string | null>(null);
  const [sendingChannel, setSendingChannel] = useState<string | null>(null);

  // Upload Report modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const router = useRouter();
  const { addToast } = useToast();
  const breadcrumb = useBreadcrumb();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [patientData, notesData] = await Promise.all([
          patientsApi.get(id),
          patientFilesApi.getNotes(id).catch(() => ({ items: [] as PatientNote[] })),
        ]);

        if (cancelled) return;
        setPatient(patientData);
        setNotes(notesData.items);
        if (breadcrumb) breadcrumb.setLabel(`/patients/${id}`, patientData.name);

        const [apptData, rxData, refData, reportsData] = await Promise.all([
          appointmentsApi.list({ page: 1, limit: 100, patient_id: id } as Parameters<typeof appointmentsApi.list>[0]).catch(() => ({ items: [] as Appointment[] })),
          prescriptionsApi.list({ page: 1, limit: 100, patient_id: id } as Parameters<typeof prescriptionsApi.list>[0]).catch(() => ({ items: [] as Prescription[] })),
          referralsApi.list({ patientId: id, limit: 100 }).catch(() => ({ items: [] as LabReferral[] })),
          patientFilesApi.getReports(id).catch(() => ({ items: [] })),
        ]);

        if (cancelled) return;
        setPatientAppointments(apptData.items.filter((a) => a.patientId === id));
        setPatientPrescriptions(rxData.items.filter((p) => p.patientId === id));
        setReferrals(refData.items);
        setReports(reportsData.items);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load patient";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
      if (breadcrumb) breadcrumb.clearLabel(`/patients/${id}`);
    };
    // breadcrumb is omitted from dependencies to prevent loop, 
    // it's stable enough for label setting after memoization
  }, [id]);

  const openReferralModal = async () => {
    setReferralStep(1);
    setReferralForm({ labId: "", urgency: "routine", clinicalNotes: "", specialInstructions: "", tests: [{ testName: "", testCode: "", instructions: "" }] });
    try {
      const labs = await labsApi.listActive();
      setAvailableLabs(labs);
    } catch { /* ignore */ }
    setReferralModalOpen(true);
  };

  const addTest = () => {
    setReferralForm(f => ({ ...f, tests: [...f.tests, { testName: "", testCode: "", instructions: "" }] }));
  };
  const removeTest = (idx: number) => {
    setReferralForm(f => ({ ...f, tests: f.tests.filter((_, i) => i !== idx) }));
  };
  const updateTest = (idx: number, field: string, value: string) => {
    setReferralForm(f => ({ ...f, tests: f.tests.map((t, i) => i === idx ? { ...t, [field]: value } : t) }));
  };

  const handleCreateReferral = async () => {
    if (!referralForm.labId) { addToast({ type: "warning", title: "Please select a lab" }); return; }
    const validTests = referralForm.tests.filter(t => t.testName.trim());
    if (validTests.length === 0) { addToast({ type: "warning", title: "Add at least one test" }); return; }
    setCreatingSaving(true);
    try {
      const created = await referralsApi.create({
        patientId: id,
        labId: referralForm.labId,
        urgency: referralForm.urgency,
        clinicalNotes: referralForm.clinicalNotes || null,
        specialInstructions: referralForm.specialInstructions || null,
        tests: validTests.map(t => ({ testName: t.testName, testCode: t.testCode || null, instructions: t.instructions || null })),
      });
      setReferrals(prev => [created, ...prev]);
      setReferralModalOpen(false);
      addToast({ type: "success", title: "Referral created", message: `Reference: ${created.referenceNumber}` });
    } catch {
      addToast({ type: "error", title: "Failed to create referral" });
    } finally {
      setCreatingSaving(false);
    }
  };

  const handleSendReferral = async (referralId: string, channel: string) => {
    setSendingReferralId(referralId);
    setSendingChannel(channel);
    try {
      const result = await referralsApi.send(referralId, { channels: [channel] }) as Record<string, unknown>;
      if (channel === "whatsapp" && result.whatsapp) {
        const wa = result.whatsapp as { deepLink: string };
        window.open(wa.deepLink, "_blank");
        addToast({ type: "success", title: "WhatsApp opened", message: "Send the message in WhatsApp." });
      } else if (channel === "email") {
        addToast({ type: "success", title: "Email sent", message: "Referral letter emailed to lab." });
      }
      const updated = await referralsApi.get(referralId);
      setReferrals(prev => prev.map(r => r.id === referralId ? updated : r));
    } catch {
      addToast({ type: "error", title: `Failed to send via ${channel}` });
    } finally {
      setSendingReferralId(null);
      setSendingChannel(null);
    }
  };

  const handleStatusUpdate = async (referralId: string, status: ReferralStatus) => {
    try {
      const updated = await referralsApi.updateStatus(referralId, status);
      setReferrals(prev => prev.map(r => r.id === referralId ? updated : r));
      addToast({ type: "success", title: "Status updated" });
    } catch {
      addToast({ type: "error", title: "Failed to update status" });
    }
  };

  const handleViewLetter = (referralId: string) => {
    const url = referralsApi.getLetterUrl(referralId);
    window.open(url, "_blank");
  };

  const handleAddNote = async () => {
    if (!patient) return;
    try {
      const note = await patientFilesApi.addNote(id, { title: "Quick Note", content: "" });
      setNotes((prev) => [note, ...prev]);
      addToast({ type: "info", title: "Note added", message: `Note saved for ${patient.name}` });
    } catch {
      addToast({ type: "error", title: "Failed to add note" });
    }
  };

  const handleUploadReport = async (formData: FormData) => {
    try {
      const newReport = await patientFilesApi.uploadReport(id, formData);
      setReports((prev) => [newReport, ...prev]);
      addToast({ type: "success", title: "Report uploaded successfully" });
    } catch (err) {
      addToast({ type: "error", title: "Failed to upload report" });
      throw err;
    }
  };

  const handleRefreshReports = async () => {
    try {
      const data = await patientFilesApi.getReports(id);
      setReports(data.items);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        {error || "Patient not found."} <Link href="/patients" className="text-brand ml-2 hover:underline">Go back</Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "appointments", label: "Appointments" },
    { key: "prescriptions", label: "Prescriptions" },
    { key: "reports", label: "Reports" },
    { key: "referrals", label: "Referrals" },
    { key: "history", label: "History" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-full overflow-x-hidden"
    >
      {/* Back */}
      <div className="px-1">
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </div>

      {/* Header Card */}
      <div className="glass-card p-4 md:p-6 overflow-hidden w-full">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 w-full">
          <div className="relative shrink-0">
            <Avatar name={patient.name} size="xl" className="md:size-lg" />
            <div className="absolute -bottom-1 -right-1 md:hidden">
              <Badge variant={patient.status === "Active" ? "brand" : patient.status === "Follow-up Due" ? "warning" : "info"}>{patient.status}</Badge>
            </div>
          </div>

          <div className="flex-1 min-w-0 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary truncate">{patient.name}</h1>
              <div className="hidden md:block">
                <Badge variant={patient.status === "Active" ? "brand" : patient.status === "Follow-up Due" ? "warning" : "info"}>{patient.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-text-secondary font-medium truncate">
              {patient.age}y • {patient.gender} • <span className="text-text-muted font-mono bg-bg-surface px-2 py-0.5 rounded border border-border-subtle">{patient.patientCode || patient.id.slice(0, 8)}</span>
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4 mt-4 overflow-x-auto no-scrollbar pb-1 w-full">
              <span className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap"><Phone size={13} className="text-brand" /> {patient.phone}</span>
              {patient.email && <span className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap"><Mail size={13} className="text-brand" /> {patient.email}</span>}
              {patient.bloodGroup && <span className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap"><Droplets size={13} className="text-brand" /> {patient.bloodGroup}</span>}
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
            <Button className="flex-1" size="md" onClick={() => router.push(`/appointments/book?patientId=${id}`)}><CalendarPlus size={18} /> <span className="hidden sm:inline">Book</span></Button>
            <Button className="flex-1" variant="ghost" size="md" onClick={handleAddNote}><FileText size={18} /> <span className="hidden sm:inline">Note</span></Button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="sticky top-0 z-20 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle py-2">
        {/* Mobile Dropdown (on lg) to ensure it fits better on tablets too */}
        <div className="lg:hidden">
          <div className="relative group">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as Tab)}
              className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all cursor-pointer shadow-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-focus-within:text-brand transition-colors">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {/* Desktop Tabs (only on lg now) */}
        <div className="hidden lg:flex overflow-x-auto no-scrollbar gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all relative cursor-pointer ${isActive ? "text-brand" : "text-text-muted hover:text-text-secondary"
                  }`}
              >
                {tab.key === "prescriptions" && isActive ? "Prescriptions" : tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-1 bg-brand rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "reports" && (
        <ReportsTab patientId={id} patientName={patient.name} reports={reports} onRefresh={handleRefreshReports} />
      )}

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Contact Information</h3>
            <div className="space-y-3">
              {[
                { label: "Code", value: patient.patientCode || patient.id.slice(0, 8) },
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
                { label: "Reports", value: reports.length, icon: <FileText size={18} />, color: "text-brand" },
                { label: "Notes", value: notes.length, icon: <Clock size={18} />, color: "text-warning" },
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
        <>
          {/* Desktop View */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-base/30">
                  {["Date", "Time", "Type", "Doctor", "Status"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/30">
                {patientAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3.5 text-sm font-semibold text-text-primary">{formatDate(a.date)}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-text-secondary">{formatTime(a.time)}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary font-medium">{a.type}</td>
                    <td className="px-4 py-3.5 text-sm text-text-secondary">{a.doctorName}</td>
                    <td className="px-4 py-3.5"><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patientAppointments.length === 0 && <div className="py-20 text-center text-sm text-text-muted font-medium">No appointments yet</div>}
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {patientAppointments.map((a) => (
              <div key={a.id} className="glass-card p-4 active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                  <span className="text-[11px] text-text-muted font-mono">{formatDate(a.date)} • {formatTime(a.time)}</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{a.type} Consultation</h3>
                <p className="text-xs text-text-secondary font-medium">Dr. {a.doctorName}</p>
              </div>
            ))}
            {patientAppointments.length === 0 && (
              <div className="py-20 text-center glass-card">
                <p className="text-sm text-text-muted font-medium">No appointments yet</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "prescriptions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {patientPrescriptions.map((rx, i) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 md:p-5 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-sm font-bold text-text-primary truncate">{rx.diagnosis}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{formatDate(rx.date)} • {rx.doctorName}</p>
                </div>
                <Badge variant={rx.status === "Finalized" ? "success" : "warning"}>{rx.status}</Badge>
              </div>

              <div className="space-y-2 pb-3 border-b border-border-subtle/40">
                {rx.medications.map((m) => (
                  <div key={m.id} className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-text-secondary">{m.drugName}</span>
                    <span className="text-[11px] text-text-muted">{m.dosage} • {m.frequency} • {m.duration}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3">
                <Link href="/prescriptions" className="text-[11px] font-bold text-brand uppercase hover:underline">View Full Details</Link>
                <button className="h-7 w-7 flex items-center justify-center rounded-lg bg-bg-surface border border-border-subtle text-text-muted hover:text-brand transition-colors">
                  <Printer size={12} />
                </button>
              </div>
            </motion.div>
          ))}
          {patientPrescriptions.length === 0 && (
            <div className="col-span-full py-20 text-center glass-card">
              <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted mx-auto mb-3">
                <Pill size={24} />
              </div>
              <p className="text-sm text-text-muted font-medium">No prescriptions yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "referrals" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openReferralModal}><Plus size={16} /> New Referral</Button>
          </div>

          {referrals.length === 0 ? (
            <div className="glass-card py-12 text-center">
              <FlaskConical size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">No lab referrals yet</p>
              <Button size="sm" variant="ghost" className="mt-3" onClick={openReferralModal}>Create First Referral</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map(ref => {
                const sc = referralStatusConfig[ref.status];
                const uc = urgencyConfig[ref.urgency];
                const isSending = sendingReferralId === ref.id;
                return (
                  <motion.div key={ref.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-text-primary">{ref.referenceNumber}</span>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                          <span className={`text-xs font-medium ${uc.color}`}>{uc.label}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{ref.labName} &mdash; {ref.tests.map(t => t.testName).join(", ")}</p>
                        <p className="text-xs text-text-muted mt-1">{formatDate(ref.referralDate)} &bull; Dr. {ref.doctorName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {ref.letterGeneratedAt && (
                        <button onClick={() => handleViewLetter(ref.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-bg-surface border border-border-base text-xs text-text-secondary hover:text-brand hover:border-brand/30 transition-colors cursor-pointer">
                          <FileText size={12} /> View Letter
                        </button>
                      )}
                      {ref.labEmail && (
                        <button
                          onClick={() => handleSendReferral(ref.id, "email")}
                          disabled={isSending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-bg-surface border border-border-base text-xs text-text-secondary hover:text-brand hover:border-brand/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSending && sendingChannel === "email" ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          {ref.emailSentAt ? "Resend Email" : "Send Email"}
                        </button>
                      )}
                      {(ref.labWhatsapp || ref.labPhone) && (
                        <button
                          onClick={() => handleSendReferral(ref.id, "whatsapp")}
                          disabled={isSending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-bg-surface border border-border-base text-xs text-text-secondary hover:text-green-600 hover:border-green-500/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSending && sendingChannel === "whatsapp" ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                          WhatsApp
                        </button>
                      )}
                      <button onClick={() => handleViewLetter(ref.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-bg-surface border border-border-base text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                        <Printer size={12} /> Print
                      </button>
                      {ref.status !== "results_received" && ref.status !== "cancelled" && (
                        <select
                          value={ref.status}
                          onChange={(e) => handleStatusUpdate(ref.id, e.target.value as ReferralStatus)}
                          className="ml-auto px-2 py-1.5 rounded-md bg-bg-surface border border-border-base text-xs text-text-secondary cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand/30"
                        >
                          <option value="pending">Pending</option>
                          <option value="sent">Sent</option>
                          <option value="appointment_confirmed">Appointment Confirmed</option>
                          <option value="sample_collected">Sample Collected</option>
                          <option value="results_received">Results Received</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>

                    {ref.emailSentAt && <p className="text-[11px] text-text-muted mt-2">Email sent to {ref.emailSentTo} on {formatDate(ref.emailSentAt)}</p>}
                    {ref.whatsappSentAt && <p className="text-[11px] text-text-muted">WhatsApp sent to {ref.whatsappSentTo} on {formatDate(ref.whatsappSentAt)}</p>}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Referral Modal */}
      <Modal isOpen={referralModalOpen} onClose={() => setReferralModalOpen(false)} title="Create Lab Referral" size="lg">
        {/* Steps indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= referralStep ? "bg-brand" : "bg-border-subtle"}`} />
          ))}
        </div>

        {referralStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Step 1: Select Lab & Priority</h3>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Select Lab *</label>
              <select
                value={referralForm.labId}
                onChange={(e) => setReferralForm(f => ({ ...f, labId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              >
                <option value="">Choose a lab...</option>
                {availableLabs.map(lab => (
                  <option key={lab.id} value={lab.id}>{lab.name} ({lab.city || lab.type})</option>
                ))}
              </select>
              {availableLabs.length === 0 && (
                <p className="text-xs text-text-muted mt-1">No labs added yet. <Link href="/labs" className="text-brand hover:underline">Add one first</Link></p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Urgency</label>
              <div className="flex gap-2">
                {(["routine", "urgent", "emergency"] as ReferralUrgency[]).map(u => (
                  <button
                    key={u}
                    onClick={() => setReferralForm(f => ({ ...f, urgency: u }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${referralForm.urgency === u
                      ? u === "routine" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : u === "urgent" ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          : "bg-red-500/10 border-red-500/30 text-red-500"
                      : "bg-bg-surface border-border-base text-text-muted"
                      }`}
                  >
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => { if (!referralForm.labId) { addToast({ type: "warning", title: "Select a lab" }); return; } setReferralStep(2); }}>Next</Button>
            </div>
          </div>
        )}

        {referralStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Step 2: Tests Required</h3>
            <div className="space-y-3">
              {referralForm.tests.map((test, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Test name (e.g. CBC)"
                      value={test.testName}
                      onChange={(e) => updateTest(idx, "testName", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      placeholder="Code"
                      value={test.testCode}
                      onChange={(e) => updateTest(idx, "testCode", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Instructions (e.g. Fasting)"
                      value={test.instructions}
                      onChange={(e) => updateTest(idx, "instructions", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                  </div>
                  {referralForm.tests.length > 1 && (
                    <button onClick={() => removeTest(idx)} className="p-2 text-text-muted hover:text-red-500 cursor-pointer"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addTest} className="text-xs text-brand hover:underline flex items-center gap-1 cursor-pointer"><Plus size={12} /> Add Test</button>
            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setReferralStep(1)}>Back</Button>
              <Button onClick={() => { if (!referralForm.tests.some(t => t.testName.trim())) { addToast({ type: "warning", title: "Add at least one test" }); return; } setReferralStep(3); }}>Next</Button>
            </div>
          </div>
        )}

        {referralStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Step 3: Notes & Confirm</h3>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Clinical Notes / History (optional)</label>
              <textarea
                value={referralForm.clinicalNotes}
                onChange={(e) => setReferralForm(f => ({ ...f, clinicalNotes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none font-sans"
                placeholder="Relevant clinical history..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Special Instructions (optional)</label>
              <textarea
                value={referralForm.specialInstructions}
                onChange={(e) => setReferralForm(f => ({ ...f, specialInstructions: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none font-sans"
                placeholder="e.g. Patient is fasting since 8 hours"
              />
            </div>

            {/* Summary */}
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Summary</p>
              <p className="text-sm text-text-primary">Lab: <strong>{availableLabs.find(l => l.id === referralForm.labId)?.name || "—"}</strong></p>
              <p className="text-sm text-text-primary">Priority: <span className={urgencyConfig[referralForm.urgency].color}>{urgencyConfig[referralForm.urgency].label}</span></p>
              <p className="text-sm text-text-primary">Tests: {referralForm.tests.filter(t => t.testName.trim()).map(t => t.testName).join(", ") || "—"}</p>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setReferralStep(2)}>Back</Button>
              <Button onClick={handleCreateReferral} isLoading={creatingSaving}>Create Referral</Button>
            </div>
          </div>
        )}
      </Modal>

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

      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadReport}
        patientName={patient.name}
      />
    </motion.div>
  );
}
