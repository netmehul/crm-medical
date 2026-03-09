"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Shield, Search, Loader2,
  Building2, Mail, CheckCircle, XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { orgApi, type TeamMember, type OrgBranch } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import Modal from "@/components/ui/modal";
import { useToast } from "@/lib/toast-context";

const roleLabel = (role: string) =>
  role === "org_admin" ? "Org Admin" : role.charAt(0).toUpperCase() + role.slice(1);

const roleVariant = (role: string): "brand" | "info" =>
  role === "org_admin" ? "brand" : "info";

export default function TeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const isOrgAdmin = user?.role === "org_admin";

  useEffect(() => {
    if (user && !isOrgAdmin) {
      router.push("/dashboard");
    }
  }, [isOrgAdmin, user, router]);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const [branches, setBranches] = useState<OrgBranch[]>([]);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invPassword, setInvPassword] = useState("");
  const [invRole, setInvRole] = useState("receptionist");
  const [invBranches, setInvBranches] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await orgApi.getTeam());
    } catch {
      addToast({ type: "error", title: "Failed to load team" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const openInvite = async () => {
    setInviteOpen(true);
    try {
      setBranches(await orgApi.getBranches());
    } catch { /* branches already empty */ }
  };

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!invName.trim() || !invEmail.trim() || !invPassword.trim()) {
      addToast({ type: "warning", title: "Name, email and password are required" });
      return;
    }
    setInviting(true);
    try {
      await orgApi.inviteUser({
        full_name: invName,
        email: invEmail,
        password: invPassword,
        role: invRole,
        clinic_ids: invBranches.length > 0 ? invBranches : undefined,
      });
      addToast({ type: "success", title: `${invName} invited successfully` });
      setInviteOpen(false);
      setInvName(""); setInvEmail(""); setInvPassword(""); setInvRole("receptionist"); setInvBranches([]);
      load();
    } catch (err: unknown) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Failed to invite user" });
    } finally {
      setInviting(false);
    }
  };

  const toggleBranch = (id: string) => {
    setInvBranches((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const admins = members.filter((m) => m.branches.some((b) => b.role === "org_admin")).length;
  const active = members.filter((m) => m.is_active).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Team</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your organization&apos;s team members
          </p>
        </div>
        <Button onClick={openInvite}>
          <UserPlus size={16} /> Invite Member
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Users size={20} className="text-brand" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{members.length}</p>
            <p className="text-[11px] text-text-muted">Total Members</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle size={20} className="text-success" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{active}</p>
            <p className="text-[11px] text-text-muted">Active</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Shield size={20} className="text-secondary" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{admins}</p>
            <p className="text-[11px] text-text-muted">Admins</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-surface border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
        />
      </div>

      {/* Team table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Users size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-sm text-text-muted">
            {search ? "No members match your search." : "No team members yet."}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Member", "Email", "Branches", "Role", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((member, i) => {
                const primaryRole = member.branches[0]?.role || "—";
                return (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => router.push(`/team/${member.id}`)}
                    className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.full_name} size="sm" />
                        <span className="text-sm font-medium text-text-primary">{member.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Mail size={13} className="text-text-muted shrink-0" />
                        <span className="truncate max-w-[180px]">{member.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {member.branches.length === 0 ? (
                          <span className="text-xs text-text-muted">No branches</span>
                        ) : (
                          member.branches.map((b) => (
                            <span
                              key={b.clinic_id}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-bg-elevated border border-border-subtle text-text-secondary"
                            >
                              <Building2 size={10} /> {b.clinic_name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={roleVariant(primaryRole)}>{roleLabel(primaryRole)}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
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
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member" size="md">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="e.g. Dr. Mehul Bagaria" value={invName} onChange={(e) => setInvName(e.target.value)} required />
          <Input label="Email" type="email" placeholder="email@clinic.com" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} required />
          <Input label="Temporary Password" type="password" placeholder="Set initial password" value={invPassword} onChange={(e) => setInvPassword(e.target.value)} required />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
            <select
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer outline-none focus:border-brand"
              value={invRole}
              onChange={(e) => setInvRole(e.target.value)}
            >
              <option value="org_admin">Org Admin</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
          {branches.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Assign to Branches</label>
              <div className="space-y-1.5">
                {branches.map((b) => (
                  <label
                    key={b.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${invBranches.includes(b.id) ? "border-brand bg-brand/5" : "border-border-subtle bg-bg-surface hover:bg-bg-hover"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={invBranches.includes(b.id)}
                      onChange={() => toggleBranch(b.id)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${invBranches.includes(b.id) ? "bg-brand border-brand" : "border-border-subtle"
                      }`}>
                      {invBranches.includes(b.id) && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-sm text-text-primary">{b.name}</p>
                      {b.city && <p className="text-[11px] text-text-muted">{b.city}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} isLoading={inviting}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
