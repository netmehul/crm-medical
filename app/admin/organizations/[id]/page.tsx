"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, Users, Crown, MapPin, Mail, Phone, Calendar,
  ShieldOff, ShieldCheck, UserCheck,
  DollarSign, Receipt, Activity,
} from "lucide-react";
import { adminApi, type OrgDetail, type AdminPlanListItem } from "@/lib/admin-api";
import { useBreadcrumb } from "@/lib/breadcrumb-context";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={14} className="text-text-muted mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-text-muted uppercase tracking-wide">{label}</p>
        <p className="text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { setLabel, clearLabel } = useBreadcrumb();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [plans, setPlans] = useState<AdminPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [orgData, plansData] = await Promise.all([
        adminApi.getOrganization(orgId),
        adminApi.getPlans(),
      ]);
      setOrg(orgData);
      setPlans(plansData);
      setLabel(`/admin/organizations/${orgId}`, orgData.name);
    } catch { /* ignore */ }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    load();
    return () => clearLabel(`/admin/organizations/${orgId}`);
  }, [load, clearLabel, orgId]);

  const handlePlanChange = async (planSlug: string) => {
    setActionLoading(true);
    try {
      await adminApi.updateOrgPlan(orgId, planSlug);
      load();
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleStatusChange = async (status: "active" | "suspended") => {
    setActionLoading(true);
    try {
      await adminApi.updateStatus(orgId, status);
      load();
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <p className="text-text-muted">Organization not found.</p>
        <Link href="/admin/organizations" className="text-brand text-sm hover:underline mt-2 inline-block">
          Back to organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push("/admin/organizations")}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to organizations
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center font-display font-bold text-xl text-text-primary">
              {org.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-text-primary">{org.name}</h1>
              <p className="text-sm text-text-muted">{org.owner_email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full
              ${org.plan === "pro" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"}`}>
              {org.plan === "pro" && <Crown size={12} />}
              {plans.find((p) => p.slug === org.plan)?.name ?? org.plan}
            </span>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full
              ${org.plan_status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
              {org.plan_status === "active" ? "Active" : "Suspended"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Branches", value: org.clinics.length, icon: Building2, color: "text-brand" },
          { label: "Team Members", value: org.users.length, icon: Users, color: "text-secondary" },
          { label: "Patients", value: org.totalPatients, icon: Activity, color: "text-info" },
          { label: "Payments", value: org.payments.length, icon: DollarSign, color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <stat.icon size={18} className={stat.color} />
            <div>
              <p className="font-mono font-bold text-xl text-text-primary">{stat.value}</p>
              <p className="text-[11px] text-text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <h2 className="font-display font-semibold text-sm text-text-primary mb-4 uppercase tracking-wide">Admin Actions</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {actionLoading ? (
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted font-medium">Plan:</label>
                <select
                  value={org.plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg bg-bg-surface border border-border-subtle text-text-primary hover:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer font-medium min-w-[140px]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {org.plan_status === "active" ? (
                <button
                  onClick={() => handleStatusChange("suspended")}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 font-medium transition-colors"
                >
                  <ShieldOff size={14} /> Suspend Organization
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 font-medium transition-colors"
                >
                  <ShieldCheck size={14} /> Reactivate Organization
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Org Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <h2 className="font-display font-semibold text-sm text-text-primary mb-3 uppercase tracking-wide">Organization Info</h2>
          <div className="space-y-1">
            <InfoRow icon={Mail} label="Owner Email" value={org.owner_email} />
            <InfoRow icon={Phone} label="Phone" value={org.phone} />
            <InfoRow icon={MapPin} label="Address" value={org.address} />
            <InfoRow icon={Calendar} label="Joined" value={new Date(org.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
            <InfoRow icon={Crown} label="Plan Activated" value={org.plan_activated_at ? new Date(org.plan_activated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"} />
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5"
        >
          <h2 className="font-display font-semibold text-sm text-text-primary mb-3 uppercase tracking-wide">Payment History</h2>
          {org.payments.length === 0 ? (
            <p className="text-sm text-text-muted py-4">No payments recorded.</p>
          ) : (
            <div className="space-y-2">
              {org.payments.map((pmt) => (
                <div key={pmt.id} className="flex items-center justify-between py-2 border-b border-border-subtle/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <Receipt size={14} className="text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-text-primary font-medium">{pmt.plan.toUpperCase()} Plan</p>
                      <p className="text-xs text-text-muted">{pmt.mock_receipt || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-text-primary">${pmt.amount_usd}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(pmt.activated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Branches */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border-subtle">
          <h2 className="font-display font-semibold text-sm text-text-primary uppercase tracking-wide">
            Branches ({org.clinics.length})
          </h2>
        </div>
        <div className="divide-y divide-border-subtle/50">
          {org.clinics.map((clinic) => (
            <div key={clinic.id} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Building2 size={16} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{clinic.name}</p>
                  <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                    {clinic.city && <span className="flex items-center gap-1"><MapPin size={11} /> {clinic.city}</span>}
                    {clinic.phone && <span className="flex items-center gap-1"><Phone size={11} /> {clinic.phone}</span>}
                  </div>
                </div>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                ${clinic.is_active ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                {clinic.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border-subtle">
          <h2 className="font-display font-semibold text-sm text-text-primary uppercase tracking-wide">
            Team Members ({org.users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted text-left">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Branch Access</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {org.users.map((u) => (
                <tr key={u.id} className="border-b border-border-subtle/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs font-bold">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{u.full_name}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.branches.map((b) => (
                        <span
                          key={b.clinic_id}
                          className="inline-flex items-center gap-1 text-[11px] bg-bg-elevated border border-border-subtle px-2 py-0.5 rounded-full"
                        >
                          <UserCheck size={10} className={b.role === "org_admin" ? "text-brand" : "text-text-muted"} />
                          <span className="text-text-primary truncate max-w-[120px]">{b.clinic_name}</span>
                          <span className="text-text-muted">({b.role === "org_admin" ? "Admin" : "Staff"})</span>
                        </span>
                      ))}
                      {u.branches.length === 0 && (
                        <span className="text-xs text-text-muted">No branch access</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                      ${u.is_active ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-muted">
                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
