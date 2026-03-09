"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FileText, Printer, X, Pill, Loader2, Calendar, History as HistoryIcon } from "lucide-react";
import { prescriptionsApi, patientsApi } from "@/lib/api";
import { Prescription, Medication, Patient } from "@/lib/types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();

  // Patient search state
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);

  const [rxForm, setRxForm] = useState({
    patientId: "", patientSearch: "", diagnosis: "", notes: "",
    followupRequired: false, followupDate: "", followupTime: "10:00", followupNotes: "",
    medications: [{ id: "1", drugName: "", dosage: "", frequency: "", duration: "", notes: "" }] as Medication[],
  });

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await prescriptionsApi.list({ limit: 100 });
      setPrescriptions(data.items);
    } catch {
      addToast({ type: "error", title: "Failed to load prescriptions" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Debounced patient search
  useEffect(() => {
    if (!createOpen) return;

    const term = rxForm.patientSearch.trim();
    const timer = setTimeout(async () => {
      try {
        setPatientSearchLoading(true);
        const data = await patientsApi.list({ search: term || undefined, limit: 5 });
        setPatientResults(data.items);
      } catch {
        setPatientResults([]);
      } finally {
        setPatientSearchLoading(false);
      }
    }, term ? 300 : 0);

    return () => clearTimeout(timer);
  }, [rxForm.patientSearch, createOpen]);

  const filtered = prescriptions.filter((p) =>
    p.patientName.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  const addMedRow = () => {
    setRxForm((f) => ({
      ...f,
      medications: [...f.medications, { id: String(Date.now()), drugName: "", dosage: "", frequency: "", duration: "", notes: "" }],
    }));
  };

  const removeMedRow = (id: string) => {
    setRxForm((f) => ({ ...f, medications: f.medications.filter((m) => m.id !== id) }));
  };

  const updateMed = (id: string, field: keyof Medication, value: string) => {
    setRxForm((f) => ({
      ...f,
      medications: f.medications.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };

  const handleCreate = async (status: "Draft" | "Finalized") => {
    if (!rxForm.patientId) return;

    try {
      setCreating(true);
      await prescriptionsApi.create({
        patient_id: rxForm.patientId,
        diagnosis: rxForm.diagnosis,
        notes: rxForm.notes,
        prescription_date: new Date().toISOString().split("T")[0],
        status: status.toLowerCase(),
        followup_required: rxForm.followupRequired,
        followup_date: rxForm.followupRequired ? rxForm.followupDate : undefined,
        followup_time: rxForm.followupRequired ? rxForm.followupTime : undefined,
        followup_notes: rxForm.followupRequired ? rxForm.followupNotes : undefined,
        medications: rxForm.medications
          .filter((m) => m.drugName)
          .map((m) => ({
            medicine_name: m.drugName,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.notes,
          })),
      });
      addToast({ type: "success", title: `Prescription ${status === "Draft" ? "saved as draft" : "finalized"}` });
      setRxForm({
        patientId: "", patientSearch: "", diagnosis: "", notes: "",
        followupRequired: false, followupDate: "", followupTime: "10:00", followupNotes: "",
        medications: [{ id: "1", drugName: "", dosage: "", frequency: "", duration: "", notes: "" }]
      });
      setCreateOpen(false);
      await fetchPrescriptions();
    } catch {
      addToast({ type: "error", title: "Failed to create prescription" });
    } finally {
      setCreating(false);
    }
  };

  const handleView = async (rx: Prescription) => {
    try {
      setViewLoading(true);
      setViewRx(rx);
      const full = await prescriptionsApi.get(rx.id);
      setViewRx(full);
    } catch {
      addToast({ type: "error", title: "Failed to load prescription details" });
    } finally {
      setViewLoading(false);
    }
  };

  const [patientDropdown, setPatientDropdown] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Prescriptions</h1>
          <p className="text-sm text-text-secondary mt-0.5">{prescriptions.length} total prescriptions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm"><Plus size={16} /> New Prescription</Button>
      </div>

      <div className="w-64">
        <Input placeholder="Search prescriptions..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileText size={32} />} title="No prescriptions" description="No prescriptions found. Create one to get started." actionLabel="New Prescription" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rx, i) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleView(rx)}
              className="glass-card p-5 hover:border-border-brand transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar name={rx.patientName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{rx.patientName}</p>
                    <p className="text-xs text-text-muted">{formatDate(rx.date)}</p>
                  </div>
                </div>
                <Badge variant={rx.status === "Finalized" ? "success" : "warning"}>{rx.status}</Badge>
              </div>
              <p className="text-xs text-text-secondary mb-2">{rx.diagnosis}</p>
              <p className="text-xs text-text-muted">{rx.medications.length} medication{rx.medications.length !== 1 ? "s" : ""} • {rx.doctorName}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Prescription Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Prescription" size="xl">
        <div className="space-y-5">
          {/* Patient */}
          <div className="relative">
            <Input
              label="Patient"
              placeholder="Search patient..."
              value={rxForm.patientSearch}
              onChange={(e) => { setRxForm((f) => ({ ...f, patientSearch: e.target.value, patientId: "" })); setPatientDropdown(true); }}
              onFocus={() => setPatientDropdown(true)}
            />
            {!rxForm.patientId && (
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="text-xs text-text-muted">{patientSearchLoading ? "Searching..." : "Recent:"}</span>
                {patientResults.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setRxForm((f) => ({ ...f, patientId: p.id, patientSearch: p.name })); setPatientDropdown(false); }}
                    className="text-xs px-2 py-1 rounded bg-bg-surface text-text-secondary border border-border-subtle hover:border-brand transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {patientDropdown && patientResults.length > 0 && !rxForm.patientId && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-subtle rounded-lg overflow-hidden shadow-xl max-h-40 overflow-y-auto">
                {patientResults.map((p) => (
                  <button key={p.id} onClick={() => { setRxForm((f) => ({ ...f, patientId: p.id, patientSearch: p.name })); setPatientDropdown(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-hover text-left text-sm text-text-primary cursor-pointer">
                    <Avatar name={p.name} size="sm" /> {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input label="Diagnosis" value={rxForm.diagnosis} onChange={(e) => setRxForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="Primary diagnosis" />

          {/* Medications */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Medications</label>
            <div className="space-y-2">
              <AnimatePresence>
                {rxForm.medications.map((med) => (
                  <motion.div
                    key={med.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 items-start"
                  >
                    <Input placeholder="Drug name" className="flex-[2]" value={med.drugName} onChange={(e) => updateMed(med.id, "drugName", e.target.value)} />
                    <Input placeholder="Dosage" className="flex-1" value={med.dosage} onChange={(e) => updateMed(med.id, "dosage", e.target.value)} />
                    <Input placeholder="Frequency" className="flex-1" value={med.frequency} onChange={(e) => updateMed(med.id, "frequency", e.target.value)} />
                    <Input placeholder="Duration" className="flex-1" value={med.duration} onChange={(e) => updateMed(med.id, "duration", e.target.value)} />
                    <button onClick={() => removeMedRow(med.id)} className="p-2 text-text-muted hover:text-danger mt-1 cursor-pointer"><X size={16} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button onClick={addMedRow} className="text-xs text-brand hover:underline mt-2 flex items-center gap-1 cursor-pointer">
              <Plus size={14} /> Add Medication
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
            <textarea
              value={rxForm.notes}
              onChange={(e) => setRxForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none h-20 focus:border-brand focus:shadow-[0_0_0_3px_rgba(11,179,122,0.15)]"
              placeholder="Additional notes..."
            />
          </div>

          {/* Follow-up Section */}
          <div className="bg-bg-base/50 p-4 rounded-xl border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="text-brand" size={18} />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Follow-up Required?</p>
                  <p className="text-[11px] text-text-muted">Automatically schedules an appointment</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={rxForm.followupRequired}
                  onChange={(e) => setRxForm(f => ({ ...f, followupRequired: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>

            {rxForm.followupRequired && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border-subtle"
              >
                <Input
                  label="Follow-up Date"
                  type="date"
                  value={rxForm.followupDate}
                  onChange={(e) => setRxForm(f => ({ ...f, followupDate: e.target.value }))}
                  required={rxForm.followupRequired}
                />
                <Input
                  label="Follow-up Time"
                  type="time"
                  value={rxForm.followupTime}
                  onChange={(e) => setRxForm(f => ({ ...f, followupTime: e.target.value }))}
                  required={rxForm.followupRequired}
                />
                <Input
                  label="Follow-up Notes"
                  placeholder="e.g., Check recovery progress"
                  value={rxForm.followupNotes}
                  onChange={(e) => setRxForm(f => ({ ...f, followupNotes: e.target.value }))}
                />
              </motion.div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => handleCreate("Draft")} isLoading={creating}>
              Save Draft
            </Button>
            <Button onClick={() => handleCreate("Finalized")} isLoading={creating}>
              Finalize Prescription
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Prescription Modal */}
      <Modal isOpen={!!viewRx} onClose={() => setViewRx(null)} title="Prescription Detail" size="lg">
        {viewRx && (
          <div className="space-y-5">
            {/* Document-style header */}
            <div className="border-b border-border-subtle pb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">MediCRM Clinic</h3>
                  <p className="text-xs text-text-muted">123 Health Street, Medical District</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Rx# <span className="font-mono text-text-secondary">{viewRx.id.slice(0, 8).toUpperCase()}</span></p>
                  <p className="text-xs text-text-muted">{formatDate(viewRx.date)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-bg-surface rounded-lg p-3">
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Patient</p>
                  <p className="text-sm text-text-primary font-medium">{viewRx.patientName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Doctor</p>
                  <p className="text-sm text-text-primary font-medium">{viewRx.doctorName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Diagnosis</p>
                  <p className="text-sm text-text-primary">{viewRx.diagnosis}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Status</p>
                  <Badge variant={viewRx.status === "Finalized" ? "success" : "warning"}>{viewRx.status}</Badge>
                </div>
              </div>
            </div>

            {/* Medications table */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-1.5"><Pill size={14} /> Medications</h4>
              {viewLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-brand" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {["#", "Drug Name", "Dosage", "Frequency", "Duration", "Notes"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewRx.medications.map((m, i) => (
                      <tr key={m.id} className="border-b border-border-subtle/50">
                        <td className="px-3 py-2 text-text-muted">{i + 1}</td>
                        <td className="px-3 py-2 text-text-primary font-medium">{m.drugName}</td>
                        <td className="px-3 py-2 text-text-secondary">{m.dosage}</td>
                        <td className="px-3 py-2 text-text-secondary">{m.frequency}</td>
                        <td className="px-3 py-2 text-text-secondary">{m.duration}</td>
                        <td className="px-3 py-2 text-text-muted">{m.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {viewRx.notes && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-1">Notes</h4>
                <p className="text-sm text-text-secondary">{viewRx.notes}</p>
              </div>
            )}

            {viewRx.followup_required && viewRx.followup_date && (
              <div className="bg-brand/5 p-4 rounded-xl border border-brand/20">
                <h4 className="text-xs font-semibold text-brand uppercase mb-2 flex items-center gap-1.5">
                  <Calendar size={14} /> Scheduled Follow-up
                </h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-primary">Date: {formatDate(viewRx.followup_date)}</p>
                    {viewRx.followup_time && (
                      <p className="text-xs text-text-secondary font-medium italic">Time: {viewRx.followup_time.slice(0, 5)}</p>
                    )}
                  </div>
                  <Badge variant="brand">Scheduled</Badge>
                </div>
                {viewRx.followup_notes && (
                  <p className="text-xs text-text-secondary mt-1.5 font-medium italic">“{viewRx.followup_notes}”</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => window.print()}><Printer size={16} /> Print</Button>
              <Button variant="ghost" onClick={() => setViewRx(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
