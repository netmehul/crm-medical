"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Stat {
  label: string;
  tag: string;
  value: number;
  suffix: string;
  prefix?: string;
}

const stats: Stat[] = [
  { label: "Clinics Onboarded", tag: "CLINICS", value: 500, suffix: "+" },
  { label: "Patients Managed", tag: "PATIENTS", value: 50000, suffix: "+" },
  { label: "Appointment Accuracy", tag: "ACCURACY", value: 98, suffix: "%" },
  { label: "Average Setup Time", tag: "SETUP", value: 3, suffix: " Min" },
];

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-IN");
  return n.toString();
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) animate(); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(count)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative bg-bg-void py-20 lg:py-32 overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span
          className="font-display font-[800] text-text-primary whitespace-nowrap"
          style={{ fontSize: "clamp(100px, 14vw, 220px)", opacity: 0.03 }}
        >
          MEDICRM
        </span>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.tag}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className={`text-center py-8 ${
                i < stats.length - 1 ? "lg:border-r lg:border-border-default" : ""
              }`}
            >
              <p className="font-mono text-[11px] text-text-muted uppercase tracking-[0.2em] mb-3">
                {stat.tag}
              </p>
              <div
                className="font-display font-[800] text-brand mb-2"
                style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
              >
                {prefersReducedMotion ? (
                  <span>{formatNumber(stat.value)}{stat.suffix}</span>
                ) : (
                  <CountUp value={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <p className="font-sans text-sm lg:text-base font-medium text-text-secondary">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
