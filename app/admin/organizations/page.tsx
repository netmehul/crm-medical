"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, Crown, Building2, Users, ShieldOff, ShieldCheck, Filter,
} from "lucide-react";
import { adminApi, type OrgListItem, type PaginatedResponse, type AdminPlanListItem } from "@/lib/admin-api";
import { useToast } from "@/lib/toast-context";

type PlanFilter = string;
type StatusFilter = "" | "active" | "suspended";

export default function OrganizationsPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<OrgListItem> | null>(null);
  const [plans, setPlans] = useState<AdminPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgsResult, plansData] = await Promise.all([
        adminApi.getOrganizations({
          search: search || undefined,
          plan: planFilter || undefined,
          status: statusFilter || undefined,
          page,
        }),
        adminApi.getPlans(),
      ]);
      setData(orgsResult);
      setPlans(plansData);
    } catch (err: any) {
      console.error("Organizations: Load error", err);
      addToast({ type: "error", title: "Load Failed", message: err.message });
    }
    setLoading(false);
  }, [search, planFilter, statusFilter, page, addToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [search, planFilter, statusFilter]);

  const handlePlanChange = async (orgId: string, planSlug: string) => {
    setActionLoading(orgId);
    try {
      await adminApi.updateOrgPlan(orgId, planSlug);
      addToast({ type: "success", title: "Plan Updated", message: "Organization plan has been updated." });
      load();
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
    setActionLoading(null);
  };

  const handleStatusChange = async (orgId: string, status: "active" | "suspended") => {
    setActionLoading(orgId);
    try {
      await adminApi.updateStatus(orgId, status);
      addToast({ type: "success", title: "Status Updated", message: `Organization is now ${status}.` });
      load();
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
    setActionLoading(null);
  };

  const orgs = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Organizations</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage all organizations registered on MediCRM
            {pagination && <span className="text-text-muted"> — {pagination.total} total</span>}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-text-muted">
            <Filter size={14} />
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
            className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer font-sans"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer font-sans"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-left">
                  <th className="px-6 py-3 font-medium">Organization</th>
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-center">Branches</th>
                  <th className="px-6 py-3 font-medium text-center">Users</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => router.push(`/admin/organizations/${org.slug || org.id}`)}
                    className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center font-display font-bold text-xs text-text-primary">
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary group-hover:text-brand transition-colors">{org.name}</p>
                          <p className="text-xs text-text-muted">{org.owner_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full
                        ${org.plan === "pro" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"}`}>
                        {org.plan === "pro" && <Crown size={11} />}
                        {plans.find((p) => p.slug === org.plan)?.name ?? org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full
                        ${org.plan_status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                        {org.plan_status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-text-primary font-mono">
                        <Building2 size={13} className="text-text-muted" /> {org.branch_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-text-primary font-mono">
                        <Users size={13} className="text-text-muted" /> {org.user_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted text-xs">
                      {new Date(org.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === org.id ? (
                          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <select
                              value={org.plan}
                              onChange={(e) => { e.stopPropagation(); handlePlanChange(org.id, e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs px-2 py-1.5 rounded bg-bg-surface border border-border-subtle text-text-primary hover:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30 cursor-pointer font-medium min-w-[90px]"
                            >
                              {plans.map((p) => (
                                <option key={p.id} value={p.slug}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            {org.plan_status === "active" ? (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(org.id, "suspended"); }}
                                className="flex items-center gap-1 text-xs text-danger hover:underline font-medium"
                                title="Suspend"
                              >
                                <ShieldOff size={13} /> Suspend
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(org.id, "active"); }}
                                className="flex items-center gap-1 text-xs text-success hover:underline font-medium"
                                title="Reactivate"
                              >
                                <ShieldCheck size={13} /> Activate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded border border-border-subtle hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded border border-border-subtle hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
