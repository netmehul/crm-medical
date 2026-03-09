"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, Loader2, CreditCard, ToggleLeft,
  Building2, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { adminApi, type AdminPlanDetail, type AdminPlanCreate } from "@/lib/admin-api";
import { MODULES, LIMIT_KEYS, MODULE_GROUPS, buildFeatureBullets } from "@/lib/plan-registry";

const GROUPS_ORDER = ["patients", "operations", "management", "features"];

export default function PlanEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const id = params.id as string;
  const isNew = id === "new";

  const [plan, setPlan] = useState<AdminPlanDetail | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AdminPlanCreate>({
    name: "",
    slug: "",
    monthlyPriceCents: 0,
    annualDiscountPercent: 0,
    tagline: "",
    isPopular: false,
    showOnLanding: true,
    displayOrder: 0,
    status: "draft",
    modules: {},
    limits: { patients: 50, appointmentsPerMonth: 30, seats: 2, referralsPerMonth: 5 },
  });

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await adminApi.getPlan(id);
      setPlan(data);
      setForm({
        name: data.name,
        slug: data.slug,
        monthlyPriceCents: data.monthlyPriceCents,
        annualDiscountPercent: data.annualDiscountPercent ?? 0,
        tagline: data.tagline || "",
        isPopular: data.isPopular,
        showOnLanding: data.showOnLanding,
        displayOrder: data.displayOrder,
        status: data.status,
        modules: { ...data.modules },
        limits: { ...data.limits },
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, [id, isNew]);

  useEffect(() => { load(); }, [load]);

  const updateForm = (updates: Partial<AdminPlanCreate>) => {
    setForm((f) => ({ ...f, ...updates }));
  };

  const updateModule = (key: string, enabled: boolean) => {
    setForm((f) => ({ ...f, modules: { ...f.modules, [key]: enabled } }));
  };

  const updateLimit = (key: string, value: number) => {
    setForm((f) => ({ ...f, limits: { ...f.limits, [key]: value } }));
  };

  const handleSave = async (publish = false) => {
    if (!form.name?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: AdminPlanCreate = {
        ...form,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "_"),
        featureBullets: buildFeatureBullets(form.modules ?? {}, form.limits ?? {}),
        status: publish ? "active" : form.status,
      };
      if (isNew) {
        const created = await adminApi.createPlan(payload);
        addToast({ type: "success", title: "Plan created", message: `${form.name} has been created.` });
        router.push(`/admin/plans/${created.id}`);
      } else {
        const updated = await adminApi.updatePlan(id, payload);
        addToast({
          type: "success",
          title: publish ? "Plan published" : "Draft saved",
          message: publish ? `${form.name} is now live.` : "Changes saved.",
        });
        setPlan(updated);
        setForm({
          name: updated.name,
          slug: updated.slug,
          monthlyPriceCents: updated.monthlyPriceCents,
        annualDiscountPercent: updated.annualDiscountPercent ?? 0,
        tagline: updated.tagline || "",
        isPopular: updated.isPopular,
          showOnLanding: updated.showOnLanding,
          displayOrder: updated.displayOrder,
          status: updated.status,
          modules: { ...updated.modules },
          limits: { ...updated.limits },
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save plan";
      setError(msg);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-[#ef4444]" />
      </div>
    );
  }

  if (!isNew && !plan) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-text-muted">Plan not found.</p>
        <Link href="/admin/plans" className="text-[#ef4444] text-sm hover:underline mt-2 inline-block">Back to plans</Link>
      </div>
    );
  }

  const modulesByGroup = GROUPS_ORDER.map((g) => ({
    group: g,
    label: MODULE_GROUPS[g as keyof typeof MODULE_GROUPS] || g,
    items: MODULES.filter((m) => m.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => router.push("/admin/plans")}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to plans
        </button>
        <h1 className="font-display font-bold text-2xl text-text-primary">
          {isNew ? "Create Plan" : `Edit: ${plan?.name}`}
        </h1>
        {!isNew && plan && plan.orgCount > 0 && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
            <AlertTriangle size={16} />
            <span>{plan.orgCount} organization{plan.orgCount !== 1 ? "s" : ""} on this plan. Changes apply immediately.</span>
          </div>
        )}
      </div>

      {/* Section 1: Plan Identity */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg text-text-primary flex items-center gap-2">
          <CreditCard size={18} /> Plan Identity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Plan Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder="e.g. Pro"
              className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#ef4444]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Slug (code reference)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateForm({ slug: e.target.value })}
              placeholder="Auto-generated from name"
              className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#ef4444]/30 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Monthly Price (USD)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={((form.monthlyPriceCents ?? 0) / 100).toFixed(2)}
              onChange={(e) => updateForm({ monthlyPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#ef4444]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Annual discount (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.annualDiscountPercent ?? 0}
              onChange={(e) => updateForm({ annualDiscountPercent: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#ef4444]/30"
            />
            <p className="text-[11px] text-text-muted mt-0.5">
              Annual price: ${(((form.monthlyPriceCents ?? 0) / 100 * 12 * (100 - (form.annualDiscountPercent ?? 0)) / 100)).toFixed(2)}/yr
              {(form.annualDiscountPercent ?? 0) > 0 && ` (${form.annualDiscountPercent}% off)`}
            </p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => updateForm({ tagline: e.target.value })}
            placeholder="For growing clinics"
            className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#ef4444]/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Feature bullets (auto-generated)</label>
          <p className="text-[11px] text-text-muted mb-2">Based on enabled modules and limit values below.</p>
          <ul className="px-4 py-3 rounded-lg bg-bg-surface border border-border-subtle text-sm text-text-secondary space-y-1.5 min-h-[80px]">
            {buildFeatureBullets(form.modules ?? {}, form.limits ?? {}).length > 0 ? (
              buildFeatureBullets(form.modules ?? {}, form.limits ?? {}).map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#ef4444]">•</span>
                  <span>{b}</span>
                </li>
              ))
            ) : (
              <li className="text-text-muted italic">Enable modules and set limits to see bullets</li>
            )}
          </ul>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => updateForm({ isPopular: e.target.checked })}
              className="rounded border-border-subtle"
            />
            <span className="text-sm text-text-secondary">Most Popular</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showOnLanding}
              onChange={(e) => updateForm({ showOnLanding: e.target.checked })}
              className="rounded border-border-subtle"
            />
            <span className="text-sm text-text-secondary">Show on landing page</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Display order:</span>
            <input
              type="number"
              min={0}
              value={form.displayOrder ?? 0}
              onChange={(e) => updateForm({ displayOrder: parseInt(e.target.value, 10) || 0 })}
              className="w-16 px-2 py-1 rounded bg-bg-surface border border-border-subtle text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Status:</span>
            <select
              value={form.status}
              onChange={(e) => updateForm({ status: e.target.value })}
              className="px-3 py-1.5 rounded bg-bg-surface border border-border-subtle text-sm cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Module Access */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="font-display font-semibold text-lg text-text-primary flex items-center gap-2">
          <ToggleLeft size={18} /> Module Access
        </h2>
        {modulesByGroup.map(({ group, label, items }) => (
          <div key={group}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((m) => {
                const enabled = form.modules?.[m.key] ?? false;
                return (
                  <div
                    key={m.key}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      enabled ? "border-[#ef4444]/30 bg-[#ef4444]/5" : "border-border-subtle bg-bg-surface"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{m.name}</p>
                      <p className="text-xs text-text-muted">{m.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => updateModule(m.key, !enabled)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]/50 focus-visible:ring-offset-2 ${
                        enabled ? "border-[#ef4444] bg-[#ef4444]" : "border-border-subtle bg-bg-surface"
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-out ${
                          enabled ? "left-0.5 translate-x-6" : "left-0.5 translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Section 3: Limits */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg text-text-primary flex items-center gap-2">
          <Building2 size={18} /> Limits
        </h2>
        <p className="text-sm text-text-muted">Use -1 for unlimited.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LIMIT_KEYS.map((l) => {
            const val = form.limits?.[l.key] ?? 0;
            const isUnlimited = val === -1 || val === Infinity;
            return (
              <div key={l.key}>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{l.label}</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isUnlimited}
                      onChange={() => updateLimit(l.key, -1)}
                    />
                    <span className="text-sm">Unlimited</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isUnlimited}
                      onChange={() => updateLimit(l.key, val === -1 ? 50 : val)}
                    />
                    <input
                      type="number"
                      min={0}
                      value={isUnlimited ? "" : val}
                      onChange={(e) => updateLimit(l.key, parseInt(e.target.value, 10) || 0)}
                      disabled={isUnlimited}
                      className="w-20 px-2 py-1 rounded bg-bg-surface border border-border-subtle text-sm"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{l.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Save Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={saving || !form.name?.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-sm font-semibold text-text-primary hover:border-[#ef4444]/30 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save as Draft
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || !form.name?.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ef4444] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Publish Plan
        </button>
      </div>
    </div>
  );
}
