"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, MapPin, Users, Shield, Phone, Mail, CalendarDays,
  ArrowLeft, Pencil, Save, X, Loader2, CheckCircle, XCircle,
} from "lucide-react";
import { orgApi, type OrgBranchDetail } from "@/lib/api";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import { useToast } from "@/lib/toast-context";

export default function BranchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { setLabel, clearLabel } = useBreadcrumb();
  const branchId = params.id as string;

  const [branch, setBranch] = useState<OrgBranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orgApi.getBranch(branchId);
      setBranch(data);
      setEditName(data.name);
      setLabel(`/branches/${branchId}`, data.name);
      setEditCity(data.city || "");
      setEditPhone(data.phone || "");
      setEditEmail(data.email || "");
      setEditAddress(data.address || "");
    } catch {
      addToast({ type: "error", title: "Failed to load branch" });
    } finally {
      setLoading(false);
    }
  }, [branchId, addToast]);

  useEffect(() => {
    load();
    return () => clearLabel(`/branches/${branchId}`);
  }, [load, clearLabel, branchId]);

  const startEdit = () => {
    if (!branch) return;
    setEditName(branch.name);
    setEditCity(branch.city || "");
    setEditPhone(branch.phone || "");
    setEditEmail(branch.email || "");
    setEditAddress(branch.address || "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!editName.trim()) { addToast({ type: "warning", title: "Branch name is required" }); return; }
    setSaving(true);
    try {
      await orgApi.updateBranch(branchId, {
        name: editName,
        city: editCity || null,
        phone: editPhone || null,
        email: editEmail || null,
        address: editAddress || null,
      });
      addToast({ type: "success", title: "Branch updated successfully" });
      setEditing(false);
      load();
    } catch (err: unknown) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!branch) return;
    setSaving(true);
    try {
      await orgApi.updateBranch(branchId, { is_active: branch.is_active ? 0 : 1 });
      addToast({ type: "success", title: branch.is_active ? "Branch deactivated" : "Branch activated" });
      load();
    } catch (err: unknown) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Failed to update status" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-24">
        <Building2 size={48} className="mx-auto text-text-muted mb-4 opacity-30" />
        <p className="text-text-muted">Branch not found.</p>
        <Link href="/branches" className="text-brand text-sm hover:underline mt-2 inline-block">
          Back to Branches
        </Link>
      </div>
    );
  }

  const roleLabel = (role: string) =>
    role === "org_admin" ? "Org Admin" : role.charAt(0).toUpperCase() + role.slice(1);

  const roleVariant = (role: string): "brand" | "info" =>
    role === "org_admin" ? "brand" : "info";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-4xl">
      {/* Back link */}
      <button
        onClick={() => router.push("/branches")}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Branches
      </button>

      {/* Branch header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
              <Building2 size={28} className="text-brand" />
            </div>
            <div>
              {editing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="font-display font-bold text-xl"
                  placeholder="Branch name"
                />
              ) : (
                <h1 className="font-display font-bold text-xl text-text-primary">{branch.name}</h1>
              )}
              {!editing && branch.city && (
                <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-1">
                  <MapPin size={14} /> {branch.city}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={branch.is_active ? "success" : "muted"} className="text-xs">
              {branch.is_active ? "Active" : "Inactive"}
            </Badge>
            {editing ? (
              <>
                <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                  <X size={14} /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} isLoading={saving}>
                  <Save size={14} /> Save
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={startEdit}>
                <Pencil size={14} /> Edit
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">{branch.patient_count}</p>
            <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
              <Users size={12} /> Patients
            </p>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">{branch.staff_count}</p>
            <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
              <Shield size={12} /> Staff
            </p>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">{branch.appointment_count}</p>
            <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
              <CalendarDays size={12} /> Appointments
            </p>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">
              {branch.created_at ? new Date(branch.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </p>
            <p className="text-[11px] text-text-muted">Created</p>
          </div>
        </div>

        {/* Branch details (view/edit) */}
        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="City" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="City" />
            <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" />
            <Input label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" />
            <Input label="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Full address" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { icon: <MapPin size={14} />, label: "City", value: branch.city },
              { icon: <Phone size={14} />, label: "Phone", value: branch.phone },
              { icon: <Mail size={14} />, label: "Email", value: branch.email },
              { icon: <Building2 size={14} />, label: "Address", value: branch.address },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="text-text-muted shrink-0">{item.icon}</span>
                <span className="text-text-muted w-16 shrink-0">{item.label}</span>
                <span className="text-text-primary truncate">{item.value || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff members */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-base text-text-primary">Staff Members</h2>
            <p className="text-xs text-text-muted mt-0.5">{branch.staff.length} member{branch.staff.length !== 1 ? "s" : ""} assigned to this branch</p>
          </div>
        </div>

        {branch.staff.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No staff assigned to this branch yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Member", "Email", "Role", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branch.staff.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => router.push(`/team/${member.id}`)}
                  className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.full_name} size="sm" />
                      <span className="text-sm font-medium text-text-primary">{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-text-secondary">{member.email}</td>
                  <td className="px-6 py-3">
                    <Badge variant={roleVariant(member.role)}>{roleLabel(member.role)}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    {member.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle size={13} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <XCircle size={13} /> Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Admin actions */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-base text-text-primary mb-4">Admin Actions</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStatus}
            isLoading={saving}
            className={branch.is_active ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"}
          >
            {branch.is_active ? (
              <><XCircle size={14} /> Deactivate Branch</>
            ) : (
              <><CheckCircle size={14} /> Activate Branch</>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
