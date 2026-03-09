"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, Shield, Mail, Pencil, Save, X, Loader2,
  Building2, MapPin, CalendarDays, FileText, CheckCircle, XCircle,
  UserX, UserCheck,
} from "lucide-react";
import { orgApi, type TeamMemberDetail, type OrgBranch } from "@/lib/api";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import { useToast } from "@/lib/toast-context";

const roleLabel = (role: string) =>
  role === "org_admin" ? "Org Admin" : role.charAt(0).toUpperCase() + role.slice(1);

const roleVariant = (role: string): "brand" | "info" =>
  role === "org_admin" ? "brand" : "info";

export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { setLabel, clearLabel } = useBreadcrumb();
  const userId = params.id as string;

  const [member, setMember] = useState<TeamMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [allBranches, setAllBranches] = useState<OrgBranch[]>([]);
  const [editAssignments, setEditAssignments] = useState<{ clinic_id: string; role: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orgApi.getTeamMember(userId);
      setMember(data);
      setEditName(data.full_name);
      setLabel(`/team/${userId}`, data.full_name);
      setEditAssignments(
        data.branches.filter((b) => b.membership_active).map((b) => ({ clinic_id: b.clinic_id, role: b.role }))
      );
    } catch {
      addToast({ type: "error", title: "Failed to load member" });
    } finally {
      setLoading(false);
    }
  }, [userId, addToast]);

  useEffect(() => {
    load();
    return () => clearLabel(`/team/${userId}`);
  }, [load, clearLabel, userId]);

  const startEdit = async () => {
    if (!member) return;
    setEditName(member.full_name);
    setEditAssignments(
      member.branches.filter((b) => b.membership_active).map((b) => ({ clinic_id: b.clinic_id, role: b.role }))
    );
    try {
      setBranches(await orgApi.getBranches());
    } catch { /* ignore */ }
    setEditing(true);
  };

  const [branches, setBranches] = useState<OrgBranch[]>([]);

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!editName.trim()) { addToast({ type: "warning", title: "Name is required" }); return; }
    setSaving(true);
    try {
      await orgApi.updateUser(userId, {
        full_name: editName,
        clinic_assignments: editAssignments,
      });
      addToast({ type: "success", title: "Member updated successfully" });
      setEditing(false);
      load();
    } catch (err: unknown) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!member) return;
    setSaving(true);
    try {
      await orgApi.deactivateUser(userId);
      addToast({ type: "success", title: `${member.full_name} deactivated` });
      load();
    } catch (err: unknown) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Failed to deactivate" });
    } finally {
      setSaving(false);
    }
  };

  const toggleBranch = (branchId: string) => {
    setEditAssignments((prev) => {
      const existing = prev.find((a) => a.clinic_id === branchId);
      if (existing) return prev.filter((a) => a.clinic_id !== branchId);
      return [...prev, { clinic_id: branchId, role: "receptionist" }];
    });
  };

  const setAssignmentRole = (branchId: string, role: string) => {
    setEditAssignments((prev) =>
      prev.map((a) => (a.clinic_id === branchId ? { ...a, role } : a))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-24">
        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-30" />
        <p className="text-text-muted">Team member not found.</p>
        <Link href="/team" className="text-brand text-sm hover:underline mt-2 inline-block">
          Back to Team
        </Link>
      </div>
    );
  }

  const primaryRole = member.branches.find((b) => b.membership_active)?.role || "—";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-4xl">
      {/* Back link */}
      <button
        onClick={() => router.push("/team")}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Team
      </button>

      {/* Profile header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar name={member.full_name} size="lg" ringColor="var(--brand)" />
            <div>
              {editing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="font-display font-bold text-xl"
                  placeholder="Full name"
                />
              ) : (
                <h1 className="font-display font-bold text-xl text-text-primary">{member.full_name}</h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Mail size={14} /> {member.email}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={member.is_active ? "success" : "muted"}>
              {member.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={roleVariant(primaryRole)}>{roleLabel(primaryRole)}</Badge>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">
              {member.branches.filter((b) => b.membership_active).length}
            </p>
            <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
              <Building2 size={12} /> Branches
            </p>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">{member.stats.total_appointments}</p>
            <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
              <CalendarDays size={12} /> Appointments
            </p>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">{member.stats.total_prescriptions}</p>
            <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
              <FileText size={12} /> Prescriptions
            </p>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-lg text-text-primary">
              {new Date(member.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-[11px] text-text-muted">Joined</p>
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { icon: <Mail size={14} />, label: "Email", value: member.email },
            { icon: <Shield size={14} />, label: "Primary Role", value: roleLabel(primaryRole) },
            { icon: <CheckCircle size={14} />, label: "Status", value: member.is_active ? "Active" : "Inactive" },
            { icon: <CalendarDays size={14} />, label: "Last Updated", value: member.updated_at ? new Date(member.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span className="text-text-muted shrink-0">{item.icon}</span>
              <span className="text-text-muted w-24 shrink-0">{item.label}</span>
              <span className="text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Branch assignments */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="font-display font-semibold text-base text-text-primary">Branch Assignments</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {editing ? "Toggle branches and set roles for this member" : "Branches this member has access to"}
          </p>
        </div>

        {editing ? (
          <div className="p-4 space-y-2">
            {(allBranches.length > 0 ? allBranches : branches).map((b) => {
              const assigned = editAssignments.find((a) => a.clinic_id === b.id);
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    assigned ? "border-brand bg-brand/5" : "border-border-subtle bg-bg-surface"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleBranch(b.id)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      assigned ? "bg-brand border-brand" : "border-border-subtle"
                    }`}>
                      {assigned && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-sm text-text-primary">{b.name}</p>
                      {b.city && (
                        <p className="text-[11px] text-text-muted flex items-center gap-1">
                          <MapPin size={10} /> {b.city}
                        </p>
                      )}
                    </div>
                  </label>
                  {assigned && (
                    <select
                      className="bg-bg-surface border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary cursor-pointer outline-none"
                      value={assigned.role}
                      onChange={(e) => setAssignmentRole(b.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="org_admin">Org Admin</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        ) : member.branches.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            Not assigned to any branches.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Branch", "City", "Role", "Patients", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {member.branches.map((b) => (
                <tr
                  key={b.clinic_id}
                  onClick={() => router.push(`/branches/${b.clinic_id}`)}
                  className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-text-primary group-hover:text-brand transition-colors">
                      <Building2 size={14} className="text-text-muted" /> {b.clinic_name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-text-secondary">
                    {b.clinic_city || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={roleVariant(b.role)}>{roleLabel(b.role)}</Badge>
                  </td>
                  <td className="px-6 py-3 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Users size={13} className="text-text-muted" /> {b.clinic_patients}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {b.membership_active ? (
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
          {member.is_active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeactivate}
              isLoading={saving}
              className="text-danger hover:bg-danger/10"
            >
              <UserX size={14} /> Deactivate Member
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeactivate}
              isLoading={saving}
              className="text-success hover:bg-success/10"
            >
              <UserCheck size={14} /> Reactivate Member
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
