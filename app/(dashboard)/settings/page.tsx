"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Settings, Sparkles, Check, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import { useToast } from "@/lib/toast-context";
import { publicPlansApi, orgApi, type PublicPlan } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";


type Tab = "profile" | "notifications" | "subscription";

export default function SettingsPage() {
  const { user, clinic, isPlatformAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("activeTab") as Tab) || "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const { addToast } = useToast();

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    organization?: { plan?: string; plan_status?: string; plan_activated_at?: string };
    payments?: Record<string, unknown>[];
  } | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);

  const isOrgAdmin = user?.role === "org_admin" && !isPlatformAdmin;
  const currentPlan = clinic?.plan || "free";


  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "My Profile", icon: <User size={16} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    ...(isOrgAdmin ? [{ key: "subscription" as Tab, label: "Subscription", icon: <CreditCard size={16} /> }] : []),
  ];

  useEffect(() => {
    const tabParam = searchParams.get("activeTab") as Tab;
    if (tabParam && ["profile", "notifications", "subscription"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "subscription" && plans.length === 0) {
      setLoadingSub(true);
      Promise.all([
        publicPlansApi.getPlans(),
        orgApi.getSubscription().catch(() => null)
      ]).then(([plansData, subData]) => {
        setPlans(plansData);
        if (subData) setSubscriptionInfo(subData as any);
      }).finally(() => setLoadingSub(false));
    }
  }, [activeTab, plans.length]);

  const currentPlanData = plans.find((p) => p.slug === currentPlan);

  function formatPrice(cents: number): string {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  }


  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary flex items-center gap-2">
          <Settings size={22} className="text-brand" /> Settings
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab.key ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar name={user?.name || "User"} size="lg" ringColor="var(--brand)" />
                <div>
                  <h2 className="font-display font-semibold text-lg text-text-primary">{user?.name}</h2>
                  <p className="text-sm text-text-secondary capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={user?.name} />
                <Input label="Email" defaultValue={user?.email} />
                <Input label="Phone" defaultValue="" />
                <Input label="Specialization" defaultValue={user?.role === "org_admin" ? "General Medicine" : ""} />
              </div>
              <Button onClick={() => addToast({ type: "success", title: "Profile updated successfully" })}>
                Save Changes
              </Button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display font-semibold text-base text-text-primary">Notification Preferences</h2>
              {[
                { label: "Appointment reminders", desc: "Get notified before upcoming appointments", default: true },
                { label: "Follow-up alerts", desc: "Notifications for overdue follow-ups", default: true },
                { label: "Low stock warnings", desc: "Alert when inventory items fall below threshold", default: true },
                { label: "New booking notifications", desc: "Notify when new appointments are booked", default: false },
                { label: "MR visit logs", desc: "Get notified about medical rep visits", default: false },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-subtle">
                  <div>
                    <p className="text-sm text-text-primary">{pref.label}</p>
                    <p className="text-xs text-text-muted">{pref.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={pref.default} className="sr-only peer" />
                    <div className="w-9 h-5 bg-border-subtle rounded-full peer-checked:bg-brand transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
              <Button onClick={() => addToast({ type: "success", title: "Preferences saved" })}>Save Preferences</Button>
            </div>
          )}



          {activeTab === "subscription" && (
            <div className="space-y-6">
              {loadingSub ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                </div>
              ) : (
                <>
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-semibold text-lg text-text-primary">Current Plan</h2>
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
                    <div className="flex items-center gap-4">
                      {currentPlan === "pro" ? (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <Check size={18} />
                          <span>All features are unlocked.</span>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => router.push("/upgrade")}>
                          <Sparkles size={14} className="mr-1.5" />
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-display font-semibold text-base text-text-primary mb-4">Available Plans</h3>
                    <div className="space-y-3">
                      {plans.map((plan) => {
                        const isCurrent = plan.slug === currentPlan;
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
                                {isCurrent && <span className="text-xs text-brand font-medium">Current</span>}
                              </div>
                              <p className="text-xs text-text-secondary mt-0.5">{plan.tagline}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-sm text-text-primary">
                                {formatPrice(plan.monthlyPriceCents)}
                                <span className="text-xs font-normal text-text-muted">/mo</span>
                              </p>
                              {!isCurrent && plan.monthlyPriceCents > 0 && (
                                <button
                                  onClick={() => router.push(`/upgrade?plan=${plan.slug}`)}
                                  className="text-xs text-brand hover:underline font-medium mt-1"
                                >
                                  Switch to this plan
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {subscriptionInfo?.payments && subscriptionInfo.payments.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="font-display font-semibold text-base text-text-primary mb-4">Payment History</h3>
                      <div className="space-y-2">
                        {subscriptionInfo.payments.map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                            <span className="text-xs text-text-secondary">{String(p.activated_at || p.created_at || "—")}</span>
                            <span className="text-xs font-mono text-text-primary">{String(p.receipt_id || p.id || "—")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
