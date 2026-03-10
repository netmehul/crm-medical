"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Truck, Plus, Search, Building2, Phone, Mail, MoreHorizontal, History, CreditCard, ChevronRight, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { suppliersApi } from "@/lib/api";
import { Supplier } from "@/lib/types";
import { formatUSD } from "@/lib/currency";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Badge from "@/components/ui/badge";
import { useToast } from "@/lib/toast-context";
import Link from "next/link";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await suppliersApi.list();
      setSuppliers(data);
    } catch (err) {
      addToast({ type: "error", title: "Failed to load suppliers", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.supplier-dropdown')) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSupplier = async () => {
    if (!formData.name) return;
    setSubmitting(true);
    try {
      await suppliersApi.create(formData);
      addToast({ type: "success", title: "Supplier added successfully" });
      setAddModalOpen(false);
      setFormData({ name: "", contact_person: "", phone: "", email: "", address: "", notes: "" });
      fetchSuppliers();
    } catch (err) {
      addToast({ type: "error", title: "Failed to add supplier", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditFormData({
      name: supplier.name || "",
      contact_person: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSupplier = async () => {
    if (!editingSupplier || !editFormData.name) return;
    setSubmitting(true);
    try {
      await suppliersApi.update(editingSupplier.id, editFormData);
      addToast({ type: "success", title: "Supplier updated successfully" });
      setEditModalOpen(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      addToast({ type: "error", title: "Failed to update supplier", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!window.confirm(`Are you sure you want to delete ${supplier.name}?`)) return;
    try {
      await suppliersApi.delete(supplier.id);
      addToast({ type: "success", title: "Supplier deleted", message: `${supplier.name} removed.` });
      fetchSuppliers();
    } catch (err) {
      addToast({ type: "error", title: "Failed to delete supplier", message: (err as Error).message });
    }
  };

  const totals = {
    billed: suppliers.reduce((sum, s) => sum + (s.totalBilledCents || 0), 0),
    pending: suppliers.reduce((sum, s) => sum + (s.pendingBalanceCents || 0), 0),
    overdue: suppliers.reduce((sum, s) => sum + (s.overdueBalanceCents || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Suppliers</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage stock suppliers and payments</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}><Plus size={18} /> New Supplier</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: formatUSD(totals.billed), color: "text-text-primary", icon: <Building2 className="text-brand" /> },
          { label: "Pending Balance", value: formatUSD(totals.pending), color: "text-warning", icon: <CreditCard className="text-warning" /> },
          { label: "Overdue Payments", value: formatUSD(totals.overdue), color: "text-danger", icon: <AlertCircle className="text-danger" /> },
        ].map((kpi, idx) => (
          <div key={idx} className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-bg-surface border border-border-subtle flex items-center justify-center">
              {kpi.icon}
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-mono font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 max-w-sm">
          <Input 
            placeholder="Search suppliers..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((supplier) => (
          <motion.div 
            key={supplier.id}
            layout
            className="glass-card group hover:border-brand/40 transition-all cursor-default overflow-hidden flex flex-col"
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                  <Truck size={20} />
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={supplier.isActive ? "success" : "muted"}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="relative supplier-dropdown">
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setActiveDropdown(activeDropdown === supplier.id ? null : supplier.id); 
                      }} 
                      className="p-1.5 rounded-md hover:bg-bg-elevated text-text-muted hover:text-brand transition-all duration-200 active:scale-90"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    
                    {activeDropdown === supplier.id && (
                      <div className="absolute right-0 top-10 w-36 bg-bg-surface border border-border-subtle rounded-xl shadow-lg z-10 py-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveDropdown(null);
                            openEditModal(supplier);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-brand transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveDropdown(null);
                            handleDeleteSupplier(supplier);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-lg text-text-primary group-hover:text-brand transition-colors mb-1 truncate">
                {supplier.name}
              </h3>
              <p className="text-sm text-text-secondary flex items-center gap-1.5 mb-4">
                <Building2 size={14} className="text-text-muted" />
                {supplier.contactPerson || "No contact person"}
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone size={13} className="text-text-muted" /> {supplier.phone || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Mail size={13} className="text-text-muted" /> {supplier.email || "N/A"}
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-0.5">Pending</p>
                  <p className="text-sm font-mono font-bold text-warning">{formatUSD(supplier.pendingBalanceCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-0.5">Overdue</p>
                  <p className="text-sm font-mono font-bold text-danger">{formatUSD(supplier.overdueBalanceCents)}</p>
                </div>
              </div>
            </div>

            <Link 
              href={`/suppliers/${supplier.id}`}
              className="p-3 bg-bg-surface border-t border-border-subtle flex items-center justify-center gap-2 text-xs font-medium text-text-secondary hover:text-brand hover:bg-brand/5 transition-all"
            >
              View Full Profile <ChevronRight size={14} />
            </Link>
          </motion.div>
        ))}
        
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card border-dashed">
            <Truck size={40} className="mx-auto text-text-muted mb-4 opacity-20" />
            <p className="text-text-secondary">No suppliers found</p>
            <Button variant="ghost" className="mt-2" onClick={() => setSearch("")}>Clear Search</Button>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Supplier" size="md">
        <div className="space-y-4">
          <Input 
            label="Company Name" 
            required 
            placeholder="e.g. PharmaCorp Ltd" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input 
            label="Contact Person" 
            placeholder="e.g. John Doe" 
            value={formData.contact_person}
            onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Phone" 
              placeholder="Contact number" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <Input 
              label="Email" 
              placeholder="Email address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <Input 
            label="Address" 
            placeholder="Full office address" 
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Internal Notes</label>
            <textarea 
              className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary resize-none h-24 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
              placeholder="Payment terms, delivery preferences, etc."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddSupplier} disabled={!formData.name || submitting} className="flex-1">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : "Save Supplier"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Supplier" size="md">
        <div className="space-y-4">
          <Input 
            label="Company Name" 
            required 
            placeholder="e.g. PharmaCorp Ltd" 
            value={editFormData.name}
            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
          />
          <Input 
            label="Contact Person" 
            placeholder="e.g. John Doe" 
            value={editFormData.contact_person}
            onChange={(e) => setEditFormData({...editFormData, contact_person: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Phone" 
              placeholder="Contact number" 
              value={editFormData.phone}
              onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
            />
            <Input 
              label="Email" 
              placeholder="Email address" 
              value={editFormData.email}
              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
            />
          </div>
          <Input 
            label="Address" 
            placeholder="Full office address" 
            value={editFormData.address}
            onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
          />
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Internal Notes</label>
            <textarea 
              className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary resize-none h-24 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
              placeholder="Payment terms, delivery preferences, etc."
              value={editFormData.notes}
              onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleEditSupplier} disabled={!editFormData.name || submitting} className="flex-1">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}
