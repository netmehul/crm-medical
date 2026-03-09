"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Check, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { paymentsApi, publicPlansApi, type PublicPlan } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/lib/toast-context";

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function UpgradePage() {
  const { clinic } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [cardName, setCardName] = useState("Demo Upgrade");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const planSlugFromUrl = searchParams.get("plan");

  useEffect(() => {
    publicPlansApi.getPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  const paidPlans = useMemo(() => plans.filter((p) => p.monthlyPriceCents > 0), [plans]);
  const selectedPlan = useMemo(() => {
    if (planSlugFromUrl) {
      const found = plans.find((p) => p.slug === planSlugFromUrl && p.monthlyPriceCents > 0);
      if (found) return found;
    }
    return paidPlans[0] ?? null;
  }, [plans, planSlugFromUrl, paidPlans]);

  const monthlyCents = selectedPlan?.monthlyPriceCents ?? 499;
  const planName = selectedPlan?.name ?? "Pro";
  const featureBullets = selectedPlan?.featureBullets ?? [
    "Unlimited patients",
    "Unlimited appointments",
    "Up to 5 team members",
    "Report uploads (PDF, images)",
    "Full billing & invoicing",
    "Inventory management",
    "Medical rep tracking",
  ];

  if (clinic?.plan === selectedPlan?.slug && !receipt) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-success" />
        </div>
        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">You&apos;re on Pro!</h1>
        <p className="text-text-secondary mb-6">All features are already unlocked.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-success" />
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary mb-4">Payment Successful</h1>
          <div className="space-y-3 text-sm text-text-secondary mb-6">
            <div className="flex justify-between py-2 border-b border-border-subtle">
              <span>Receipt</span>
              <span className="font-mono text-text-primary">{receipt}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-subtle">
              <span>Plan</span>
              <span className="text-brand font-semibold">{planName}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Amount</span>
              <span className="font-mono text-text-primary">{formatPrice(monthlyCents)}</span>
            </div>
          </div>
          <Button onClick={() => { window.location.href = "/dashboard"; }} className="w-full">
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      addToast({ type: "error", title: "Select a plan", message: "Please choose a plan from the Billing page." });
      return;
    }
    setLoading(true);
    try {
      const data = await paymentsApi.upgrade(selectedPlan.slug) as Record<string, unknown>;
      if (data.token) {
        const { setToken } = await import("@/lib/api");
        setToken(data.token as string);
      }
      setReceipt((data.receipt as string) || "MOCK-TXN-00001");
      addToast({ type: "success", title: `Welcome to ${planName}!`, message: "Your plan has been upgraded." });
    } catch (err: unknown) {
      addToast({ type: "error", title: "Upgrade failed", message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan && paidPlans.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <p className="text-text-secondary mb-6">No upgrade plans available.</p>
        <Button onClick={() => router.push("/billing")}>Back to Billing</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      {paidPlans.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {paidPlans.map((p) => (
            <button
              key={p.id}
              onClick={() => router.replace(`/upgrade?plan=${encodeURIComponent(p.slug)}`)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPlan?.slug === p.slug
                  ? "bg-brand text-text-on-brand"
                  : "bg-bg-surface border border-border-subtle text-text-secondary hover:border-brand hover:text-brand"
              }`}
            >
              {p.name} — {formatPrice(p.monthlyPriceCents)}/mo
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-brand" />
            <h2 className="font-display font-bold text-xl text-text-primary">{planName}</h2>
          </div>
          <p className="text-3xl font-mono font-bold text-text-primary mb-1">
            {formatPrice(monthlyCents)}<span className="text-lg text-text-muted">/mo</span>
          </p>
          <p className="text-sm text-text-secondary mb-6">
            {selectedPlan?.tagline ?? "Everything you need to run a real clinic"}
          </p>

          <ul className="space-y-3">
            {featureBullets.map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={16} className="text-brand shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <CreditCard size={20} className="text-text-secondary" />
            <h2 className="font-display font-semibold text-lg text-text-primary">Payment Details</h2>
          </div>

          <form onSubmit={handleUpgrade} className="space-y-4">
            <Input label="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" />
              <Input label="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" />
            </div>
            <Input label="Name on Card" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name" />

            <p className="text-xs text-text-muted">This is a mock payment form. No real charges will be made.</p>

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Pay {formatPrice(monthlyCents)}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
