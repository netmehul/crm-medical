"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FileText, Printer, Eye, X, Pill } from "lucide-react";
import { mockPrescriptions, mockPatients } from "@/lib/mock-data";
import { Prescription, Medication } from "@/lib/types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const { addToast } = useToast();

  // Create form state
  const [rxForm, setRxForm] = useState({
    patientId: "", patientSearch: "", diagnosis: "", notes: "",
    medications: [{ id: "1", drugName: "", dosage: "", frequency: "", duration: "", notes: "" }] as Medication[],
  });

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

  const handleCreate = (status: "Draft" | "Finalized") => {
    const patient = mockPatients.find((p) => p.id === rxForm.patientId);
    if (!patient) return;

    const newRx: Prescription = {
      id: `RX${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorName: "Dr. Sharma",
      date: new Date().toISOString().split("T")[0],
      diagnosis: rxForm.diagnosis,
      medications: rxForm.medications.filter((m) => m.drugName),
      notes: rxForm.notes,
      status,
    };
    setPrescriptions((prev) => [newRx, ...prev]);
    addToast({ type: "success", title: `Prescription ${status === "Draft" ? "saved as draft" : "finalized"}` });
    setRxForm({ patientId: "", patientSearch: "", diagnosis: "", notes: "", medications: [{ id: "1", drugName: "", dosage: "", frequency: "", duration: "", notes: "" }] });
    setCreateOpen(false);
  };

  const [patientDropdown, setPatientDropdown] = useState(false);
  const filteredPatients = rxForm.patientSearch
    ? mockPatients.filter((p) => p.name.toLowerCase().includes(rxForm.patientSearch.toLowerCase())).slice(0, 5)
    : mockPatients.slice(0, 4);

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
      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={32} />} title="No prescriptions" description="No prescriptions found. Create one to get started." actionLabel="New Prescription" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rx, i) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 hover:border-border-brand transition-all"
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
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="ghost" onClick={() => setViewRx(rx)}><Eye size={14} /> View</Button>
              </div>
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
              onChange={(e) => { setRxForm((f) => ({ ...f, patientSearch: e.target.value })); setPatientDropdown(true); }}
              onFocus={() => setPatientDropdown(true)}
            />
            {!rxForm.patientId && (
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="text-xs text-text-muted">Recent:</span>
                {mockPatients.slice(0, 4).map((p) => (
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
            {patientDropdown && filteredPatients.length > 0 && !rxForm.patientId && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-subtle rounded-lg overflow-hidden shadow-xl max-h-40 overflow-y-auto">
                {filteredPatients.map((p) => (
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

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => handleCreate("Draft")}>Save Draft</Button>
            <Button onClick={() => handleCreate("Finalized")}>Finalize Prescription</Button>
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
                  <p className="text-xs text-text-muted">Rx# <span className="font-mono text-text-secondary">{viewRx.id}</span></p>
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
            </div>

            {viewRx.notes && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-1">Notes</h4>
                <p className="text-sm text-text-secondary">{viewRx.notes}</p>
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
