"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  UserCheck, Calendar, Package, Check,
  TrendingUp, Clock, AlertTriangle, Bell,
} from "lucide-react";
import type { ReactNode } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Feature {
  icon: ReactNode;
  eyebrow: string;
  headline: string[];
  body: string;
  bullets: string[];
  visual: ReactNode;
  reversed?: boolean;
}

function PatientMockup() {
  return (
    <div className="w-full rounded-xl border border-border-default bg-bg-base overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-dim flex items-center justify-center">
            <span className="font-display text-xl font-bold text-brand">PS</span>
          </div>
          <div>
            <div className="font-sans text-base font-semibold text-text-primary">Priya Sharma</div>
            <div className="font-mono text-xs text-text-muted">Patient #1247 · Female · 34y</div>
          </div>
          <div className="ml-auto px-3 py-1 rounded-full bg-success/15 text-success text-xs font-mono">Active</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Visits", value: "24" },
            { label: "Last Visit", value: "2 days" },
            { label: "Follow-ups", value: "3" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-bg-surface border border-border-default p-3 text-center">
              <div className="font-display text-lg font-bold text-text-primary">{s.value}</div>
              <div className="font-mono text-[10px] text-text-muted uppercase">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {["Blood pressure check — Today", "Routine checkup — 3 days ago", "Lab results review — 1 week ago"].map((entry) => (
            <div key={entry} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-elevated/60">
              <div className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-xs font-sans text-text-secondary">{entry}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const slots = [
    { time: "09:00", name: "A. Mehta", status: "Completed", color: "bg-success" },
    { time: "09:30", name: "R. Gupta", status: "In Progress", color: "bg-warning" },
    { time: "10:00", name: "S. Patel", status: "Scheduled", color: "bg-secondary" },
    { time: "10:30", name: "K. Singh", status: "Scheduled", color: "bg-secondary" },
    { time: "11:00", name: "P. Sharma", status: "Cancelled", color: "bg-danger" },
  ];
  return (
    <div className="w-full rounded-xl border border-border-default bg-bg-base overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-default bg-bg-elevated">
        <span className="font-sans text-sm font-semibold text-text-primary">Today&apos;s Schedule</span>
        <span className="font-mono text-xs text-brand">5 appointments</span>
      </div>
      <div className="p-4 space-y-2">
        {slots.map((slot) => (
          <div key={slot.time} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-surface border border-border-default">
            <span className="font-mono text-xs text-text-muted w-12">{slot.time}</span>
            <div className="flex-1">
              <span className="text-sm font-sans text-text-primary">{slot.name}</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${slot.color}/15 text-text-secondary`}>
              {slot.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryMockup() {
  const items = [
    { name: "Amoxicillin 500mg", stock: 450, status: "In Stock", color: "bg-success" },
    { name: "Paracetamol 650mg", stock: 12, status: "Low Stock", color: "bg-warning", highlight: true },
    { name: "Insulin Glargine", stock: 89, status: "In Stock", color: "bg-success" },
    { name: "Metformin 1000mg", stock: 5, status: "Critical", color: "bg-danger", highlight: true },
  ];
  return (
    <div className="w-full rounded-xl border border-border-default bg-bg-base overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-default bg-bg-elevated">
        <span className="font-sans text-sm font-semibold text-text-primary">Inventory Status</span>
        <span className="font-mono text-xs text-warning flex items-center gap-1">
          <AlertTriangle size={10} /> 2 alerts
        </span>
      </div>
      <div className="p-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.name}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
              item.highlight
                ? "bg-warning/5 border-warning/20"
                : "bg-bg-surface border-border-default"
            }`}
          >
            <div>
              <div className="text-sm font-sans text-text-primary">{item.name}</div>
              <div className="font-mono text-[10px] text-text-muted">{item.stock} units</div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${item.color}/15 text-text-secondary`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const features: Feature[] = [
  {
    icon: <UserCheck size={20} className="text-brand" />,
    eyebrow: "PATIENTS",
    headline: ["Every Patient,", "Perfectly Remembered."],
    body: "Complete patient profiles with full history, timeline, prescriptions, and follow-up records. Import from Excel in 3 clicks.",
    bullets: ["Smart Excel import", "Full visit timeline", "Follow-up reminders"],
    visual: <PatientMockup />,
  },
  {
    icon: <Calendar size={20} className="text-brand" />,
    eyebrow: "SCHEDULING",
    headline: ["Zero Double-Bookings.", "Zero Missed Appointments."],
    body: "Calendar and list views. Status tracking. One-click booking. Automated reminders.",
    bullets: ["Calendar + list views", "4 status types", "Instant booking"],
    visual: <CalendarMockup />,
    reversed: true,
  },
  {
    icon: <Package size={20} className="text-brand" />,
    eyebrow: "INVENTORY",
    headline: ["Know What You Have.", "Before You Run Out."],
    body: "Real-time stock tracking with low-stock alerts. Link MR samples directly to inventory.",
    bullets: ["Low-stock alerts", "MR product linking", "Category tracking"],
    visual: <InventoryMockup />,
  },
];

export default function FeaturesShowcase() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="features" className="bg-bg-void">
      {features.map((feature, fi) => (
        <div key={feature.eyebrow} className="py-20 lg:py-32">
          <div className="mx-auto max-w-[1280px] px-6">
            <div
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                feature.reversed ? "lg:direction-rtl" : ""
              }`}
              style={feature.reversed ? { direction: "rtl" } : undefined}
            >
              {/* Text side */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, x: feature.reversed ? 40 : -40 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease }}
                className="space-y-5"
                style={{ direction: "ltr" }}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-dim border border-brand/20 flex items-center justify-center">
                  {feature.icon}
                </div>
                <p className="font-mono text-xs font-medium text-brand uppercase tracking-[0.2em]">
                  {feature.eyebrow}
                </p>
                <div>
                  {feature.headline.map((line) => (
                    <h3
                      key={line}
                      className="font-display font-bold text-text-primary"
                      style={{ fontSize: "clamp(28px, 3.5vw, 40px)" }}
                    >
                      {line}
                    </h3>
                  ))}
                </div>
                <p className="font-sans text-base lg:text-lg leading-relaxed text-text-secondary max-w-md">
                  {feature.body}
                </p>
                <ul className="space-y-2 pt-2">
                  {feature.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 font-sans text-sm text-text-secondary">
                      <span className="w-5 h-5 rounded-full bg-brand-dim flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-brand" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Visual side */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, x: feature.reversed ? -40 : 40 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease, delay: 0.15 }}
                style={{ direction: "ltr" }}
              >
                {feature.visual}
              </motion.div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
