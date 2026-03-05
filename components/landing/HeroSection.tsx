"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users, Calendar, FileText, Activity,
  TrendingUp, Bell, ClipboardList,
} from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function DashboardMockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border-default bg-bg-base shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-bg-elevated border-b border-border-default">
        <span className="w-3 h-3 rounded-full bg-danger/80" />
        <span className="w-3 h-3 rounded-full bg-warning/80" />
        <span className="w-3 h-3 rounded-full bg-success/80" />
        <span className="ml-3 flex-1 h-6 rounded bg-bg-surface" />
      </div>
      {/* Dashboard content */}
      <div className="p-4 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Patients", value: "1,247", icon: Users, color: "text-brand" },
            { label: "Appointments", value: "38", icon: Calendar, color: "text-secondary" },
            { label: "Prescriptions", value: "156", icon: FileText, color: "text-success" },
            { label: "Follow-ups", value: "12", icon: Bell, color: "text-warning" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg bg-bg-surface border border-border-default p-3">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon size={14} className={`${kpi.color} opacity-70`} />
                <TrendingUp size={10} className="text-success" />
              </div>
              <div className="font-display text-lg font-bold text-text-primary">{kpi.value}</div>
              <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider">{kpi.label}</div>
            </div>
          ))}
        </div>
        {/* Chart area */}
        <div className="rounded-lg bg-bg-surface border border-border-default p-4 h-32 flex items-end gap-1">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, var(--brand), rgba(11,179,122,0.3))` }} />
          ))}
        </div>
        {/* Table rows */}
        <div className="space-y-2">
          {[
            { name: "Priya Sharma", status: "Completed", color: "bg-success" },
            { name: "Arjun Mehta", status: "Scheduled", color: "bg-secondary" },
            { name: "Kavita Rao", status: "In Progress", color: "bg-warning" },
          ].map((row) => (
            <div key={row.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated/50">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-dim flex items-center justify-center">
                  <span className="text-[10px] font-mono text-brand">{row.name[0]}</span>
                </div>
                <span className="text-xs font-sans text-text-secondary">{row.name}</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${row.color}/15 text-text-primary`}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (prefersReducedMotion || !mockupRef.current || !containerRef.current) return;
      if (window.innerWidth < 1024) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mockupRef.current.style.transform =
        `perspective(1200px) rotateX(${6 + y * -3}deg) rotateY(${-4 + x * 3}deg) scale(1)`;
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove, prefersReducedMotion]);

  const anim = (delay: number) =>
    prefersReducedMotion
      ? {}
      : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease, delay } };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center pt-[72px] overflow-hidden bg-bg-void hero-grid"
    >
      {/* Radial glow */}
      <div
        className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(11,179,122,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-24 w-full grid lg:grid-cols-[55fr_45fr] gap-12 lg:gap-16 items-center">
        {/* Left — Copy */}
        <div className="flex flex-col gap-6 z-10">
          <motion.div {...anim(0.1)}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand/25 bg-brand-dim font-sans text-sm text-brand">
              <span className="w-1.5 h-1.5 rounded-full bg-brand pulse-dot" />
              Built for Modern Clinics
            </span>
          </motion.div>

          <div className="space-y-1">
            <motion.h1
              {...anim(0.25)}
              className="font-display font-[800] text-text-primary leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
            >
              The CRM That
            </motion.h1>
            <motion.h1
              {...anim(0.4)}
              className="font-display font-[800] text-text-primary leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
            >
              Thinks Like
            </motion.h1>
            <motion.h1
              {...anim(0.45)}
              className="font-display font-[800] leading-[1.05] tracking-tight"
              style={{
                fontSize: "clamp(48px, 7vw, 96px)",
                background: "linear-gradient(135deg, var(--brand), var(--secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              a Doctor.
            </motion.h1>
          </div>

          <motion.p
            {...anim(0.55)}
            className="font-sans text-lg lg:text-xl leading-relaxed text-text-secondary max-w-lg"
          >
            Manage patients, appointments, prescriptions, inventory, and your
            entire clinic workflow — from one beautifully designed platform.
          </motion.p>

          <motion.div {...anim(0.65)} className="flex flex-wrap gap-3 pt-2">
            <a
              href="/auth/signup"
              className="inline-flex items-center gap-2 font-sans text-[15px] font-semibold bg-brand text-bg-void px-7 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{ boxShadow: "0 0 20px var(--brand-glow)" }}
            >
              Start Free Trial
              <span className="text-lg">→</span>
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 font-sans text-[15px] font-medium text-text-primary border border-border-default px-7 py-3.5 rounded-lg transition-all duration-200 hover:border-brand hover:text-brand"
            >
              Watch Demo
              <span className="text-sm">▶</span>
            </a>
          </motion.div>

          <motion.p
            {...anim(0.7)}
            className="font-sans text-sm text-text-muted"
          >
            No credit card required · Setup in 5 minutes · HIPAA-ready
          </motion.p>
        </div>

        {/* Right — Dashboard Mockup */}
        <motion.div
          className="relative z-10 hidden lg:block"
          initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.92, rotateX: 12, rotateY: -8 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1, rotateX: 6, rotateY: -4 }}
          transition={{ duration: 0.9, ease, delay: 0.75 }}
          style={{ perspective: 1200 }}
        >
          <div
            ref={mockupRef}
            className="transition-transform duration-150"
            style={{
              transform: "perspective(1200px) rotateX(6deg) rotateY(-4deg) scale(1)",
              boxShadow: "0 40px 120px rgba(11, 179, 122, 0.15)",
              borderRadius: 12,
            }}
          >
            <DashboardMockup />
          </div>

          {/* Floating stat pills */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.5, ease }}
            className="absolute -top-4 -right-6 frosted-pill px-4 py-2 flex items-center gap-2 float-slow"
          >
            <span className="text-success text-sm">✓</span>
            <span className="font-mono text-xs text-text-primary">142 Patients Today</span>
          </motion.div>

          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            transition={{ delay: 1.15, duration: 0.5, ease }}
            className="absolute -bottom-4 -left-6 frosted-pill px-4 py-2 flex items-center gap-2 float-delayed"
          >
            <span className="text-brand text-sm">↑</span>
            <span className="font-mono text-xs text-text-primary">98% Appointment Rate</span>
          </motion.div>
        </motion.div>

        {/* Mobile mockup fallback */}
        <motion.div
          {...anim(0.6)}
          className="lg:hidden w-full max-w-md mx-auto"
          style={{ boxShadow: "0 20px 60px rgba(11, 179, 122, 0.12)", borderRadius: 12 }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
