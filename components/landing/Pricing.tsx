"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, X, ChevronDown, ArrowRight } from "lucide-react";
import { publicPlansApi, type PublicPlan } from "@/lib/api";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const LIMIT_LABELS: { key: keyof typeof DEFAULT_LIMITS; label: string }[] = [
  { key: "patients", label: "patients" },
  { key: "appointmentsPerMonth", label: "appointments/month" },
  { key: "seats", label: "team members" },
  { key: "referralsPerMonth", label: "lab referrals/month" },
];

const DEFAULT_LIMITS = {
  patients: 50,
  appointmentsPerMonth: 30,
  seats: 2,
  referralsPerMonth: 5,
};

interface PricingTier {
  name: string;
  slug: string;
  monthlyPrice: string;
  annualPrice: string;
  annualDiscountPercent?: number;
  description: string;
  limitFeatures: { text: string; included: boolean }[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
  style: "ghost" | "brand" | "secondary";
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

function getLimitBullets(limits?: Record<string, number | null>): { text: string; included: boolean }[] {
  const lim = limits || DEFAULT_LIMITS;
  return LIMIT_LABELS.map(({ key, label }) => {
    const val = lim[key as keyof typeof lim];
    const isUnlimited = val == null || val === -1 || val === Infinity;
    const text = isUnlimited ? `Unlimited ${label}` : `Up to ${val} ${label}`;
    return { text, included: true };
  });
}

function planToTier(p: PublicPlan, index: number): PricingTier {
  const styles: ("ghost" | "brand" | "secondary")[] = ["ghost", "brand", "secondary"];
  const style = styles[Math.min(index, 2)];
  return {
    name: p.name,
    slug: p.slug,
    monthlyPrice: formatPrice(p.monthlyPriceCents),
    annualPrice: formatPrice(p.annualPriceCents),
    annualDiscountPercent: p.annualDiscountPercent ?? 0,
    description: p.tagline || "",
    limitFeatures: getLimitBullets(p.limits as Record<string, number | null>),
    cta: p.monthlyPriceCents === 0 ? "Start Free" : "Start Free Trial",
    ctaHref: "/auth/signup",
    highlighted: p.isPopular,
    badge: p.isPopular ? "Most Popular" : undefined,
    style,
  };
}

const FALLBACK_TIERS: PricingTier[] = [
  {
    name: "Free",
    slug: "free",
    monthlyPrice: "Free",
    annualPrice: "Free",
    description: "For solo practitioners",
    limitFeatures: getLimitBullets(DEFAULT_LIMITS),
    cta: "Start Free",
    ctaHref: "/auth/signup",
    style: "ghost",
  },
  {
    name: "Pro",
    slug: "pro",
    monthlyPrice: "$4.99",
    annualPrice: "$47.90",
    description: "For growing clinics",
    limitFeatures: getLimitBullets({
      patients: -1,
      appointmentsPerMonth: -1,
      seats: 5,
      referralsPerMonth: -1,
    }),
    cta: "Start Free Trial",
    ctaHref: "/auth/signup",
    highlighted: true,
    badge: "Most Popular",
    style: "brand",
  },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "Is there really no credit card needed?",
    a: "Correct. The Starter plan is completely free, and the Professional trial requires no payment information upfront.",
  },
  {
    q: "How is data security handled?",
    a: "All data is encrypted at rest and in transit. We follow HIPAA-ready practices and store data on SOC2-certified infrastructure.",
  },
  {
    q: "Can I import my existing patient data?",
    a: "Absolutely. MediCRM supports Excel import with smart column mapping. Most clinics complete their import in under 10 minutes.",
  },
  {
    q: "What kind of support do you offer?",
    a: "Starter gets email support. Professional includes priority chat support. Enterprise gets a dedicated account manager and phone support.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto mt-16 space-y-3">
      <h3 className="font-display text-xl font-bold text-text-primary text-center mb-8">
        Frequently Asked Questions
      </h3>
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-default bg-bg-elevated/50 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="font-sans text-[15px] font-medium text-text-primary">{faq.q}</span>
            <ChevronDown
              size={18}
              className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-4 font-sans text-sm text-text-secondary leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [tiers, setTiers] = useState<PricingTier[]>(FALLBACK_TIERS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    publicPlansApi.getPlans()
      .then((plans) => setTiers(plans.map((p, i) => planToTier(p, i))))
      .catch(() => setTiers(FALLBACK_TIERS));
  }, []);

  const selectedTier = tiers[selectedIndex];
  const signupHref = selectedTier ? `${selectedTier.ctaHref}${selectedTier.slug !== "free" ? `?plan=${selectedTier.slug}` : ""}` : "/auth/signup";

  return (
    <section id="pricing" className="bg-bg-base py-20 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-10"
        >
          <p className="font-mono text-xs font-medium text-brand uppercase tracking-[0.2em] mb-4">
            Pricing
          </p>
          <h2
            className="font-display font-bold text-text-primary mb-4"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            Simple, Transparent Pricing
          </h2>
          <p className="font-sans text-base lg:text-lg text-text-secondary max-w-lg mx-auto">
            Start free. Scale as your clinic grows. No hidden fees.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`font-sans text-sm ${!annual ? "text-text-primary" : "text-text-muted"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              annual ? "bg-brand" : "bg-border-default"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                annual ? "translate-x-6" : ""
              }`}
            />
          </button>
          <span className={`font-sans text-sm ${annual ? "text-text-primary" : "text-text-muted"}`}>
            Annual
          </span>
          {annual && (() => {
            const maxDiscount = Math.max(0, ...tiers.map((t) => t.annualDiscountPercent ?? 0));
            return maxDiscount > 0 ? (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-dim text-brand text-xs font-mono font-medium">
                Save up to {maxDiscount}%
              </span>
            ) : null;
          })()}
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {tiers.map((tier, i) => {
            const isSelected = selectedIndex === i;
            return (
            <motion.button
              key={tier.name}
              type="button"
              onClick={() => setSelectedIndex(i)}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 32 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className={`relative rounded-2xl border p-8 text-left w-full cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-brand ring-offset-2 ring-offset-bg-base"
                  : ""
              } ${
                tier.highlighted
                  ? "bg-bg-elevated border-brand/30 shadow-lg shadow-brand-dim lg:-translate-y-4"
                  : tier.style === "secondary"
                  ? "bg-bg-elevated border-secondary/25"
                  : "bg-bg-elevated border-border-default"
              } hover:border-brand/50`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand text-bg-void text-xs font-mono font-medium">
                  {tier.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-text-primary mb-1">{tier.name}</h3>
                <p className="font-sans text-sm text-text-muted">{tier.description}</p>
              </div>

              <div className="mb-6">
                <span
                  className="font-display font-[800] text-text-primary"
                  style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
                >
                  {annual ? tier.annualPrice : tier.monthlyPrice}
                </span>
                {tier.monthlyPrice !== "Free" && tier.monthlyPrice !== "Custom" && (
                  <span className="font-sans text-sm text-text-muted ml-1">/ month</span>
                )}
              </div>

              <div className="border-t border-border-default pt-6 space-y-3">
                {tier.limitFeatures.map((f) => (
                  <div key={f.text} className="flex items-center gap-3">
                    {f.included ? (
                      <Check size={16} className="text-brand flex-shrink-0" />
                    ) : (
                      <X size={16} className="text-text-muted/40 flex-shrink-0" />
                    )}
                    <span className={`font-sans text-sm ${f.included ? "text-text-secondary" : "text-text-muted/50"}`}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.button>
          );
          })}
        </div>

        {/* Single CTA buttons below cards */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={signupHref}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-brand text-bg-void font-sans text-[15px] font-semibold hover:opacity-90 transition-opacity text-center shadow-lg shadow-brand-glow"
          >
            {selectedTier?.cta ?? "Start Free Trial"} →
          </Link>
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg border border-border-default text-sm text-text-primary hover:border-brand hover:text-brand font-medium transition-colors"
          >
            View more details
            <ArrowRight size={14} />
          </Link>
        </div>

        <FAQ />
      </div>
    </section>
  );
}
