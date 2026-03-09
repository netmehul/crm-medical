"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Check, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { publicPlansApi, orgApi, type PublicPlan } from "@/lib/api";
import Button from "@/components/ui/button";
import Link from "next/link";

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BillingPage() {
  const { clinic, user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [billingInfo, setBillingInfo] = useState<{
    organization?: { plan?: string; plan_status?: string; plan_activated_at?: string };
    payments?: Record<string, unknown>[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPlan = clinic?.plan || "free";
  const isOrgAdmin = user?.role === "org_admin";

  useEffect(() => {
    if (!loading && !isOrgAdmin) {
      router.push("/dashboard");
    }
  }, [isOrgAdmin, loading, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [plansData, ...rest] = await Promise.all([
          publicPlansApi.getPlans(),
          isOrgAdmin ? orgApi.getBilling().catch(() => null) : Promise.resolve(null),
        ]);
        if (!cancelled) {
          setPlans(plansData);
          if (rest[0]) setBillingInfo(rest[0] as typeof billingInfo);
        }
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isOrgAdmin]);

  const currentPlanData = plans.find((p) => p.slug === currentPlan);
  const paidPlans = plans.filter((p) => p.slug !== "free" && p.monthlyPriceCents > 0);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Current plan */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display font-bold text-xl text-text-primary">Current Plan</h1>
            <span
              className={`px-2.5 py-1 rounded-full text-sm font-medium ${currentPlan === "pro"
                ? "bg-warning/15 text-warning"
                : "bg-info/15 text-info"
                }`}
            >
              {currentPlanData?.name || (currentPlan === "pro" ? "Pro" : "Free")}
            </span>
          </div>
          {currentPlanData && (
            <p className="text-sm text-text-secondary mb-4">{currentPlanData.tagline}</p>
          )}
          {currentPlan === "pro" && (
            <div className="flex items-center gap-2 text-success text-sm">
              <Check size={18} />
              <span>All features are unlocked.</span>
            </div>
          )}
        </div>

        {/* Pricing — same as upgrade page, synced from DB */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-brand" />
            <h2 className="font-display font-bold text-lg text-text-primary">Available Plans</h2>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Pricing is synced with your organization&apos;s plan configuration.
          </p>

          <div className="space-y-4">
            {plans.map((plan) => {
              const isCurrent = plan.slug === currentPlan;
              const isPaid = plan.monthlyPriceCents > 0;
              const canUpgrade = !isCurrent && isPaid;
              return (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${isCurrent
                    ? "border-brand bg-brand/5"
                    : "border-border-subtle bg-bg-surface"
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{plan.name}</span>
                      {isCurrent && (
                        <span className="text-xs text-brand font-medium">Current</span>
                      )}
                      {plan.isPopular && !isCurrent && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-warning/15 text-warning">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{plan.tagline}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-bold text-text-primary">
                        {formatPrice(plan.monthlyPriceCents)}
                        <span className="text-sm font-normal text-text-muted">/mo</span>
                      </p>
                      {isPaid && plan.annualPriceCents > 0 && (
                        <p className="text-xs text-text-muted">
                          {formatPrice(plan.annualPriceCents)}/yr
                          {plan.annualDiscountPercent
                            ? ` (${plan.annualDiscountPercent}% off)`
                            : ""}
                        </p>
                      )}
                    </div>
                    {canUpgrade && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/upgrade?plan=${encodeURIComponent(plan.slug)}`)}
                      >
                        <Sparkles size={14} className="mr-1.5" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment history (org admin only) */}
        {isOrgAdmin && billingInfo?.payments && billingInfo.payments.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-lg text-text-primary mb-4">
              Payment History
            </h2>
            <div className="space-y-2">
              {billingInfo.payments.map((p: Record<string, unknown>, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
                >
                  <span className="text-sm text-text-secondary">
                    {String(p.activated_at || p.created_at || "—")}
                  </span>
                  <span className="text-sm font-mono text-text-primary">
                    {String(p.receipt_id || p.id || "—")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
