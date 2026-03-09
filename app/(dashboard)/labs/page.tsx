"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical, Plus, Search, MapPin, Phone, Mail, MessageCircle,
  Pencil, Trash2, Loader2, Building2, Eye, FileText,
} from "lucide-react";
import { labsApi } from "@/lib/api";
import type { ExternalLab } from "@/lib/types";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/lib/toast-context";

const LAB_TYPES = [
  { value: "all", label: "All" },
  { value: "lab", label: "Lab" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "imaging", label: "Imaging" },
  { value: "pathology", label: "Pathology" },
  { value: "other", label: "Other" },
];

const typeColors: Record<string, "brand" | "info" | "warning" | "success" | "muted"> = {
  lab: "brand",
  diagnostic: "info",
  imaging: "warning",
  pathology: "success",
  other: "muted",
};

export default function ExternalLabsPage() {
  const { addToast } = useToast();
  const [labs, setLabs] = useState<ExternalLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<ExternalLab | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", type: "lab", contact_person: "", phone: "",
    whatsapp_number: "", email: "", address: "", city: "", pincode: "", notes: "",
  });

  const fetchLabs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labsApi.list({ search, type: typeFilter !== "all" ? typeFilter : undefined, limit: 100 });
      setLabs(res.items);
    } catch {
      addToast({ type: "error", title: "Failed to load labs" });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, addToast]);

  useEffect(() => { fetchLabs(); }, [fetchLabs]);

  const openAdd = () => {
    setEditingLab(null);
    setForm({ name: "", type: "lab", contact_person: "", phone: "", whatsapp_number: "", email: "", address: "", city: "", pincode: "", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (lab: ExternalLab) => {
    setEditingLab(lab);
    setForm({
      name: lab.name, type: lab.type, contact_person: lab.contactPerson || "",
      phone: lab.phone || "", whatsapp_number: lab.whatsappNumber || "",
      email: lab.email || "", address: lab.address || "", city: lab.city || "",
      pincode: lab.pincode || "", notes: lab.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast({ type: "warning", title: "Lab name is required" }); return; }
    setSaving(true);
    try {
      if (editingLab) {
        await labsApi.update(editingLab.id, form);
        addToast({ type: "success", title: "Lab updated" });
      } else {
        await labsApi.create(form);
        addToast({ type: "success", title: "Lab added" });
      }
      setModalOpen(false);
      fetchLabs();
    } catch {
      addToast({ type: "error", title: editingLab ? "Failed to update lab" : "Failed to add lab" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await labsApi.delete(deleteId);
      addToast({ type: "success", title: "Lab removed" });
      setDeleteId(null);
      fetchLabs();
    } catch {
      addToast({ type: "error", title: "Failed to delete lab" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">External Labs & Diagnostic Centres</h1>
          <p className="text-sm text-text-muted font-sans mt-1">Manage your directory of partner labs and diagnostic facilities</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Add Lab</Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search labs by name, city, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-sans"
          />
        </div>
        <div className="flex gap-1.5">
          {LAB_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${typeFilter === t.value
                ? "bg-brand/10 text-brand border border-brand/30"
                : "bg-bg-surface text-text-muted border border-border-base hover:text-text-secondary"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Labs Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-brand" />
        </div>
      ) : labs.length === 0 ? (
        <EmptyState
          icon={<FlaskConical size={40} />}
          title="No labs found"
          description="Add your first external lab or diagnostic centre to start managing referrals."
          actionLabel="Add Lab"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((lab, i) => (
            <motion.div
              key={lab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-5 group hover:border-brand/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <FlaskConical size={18} className="text-brand" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-sm leading-tight">{lab.name}</h3>
                    <Badge variant={typeColors[lab.type] || "muted"} className="mt-0.5">
                      {lab.type.charAt(0).toUpperCase() + lab.type.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-text-muted mb-4">
                {lab.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} /> <span>{lab.address ? `${lab.address}, ` : ""}{lab.city}{lab.pincode ? ` - ${lab.pincode}` : ""}</span>
                  </div>
                )}
                {lab.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} /> <span>{lab.phone}</span>
                  </div>
                )}
                {lab.whatsappNumber && (
                  <div className="flex items-center gap-2">
                    <MessageCircle size={12} /> <span>{lab.whatsappNumber} (WhatsApp)</span>
                  </div>
                )}
                {lab.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} /> <span>{lab.email}</span>
                  </div>
                )}
                {lab.contactPerson && (
                  <div className="flex items-center gap-2">
                    <Building2 size={12} /> <span>Contact: {lab.contactPerson}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <FileText size={12} />
                  <span>{lab.referralCount} referral{lab.referralCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(lab)}
                    className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-brand cursor-pointer"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(lab.id)}
                    className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-red-500 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingLab ? "Edit Lab" : "Add External Lab"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Lab Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Metropolis Lab - Ahmedabad" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              {LAB_TYPES.filter(t => t.value !== "all").map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <Input label="Contact Person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Key person name" />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Primary phone number" />
          <Input label="WhatsApp Number" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="If different from phone" />
          <div className="sm:col-span-2">
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="lab@example.com" />
          </div>
          <div className="sm:col-span-2">
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          </div>
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
          <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" />
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Internal Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none font-sans"
              placeholder="Internal notes about this lab..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} isLoading={saving}>{editingLab ? "Update Lab" : "Add Lab"}</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Lab" size="sm">
        <p className="text-sm text-text-secondary mb-6">Are you sure you want to remove this lab from your directory? Existing referrals will not be affected.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
