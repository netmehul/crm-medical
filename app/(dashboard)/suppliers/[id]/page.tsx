"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Truck, Phone, Mail, MapPin, History, CreditCard, ChevronLeft, Loader2, Plus, Calendar, User, ExternalLink, AlertCircle } from "lucide-react";
import { suppliersApi } from "@/lib/api";
import { Supplier, SupplierVisit } from "@/lib/types";
import { formatUSD } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import { useToast } from "@/lib/toast-context";

export default function SupplierDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { addToast } = useToast();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [visits, setVisits] = useState<SupplierVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [visitData, setVisitData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    rep_name: "",
    rep_phone: "",
    purpose: "delivery" as any,
    notes: ""
  });

  const fetchData = useCallback(async () => {
    try {
      const [sData, vData] = await Promise.all([
        suppliersApi.get(id),
        suppliersApi.getVisits(id)
      ]);
      setSupplier(sData);
      setVisits(vData);
    } catch (err) {
      addToast({ type: "error", title: "Failed to load data", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogVisit = async () => {
    setSubmitting(true);
    try {
      await suppliersApi.logVisit(id, visitData);
      addToast({ type: "success", title: "Visit logged successfully" });
      setVisitModalOpen(false);
      setVisitData({
        visit_date: new Date().toISOString().split('T')[0],
        rep_name: "",
        rep_phone: "",
        purpose: "delivery",
        notes: ""
      });
      fetchData();
    } catch (err) {
      addToast({ type: "error", title: "Failed to log visit", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-lg bg-bg-surface border border-border-subtle hover:bg-bg-hover transition-colors"
        >
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">{supplier.name}</h1>
          <p className="text-sm text-text-secondary">Supplier ID: {supplier.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-text-primary">Profile</h2>
              <Badge variant={supplier.isActive ? "success" : "muted"}>
                {supplier.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <User size={18} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase font-bold">Contact Person</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.contactPerson || "Not specified"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone size={18} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase font-bold">Phone</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.phone || "Not specified"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail size={18} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase font-bold">Email</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.email || "Not specified"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin size={18} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted uppercase font-bold">Address</p>
                  <p className="text-sm font-medium text-text-primary leading-relaxed">{supplier.address || "Not specified"}</p>
                </div>
              </div>
            </div>

            {supplier.notes && (
              <div className="mt-8 pt-6 border-t border-border-subtle">
                <p className="text-xs text-text-muted uppercase font-bold mb-2">Notes</p>
                <div className="p-3 rounded-lg bg-bg-surface text-xs text-text-secondary italic border border-border-subtle/50">
                  "{supplier.notes}"
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-6 bg-brand/5 border-brand/20">
             <h2 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
               <CreditCard size={20} className="text-brand" /> Financial Summary
             </h2>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-white/50 border border-white/50 shadow-sm">
                 <span className="text-text-secondary">Pending Balance</span>
                 <span className="font-mono font-bold text-warning">{formatUSD(supplier.pendingBalanceCents)}</span>
               </div>
               <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-danger/5 border border-danger/10 shadow-sm">
                 <span className="text-text-secondary">Overdue Amount</span>
                 <span className="font-mono font-bold text-danger">{formatUSD(supplier.overdueBalanceCents)}</span>
               </div>
               <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-success/5 border border-success/10 shadow-sm">
                 <span className="text-text-secondary">Total Paid</span>
                 <span className="font-mono font-bold text-success">{formatUSD(supplier.totalPaidCents)}</span>
               </div>
               <div className="pt-2">
                 <p className="text-[10px] text-text-muted uppercase font-bold text-center">Total Lifetime Value: {formatUSD(supplier.totalBilledCents)}</p>
               </div>
             </div>
          </div>
        </div>

        {/* Visits History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <History size={20} className="text-brand" /> Visit History
              </h2>
              <Button size="sm" onClick={() => setVisitModalOpen(true)}><Plus size={16} /> Log Visit</Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {visits.length > 0 ? (
                <div className="divide-y divide-border-subtle/50">
                   {visits.map((visit, idx) => (
                     <div key={visit.id} className="p-5 hover:bg-bg-hover transition-colors flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0">
                          <Truck size={18} className="text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-text-primary">{visit.repName || "Rep Name"}</span>
                                <Badge variant="muted" className="scale-75 origin-left h-5">
                                  {visit.purpose.replace('_', ' ')}
                                </Badge>
                             </div>
                             <span className="text-xs text-text-muted font-mono">{formatDate(visit.visitDate)}</span>
                          </div>
                          <p className="text-xs text-text-secondary truncate pr-4">
                             {visit.notes || "No notes logged for this visit."}
                          </p>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="py-20 text-center text-text-muted opacity-50">
                  <Calendar size={40} className="mx-auto mb-3" />
                  <p>No visit history yet.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-bg-surface border-t border-border-subtle">
               <p className="text-[10px] text-text-muted text-center uppercase font-medium tracking-widest">Showing all recorded visits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Visit Modal */}
      <Modal isOpen={visitModalOpen} onClose={() => setVisitModalOpen(false)} title="Log Supplier Visit" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Visit Date" 
              type="date" 
              value={visitData.visit_date}
              onChange={(e) => setVisitData({...visitData, visit_date: e.target.value})}
            />
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Purpose</label>
              <select 
                className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary cursor-pointer focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all shadow-sm"
                value={visitData.purpose}
                onChange={(e) => setVisitData({...visitData, purpose: e.target.value as any})}
              >
                <option value="delivery">Stock Delivery</option>
                <option value="sample_drop">Sample Drop</option>
                <option value="follow_up">Payment Follow-up</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <Input 
            label="Representative Name" 
            placeholder="e.g. Mark Robinson" 
            value={visitData.rep_name}
            onChange={(e) => setVisitData({...visitData, rep_name: e.target.value})}
          />
          <Input 
            label="Representative Phone" 
            placeholder="Optional" 
            value={visitData.rep_phone}
            onChange={(e) => setVisitData({...visitData, rep_phone: e.target.value})}
          />
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Visit Notes</label>
            <textarea 
              className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary resize-none h-24 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
              placeholder="What was discussed or delivered?"
              value={visitData.notes}
              onChange={(e) => setVisitData({...visitData, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setVisitModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleLogVisit} disabled={submitting} className="flex-1">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : "Log Visit"}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
