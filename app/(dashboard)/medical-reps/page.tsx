"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Phone, Mail, Building, Clock, Package, ArrowLeft, Calendar, Trash2, Loader2 } from "lucide-react";
import { medicalRepsApi } from "@/lib/api";
import { MedicalRep, MRVisit } from "@/lib/types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import EmptyState from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

type View = "list" | "profile";
type Tab = "overview" | "visits" | "products";

const purposeVariant: Record<string, "brand" | "info" | "warning" | "muted"> = {
  "Product Presentation": "brand",
  "Sample Drop": "info",
  "Follow-up": "warning",
  Other: "muted",
};

const purposeToApi: Record<string, string> = {
  "Product Presentation": "product_presentation",
  "Sample Drop": "sample_drop",
  "Follow-up": "follow_up",
  Other: "other",
};

export default function MedicalRepsPage() {
  const [reps, setReps] = useState<MedicalRep[]>([]);
  const [visits, setVisits] = useState<MRVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [view, setView] = useState<View>("list");
  const [selectedRep, setSelectedRep] = useState<MedicalRep | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [logVisitOpen, setLogVisitOpen] = useState(false);
  const [addRepOpen, setAddRepOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const [visitForm, setVisitForm] = useState({ date: "", time: "", purpose: "Product Presentation", products: [] as string[], notes: "" });
  const [repForm, setRepForm] = useState({ full_name: "", company: "", phone: "", email: "", territory: "", notes: "" });

  const fetchReps = useCallback(async () => {
    try {
      setLoading(true);
      const data = await medicalRepsApi.list({ limit: 100 });
      setReps(data.items);
    } catch {
      addToast({ type: "error", title: "Failed to load medical reps" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchReps();
  }, [fetchReps]);

  const fetchVisits = useCallback(async (repId: string) => {
    try {
      setVisitsLoading(true);
      const data = await medicalRepsApi.getVisits(repId);
      setVisits(data.items);
    } catch {
      addToast({ type: "error", title: "Failed to load visits" });
    } finally {
      setVisitsLoading(false);
    }
  }, [addToast]);

  const openProfile = (rep: MedicalRep) => {
    setSelectedRep(rep);
    setActiveTab("overview");
    setView("profile");
    fetchVisits(rep.id);
  };

  const handleAddRep = async () => {
    if (!repForm.full_name.trim()) return;
    try {
      setSubmitting(true);
      await medicalRepsApi.create({
        full_name: repForm.full_name,
        company: repForm.company || undefined,
        phone: repForm.phone || undefined,
        email: repForm.email || undefined,
        territory: repForm.territory || undefined,
        notes: repForm.notes || undefined,
      });
      addToast({ type: "success", title: "MR added successfully" });
      setRepForm({ full_name: "", company: "", phone: "", email: "", territory: "", notes: "" });
      setAddRepOpen(false);
      await fetchReps();
    } catch {
      addToast({ type: "error", title: "Failed to add medical rep" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogVisit = async () => {
    if (!selectedRep || !visitForm.date) return;
    try {
      setSubmitting(true);
      await medicalRepsApi.logVisit(selectedRep.id, {
        visit_date: visitForm.date,
        purpose: purposeToApi[visitForm.purpose] || "other",
        products_discussed: visitForm.products.join(", ") || undefined,
        notes: visitForm.notes || undefined,
      });
      addToast({ type: "success", title: "Visit logged successfully" });
      setVisitForm({ date: "", time: "", purpose: "Product Presentation", products: [], notes: "" });
      setLogVisitOpen(false);
      await fetchVisits(selectedRep.id);
    } catch {
      addToast({ type: "error", title: "Failed to log visit" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRep = async (id: string) => {
    try {
      setSubmitting(true);
      await medicalRepsApi.delete(id);
      addToast({ type: "success", title: "Medical rep deleted" });
      setDeleteConfirmId(null);
      if (view === "profile") setView("list");
      await fetchReps();
    } catch {
      addToast({ type: "error", title: "Failed to delete medical rep" });
    } finally {
      setSubmitting(false);
    }
  };

  const repVisits = visits;
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "visits", label: "Visit History" },
    { key: "products", label: "Products & Samples" },
  ];

  if (view === "profile" && selectedRep) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <button onClick={() => setView("list")} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <ArrowLeft size={16} /> Back to Medical Reps
        </button>

        <div className="glass-card p-6">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar name={selectedRep.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-semibold text-2xl text-text-primary">{selectedRep.name}</h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-text-muted"><Building size={13} /> {selectedRep.company}</span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted"><Phone size={13} /> {selectedRep.phone}</span>
                {selectedRep.email && <span className="flex items-center gap-1.5 text-xs text-text-muted"><Mail size={13} /> {selectedRep.email}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(selectedRep.id)}><Trash2 size={16} /></Button>
              <Button size="sm" onClick={() => setLogVisitOpen(true)}><Calendar size={16} /> Log Visit</Button>
            </div>
          </div>
        </div>

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
              {activeTab === tab.key && <motion.div layoutId="mr-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs text-text-muted uppercase mb-1">Company</p>
              <p className="text-sm text-text-primary font-medium">{selectedRep.company}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-text-muted uppercase mb-1">Total Visits</p>
              <p className="text-2xl font-mono text-brand">{visitsLoading ? "…" : repVisits.length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-text-muted uppercase mb-1">Products</p>
              <p className="text-2xl font-mono text-secondary">{selectedRep.products.length}</p>
            </div>
          </div>
        )}

        {activeTab === "visits" && (
          <div className="glass-card overflow-hidden">
            {visitsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-brand" />
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {["Date", "Time", "Purpose", "Products", "Notes", "Duration"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {repVisits.map((v) => (
                      <tr key={v.id} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors">
                        <td className="px-4 py-3 text-sm text-text-primary">{formatDate(v.date)}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text-secondary">{formatTime(v.time)}</td>
                        <td className="px-4 py-3"><Badge variant={purposeVariant[v.purpose]}>{v.purpose}</Badge></td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{v.products.join(", ") || "—"}</td>
                        <td className="px-4 py-3 text-sm text-text-muted max-w-[200px] truncate">{v.notes || "—"}</td>
                        <td className="px-4 py-3 text-sm text-text-muted">{v.duration || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {repVisits.length === 0 && <div className="py-8 text-center text-sm text-text-muted">No visits logged yet</div>}
              </>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedRep.products.map((p) => (
              <div key={p.id} className="glass-card p-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand"><Package size={16} /></span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.category}{p.notes ? ` • ${p.notes}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Log Visit Modal */}
        <Modal isOpen={logVisitOpen} onClose={() => setLogVisitOpen(false)} title="Log Visit" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date" type="date" value={visitForm.date} onChange={(e) => setVisitForm((f) => ({ ...f, date: e.target.value }))} />
              <Input label="Time" type="time" value={visitForm.time} onChange={(e) => setVisitForm((f) => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Purpose</label>
              <select
                value={visitForm.purpose}
                onChange={(e) => setVisitForm((f) => ({ ...f, purpose: e.target.value }))}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer"
              >
                <option>Product Presentation</option>
                <option>Sample Drop</option>
                <option>Follow-up</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Products Brought</label>
              <div className="flex gap-2 flex-wrap">
                {selectedRep.products.map((p) => {
                  const selected = visitForm.products.includes(p.name);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setVisitForm((f) => ({
                        ...f,
                        products: selected ? f.products.filter((x) => x !== p.name) : [...f.products, p.name],
                      }))}
                      className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                        selected ? "bg-brand/15 text-brand border border-border-brand" : "bg-bg-surface text-text-secondary border border-border-subtle"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
              <textarea
                value={visitForm.notes}
                onChange={(e) => setVisitForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none h-20 focus:border-brand focus:shadow-[0_0_0_3px_rgba(11,179,122,0.15)]"
                placeholder="Visit notes..."
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setLogVisitOpen(false)}>Cancel</Button>
              <Button onClick={handleLogVisit} disabled={submitting}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Logging...</> : "Log Visit"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Medical Rep" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Are you sure you want to delete this medical representative? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteConfirmId && handleDeleteRep(deleteConfirmId)} disabled={submitting}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Medical Representatives</h1>
          <p className="text-sm text-text-secondary mt-0.5">{reps.length} representatives</p>
        </div>
        <Button onClick={() => setAddRepOpen(true)} size="sm"><Plus size={16} /> Add MR</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      ) : reps.length === 0 ? (
        <EmptyState icon={<Building size={32} />} title="No medical reps" description="Add your first medical representative to track visits and products." actionLabel="Add MR" onAction={() => setAddRepOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reps.map((rep, i) => (
            <motion.div
              key={rep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:border-border-brand transition-all cursor-pointer group"
              onClick={() => openProfile(rep)}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={rep.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{rep.name}</p>
                  <p className="text-xs text-text-muted">{rep.company}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(rep.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                <span className="flex items-center gap-1"><Phone size={12} /> {rep.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {rep.lastVisit ? `Last visit: ${formatDate(rep.lastVisit)}` : "No visits yet"}
                </span>
                <Badge variant="brand" className="text-[10px]">{rep.products.length} products</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add MR Modal */}
      <Modal isOpen={addRepOpen} onClose={() => setAddRepOpen(false)} title="Add Medical Representative" size="md">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Representative name" value={repForm.full_name} onChange={(e) => setRepForm((f) => ({ ...f, full_name: e.target.value }))} />
          <Input label="Company" placeholder="Pharmaceutical company" value={repForm.company} onChange={(e) => setRepForm((f) => ({ ...f, company: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" placeholder="+91 99887 76655" value={repForm.phone} onChange={(e) => setRepForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" type="email" placeholder="email@company.com" value={repForm.email} onChange={(e) => setRepForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <Input label="Territory" placeholder="Region or territory" value={repForm.territory} onChange={(e) => setRepForm((f) => ({ ...f, territory: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
            <textarea
              value={repForm.notes}
              onChange={(e) => setRepForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none h-20 focus:border-brand focus:shadow-[0_0_0_3px_rgba(11,179,122,0.15)]"
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAddRepOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRep} disabled={submitting}>
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : "Add Representative"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Medical Rep" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Are you sure you want to delete this medical representative? This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteConfirmId && handleDeleteRep(deleteConfirmId)} disabled={submitting}>
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
