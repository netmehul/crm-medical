"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft } from "lucide-react";
import { publicPlansApi, type PublicPlan } from "@/lib/api";

const LIMIT_ROWS: { key: string; label: string }[] = [
  { key: "patients", label: "Patients" },
  { key: "appointmentsPerMonth", label: "Appointments/month" },
  { key: "seats", label: "Team members" },
  { key: "referralsPerMonth", label: "Lab referrals/month" },
];

const MODULE_ROWS: { key: string; label: string }[] = [
  { key: "patients", label: "Patient records" },
  { key: "appointments", label: "Appointments & calendar" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "follow_ups", label: "Follow-ups" },
  { key: "medical_reps", label: "Medical Reps" },
  { key: "inventory", label: "Inventory management" },
  { key: "external_labs", label: "External Labs" },
  { key: "branches", label: "Branches" },
  { key: "team", label: "Team management" },
  { key: "reportUploads", label: "Report uploads" },
  { key: "billing", label: "Billing & invoicing" },
  { key: "mrManagement", label: "MR management" },
  { key: "labCommunication", label: "Lab communication" },
];

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatLimit(val: number | undefined): string {
  if (val === undefined) return "—";
  if (val === -1 || val === Infinity) return "Unlimited";
  return String(val);
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicPlansApi
      .getPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <header className="border-b border-border-subtle bg-bg-base/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/#pricing" className="flex items-center gap-2 text-text-muted hover:text-text-primary">
            <ArrowLeft size={18} />
            <span className="font-sans text-sm">Back to home</span>
          </Link>
          <Link href="/" className="font-display text-lg font-bold">
            Medi<span className="text-brand">CRM</span>
          </Link>
          <Link href="/auth/signup" className="text-sm font-medium text-brand hover:underline">
            Get started
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <p className="font-mono text-xs font-medium text-brand uppercase tracking-[0.2em] mb-4">
            Pricing
          </p>
          <h1
            className="font-display font-bold text-text-primary mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 42px)" }}
          >
            Plan Comparison
          </h1>
          <p className="font-sans text-base text-text-secondary max-w-xl mx-auto">
            Detailed breakdown of features and limits for each plan.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="overflow-x-auto rounded-xl border border-border-default bg-bg-elevated"
        >
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-4 px-6 font-sans text-sm font-semibold text-text-muted uppercase tracking-wider">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className={`py-4 px-6 text-center font-display font-bold text-text-primary ${
                      plan.isPopular ? "bg-brand/10" : ""
                    }`}
                  >
                    <div>{plan.name}</div>
                    <div className="font-sans text-sm font-normal text-text-muted mt-1">
                      {formatPrice(plan.monthlyPriceCents)}/mo
                    </div>
                    {plan.isPopular && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-brand text-bg-void text-[10px] font-mono">
                        Popular
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Limits section */}
              <tr className="bg-bg-base/50">
                <td
                  colSpan={(plans.length || 1) + 1}
                  className="py-3 px-6 font-sans text-xs font-semibold text-text-muted uppercase tracking-wider"
                >
                  Limits
                </td>
              </tr>
              {LIMIT_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-border-subtle hover:bg-bg-hover/30">
                  <td className="py-3 px-6 font-sans text-sm text-text-secondary">{row.label}</td>
                  {plans.map((plan) => {
                    const val = plan.limits?.[row.key];
                    const display = formatLimit(val);
                    return (
                      <td
                        key={plan.id}
                        className={`py-3 px-6 text-center font-sans text-sm ${
                          plan.isPopular ? "bg-brand/5" : ""
                        }`}
                      >
                        <span className="text-text-primary">{display}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Modules section */}
              <tr className="bg-bg-base/50">
                <td
                  colSpan={(plans.length || 1) + 1}
                  className="py-3 px-6 font-sans text-xs font-semibold text-text-muted uppercase tracking-wider pt-6"
                >
                  Features & modules
                </td>
              </tr>
              {MODULE_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-border-subtle hover:bg-bg-hover/30">
                  <td className="py-3 px-6 font-sans text-sm text-text-secondary">{row.label}</td>
                  {plans.map((plan) => {
                    const enabled = plan.modules?.[row.key] === true;
                    return (
                      <td
                        key={plan.id}
                        className={`py-3 px-6 text-center ${plan.isPopular ? "bg-brand/5" : ""}`}
                      >
                        {enabled ? (
                          <Check size={18} className="text-brand mx-auto" />
                        ) : (
                          <X size={16} className="text-text-muted/40 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-lg bg-brand text-bg-void font-sans font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Get started free
          </Link>
          <Link
            href="/#pricing"
            className="px-6 py-3 rounded-lg border border-border-default text-text-primary font-sans font-medium text-sm hover:border-brand hover:text-brand transition-colors"
          >
            View pricing cards
          </Link>
        </div>
      </div>
    </main>
  );
}
