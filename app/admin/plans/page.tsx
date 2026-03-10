"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Plus, Pencil, Copy, Loader2, Building2 } from "lucide-react";
import { adminApi, type AdminPlanListItem } from "@/lib/admin-api";
import { useToast } from "@/lib/toast-context";

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100);
}

export default function PlansPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<AdminPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPlans();
      setPlans(data);
    } catch (err: any) {
      console.error("Plans: Load error", err);
      addToast({ type: "error", title: "Load Failed", message: err.message });
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const handleDuplicate = async (id: string) => {
    try {
      const created = await adminApi.duplicatePlan(id);
      addToast({ type: "success", title: "Plan Duplicated" });
      router.push(`/admin/plans/${created.id}`);
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-[#ef4444]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Plan Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Create and edit plans. Changes apply to feature gating and the landing page.
          </p>
        </div>
        <Link href="/admin/plans/new">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-semibold hover:brightness-110 transition-colors cursor-pointer">
            <Plus size={16} /> New Plan
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="min-w-0"
          >
            <Link href={`/admin/plans/${plan.id}`} className="block h-full">
              <div className="glass-card p-6 h-full flex flex-col hover:border-[#ef4444]/25 hover:shadow-lg hover:shadow-[#ef4444]/5 transition-all duration-300 cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#ef4444]/10 flex items-center justify-center group-hover:bg-[#ef4444]/15 transition-colors">
                    <CreditCard size={24} className="text-[#ef4444]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {plan.isPopular && (
                      <span className="text-[10px] font-mono bg-[#ef4444]/15 text-[#ef4444] px-2 py-0.5 rounded-full">Popular</span>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${plan.status === "active" ? "bg-success/15 text-success" : "bg-text-muted/15 text-text-muted"}`}>
                      {plan.status}
                    </span>
                  </div>
                </div>
                <h2 className="font-display font-semibold text-xl text-text-primary mb-1 group-hover:text-[#ef4444] transition-colors">
                  {plan.name}
                </h2>
                <p className="text-sm text-text-muted mb-3 line-clamp-2">{plan.tagline || plan.slug}</p>
                {(plan.featureBullets?.length ?? 0) > 0 && (
                  <ul className="space-y-1.5 mb-4 text-xs text-text-secondary">
                    {plan.featureBullets.slice(0, 4).map((b, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="text-[#ef4444] mt-0.5">•</span>
                        <span className="line-clamp-1">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border-subtle">
                  <span className="font-mono text-sm font-semibold text-text-primary">{formatPrice(plan.monthlyPriceCents)}<span className="text-xs font-normal text-text-muted">/mo</span></span>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Building2 size={12} /> {plan.orgCount} org{plan.orgCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2 mt-3 px-1">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDuplicate(plan.id); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                title="Duplicate"
              >
                <Copy size={14} /> Duplicate
              </button>
              <Link href={`/admin/plans/${plan.id}`} className="flex-1">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#ef4444]/10 text-[#ef4444] text-xs font-medium hover:bg-[#ef4444]/20 transition-colors"
                >
                  <Pencil size={14} /> Edit
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
        {plans.length > 0 && (
          <Link href="/admin/plans/new" className="min-w-0 block">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: plans.length * 0.06, duration: 0.3 }}
              className="glass-card p-6 h-full min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-[#ef4444]/40 hover:bg-[#ef4444]/5 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#ef4444]/10 flex items-center justify-center mb-4 group-hover:bg-[#ef4444]/20 transition-colors">
                <Plus size={28} className="text-[#ef4444]" />
              </div>
              <p className="font-display font-semibold text-text-primary group-hover:text-[#ef4444] transition-colors">New Plan</p>
              <p className="text-xs text-text-muted mt-1">Create a new pricing plan</p>
            </motion.div>
          </Link>
        )}
      </div>

      {plans.length === 0 && (
        <div className="glass-card py-16 text-center">
          <CreditCard size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No plans yet</p>
          <Link href="/admin/plans/new">
            <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-semibold hover:brightness-110 cursor-pointer">
              <Plus size={16} /> Create First Plan
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
