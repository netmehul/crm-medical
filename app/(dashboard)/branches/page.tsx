"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, MapPin, Users, Shield, Phone, Mail, Plus,
  Loader2, Search,
} from "lucide-react";
import { orgApi, type OrgBranch } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import { useToast } from "@/lib/toast-context";

export default function BranchesPage() {
  const { addToast } = useToast();
  const [branches, setBranches] = useState<OrgBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBranches(await orgApi.getBranches());
    } catch {
      addToast({ type: "error", title: "Failed to load branches" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.city || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim()) { addToast({ type: "warning", title: "Branch name is required" }); return; }
    setCreating(true);
    try {
      await orgApi.createBranch({
        name, city: city || undefined, phone: phone || undefined,
        email: email || undefined, address: address || undefined,
      });
      addToast({ type: "success", title: `"${name}" created successfully` });
      setAddOpen(false);
      setName(""); setCity(""); setPhone(""); setEmail(""); setAddress("");
      load();
    } catch (err: unknown) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Failed to create branch" });
    } finally {
      setCreating(false);
    }
  };

  const totalPatients = branches.reduce((s, b) => s + b.patient_count, 0);
  const totalStaff = branches.reduce((s, b) => s + b.staff_count, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Branches</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your organization&apos;s clinic locations
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add Branch
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Building2 size={20} className="text-brand" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{branches.length}</p>
            <p className="text-[11px] text-text-muted">Total Branches</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Users size={20} className="text-secondary" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{totalPatients}</p>
            <p className="text-[11px] text-text-muted">Total Patients</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Shield size={20} className="text-success" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{totalStaff}</p>
            <p className="text-[11px] text-text-muted">Total Staff</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search branches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-surface border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
        />
      </div>

      {/* Branch cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Building2 size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-sm text-text-muted">
            {search ? "No branches match your search." : "No branches yet. Create your first one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((branch, i) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/branches/${branch.id}`}
                className="glass-card p-5 block hover:border-brand/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Building2 size={22} className="text-brand" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-text-primary group-hover:text-brand transition-colors">
                        {branch.name}
                      </h3>
                      {branch.city && (
                        <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                          <MapPin size={12} /> {branch.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={branch.is_active ? "success" : "muted"}>
                    {branch.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Users size={13} className="text-text-muted" />
                    <span>{branch.patient_count} patients</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Shield size={13} className="text-text-muted" />
                    <span>{branch.staff_count} staff</span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Phone size={13} className="text-text-muted" />
                      <span className="truncate">{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Mail size={13} className="text-text-muted" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                </div>

              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Branch Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Branch" size="md">
        <div className="space-y-4">
          <Input label="Branch Name" placeholder="e.g. MediPoint — Delhi" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="City" placeholder="e.g. Delhi" value={city} onChange={(e) => setCity(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" placeholder="+91-..." value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Email" type="email" placeholder="branch@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Input label="Address" placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={creating}>Create Branch</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
