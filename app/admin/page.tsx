"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, Users, DollarSign, Activity, Crown, Package,
  TrendingUp, ArrowRight, MapPin, AlertTriangle,
} from "lucide-react";
import { adminApi, type DashboardStats, type OrgListItem } from "@/lib/admin-api";

function StatCard({
  label, value, sub, icon: Icon, color, delay = 0,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        {sub && <span className="text-[11px] text-text-muted font-mono">{sub}</span>}
      </div>
      <div>
        <p className="font-mono font-bold text-3xl text-text-primary">{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-bg-hover ${className}`} />;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrgs, setRecentOrgs] = useState<OrgListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dashData, orgData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getOrganizations({ page: 1 }),
      ]);
      setStats(dashData);
      setRecentOrgs((orgData.items || []).slice(0, 5));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const mrrDisplay = stats?.mrr != null ? `$${Number(stats.mrr).toFixed(2)}` : "$0";
  const kpis = [
    { label: "Total Organizations", value: stats?.totalOrgs || 0, icon: Building2, color: "bg-brand/10 text-brand", sub: `${stats?.totalClinics || 0} branches` },
    { label: "Monthly Revenue (MRR)", value: mrrDisplay, icon: DollarSign, color: "bg-success/10 text-success", sub: `${stats?.proOrgs || 0} paying orgs` },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "bg-secondary/10 text-secondary", sub: "across all orgs" },
    { label: "Total Patients", value: stats?.totalPatients || 0, icon: Activity, color: "bg-info/10 text-info", sub: "across all clinics" },
  ];

  const conversionRate = stats && stats.totalOrgs > 0
    ? Math.round(((stats.proOrgs || 0) / stats.totalOrgs) * 100)
    : 0;

  const planCounts = stats?.planCounts ? Object.entries(stats.planCounts) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Platform Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Real-time overview of your MediCRM platform
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.label} {...kpi} delay={i * 0.05} />
        ))}
      </div>

      {/* Plan breakdown & secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {planCounts.length > 0 ? (
          planCounts.map(([slug, data], i) => (
            <motion.div
              key={slug}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                data.monthlyPriceCents > 0 ? "bg-warning/10 text-warning" : "bg-info/10 text-info"
              }`}>
                {data.monthlyPriceCents > 0 ? <Crown size={18} /> : <Package size={18} />}
              </div>
              <div>
                <p className="font-mono font-bold text-xl text-text-primary">{data.count}</p>
                <p className="text-[11px] text-text-muted">{data.name}</p>
                {data.monthlyPriceCents > 0 && (
                  <p className="text-[10px] text-success font-mono mt-0.5">
                    ${data.contribution.toFixed(2)}/mo
                  </p>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <Crown size={18} className="text-warning" />
              </div>
              <div>
                <p className="font-mono font-bold text-xl text-text-primary">{stats?.proOrgs || 0}</p>
                <p className="text-[11px] text-text-muted">Paying Plans</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
                <Package size={18} className="text-info" />
              </div>
              <div>
                <p className="font-mono font-bold text-xl text-text-primary">{stats?.freeOrgs || 0}</p>
                <p className="text-[11px] text-text-muted">Free Plans</p>
              </div>
            </motion.div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-[#ef4444]" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{stats?.suspendedOrgs || 0}</p>
            <p className="text-[11px] text-text-muted">Suspended</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-4 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-success" />
          </div>
          <div>
            <p className="font-mono font-bold text-xl text-text-primary">{conversionRate}%</p>
            <p className="text-[11px] text-text-muted">Conversion Rate</p>
          </div>
        </motion.div>
      </div>

      {/* Recent Organizations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-base text-text-primary">Recent Organizations</h2>
            <p className="text-xs text-text-muted mt-0.5">Latest customers on the platform</p>
          </div>
          <Link
            href="/admin/organizations"
            className="flex items-center gap-1 text-xs text-brand hover:underline font-medium"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-border-subtle">
          {recentOrgs.map((org) => (
            <Link
              key={org.id}
              href={`/admin/organizations/${org.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-bg-hover transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center font-display font-bold text-sm text-text-primary">
                  {org.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{org.name}</p>
                  <p className="text-xs text-text-muted">{org.owner_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {org.branch_count} {org.branch_count === 1 ? "branch" : "branches"}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {org.user_count}</span>
                </div>

                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
                  ${org.plan !== "free" && org.plan !== "starter" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"}`}>
                  {(org.plan === "pro" || org.plan === "medium") && <Crown size={10} />}
                  {org.plan ? org.plan.charAt(0).toUpperCase() + org.plan.slice(1) : "Free"}
                </span>

                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                  ${org.plan_status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                  {org.plan_status}
                </span>

                <ArrowRight size={14} className="text-text-muted" />
              </div>
            </Link>
          ))}

          {recentOrgs.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-text-muted">
              No organizations yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
