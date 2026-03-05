"use client";

import { motion, useReducedMotion } from "framer-motion";
import { UserPlus, Settings, Zap } from "lucide-react";
import type { ReactNode } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Step {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    icon: <UserPlus size={24} className="text-brand" />,
    title: "Set Up Your Clinic",
    description: "Add your clinic details, branding, and preferences.",
  },
  {
    number: "02",
    icon: <Settings size={24} className="text-brand" />,
    title: "Configure Your Team",
    description: "Invite doctors, receptionists, and staff with role-based access.",
  },
  {
    number: "03",
    icon: <Zap size={24} className="text-brand" />,
    title: "Start Managing",
    description: "Import patients, book appointments, and go from day one.",
  },
];

export default function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="bg-bg-base py-20 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-16"
        >
          <p className="font-mono text-xs font-medium text-brand uppercase tracking-[0.2em] mb-4">
            Getting Started
          </p>
          <h2
            className="font-display font-bold text-text-primary"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            Up and Running in Minutes
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[72px] left-[16.67%] right-[16.67%] h-px">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line
                x1="0" y1="0" x2="100%" y2="0"
                stroke="var(--brand)"
                strokeWidth="1"
                strokeDasharray="8 6"
                opacity="0.3"
              />
            </svg>
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 32 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.15, ease }}
              className="relative group"
            >
              {/* Watermark number */}
              <span
                className="absolute -top-6 -left-2 font-mono text-[80px] font-medium text-brand pointer-events-none select-none"
                style={{ opacity: 0.06 }}
              >
                {step.number}
              </span>

              <div className="relative rounded-2xl bg-bg-surface border border-border-default p-8 transition-all duration-300 hover:border-brand/30 hover:border-t-[2px] hover:border-t-brand group-hover:shadow-lg group-hover:shadow-brand-dim">
                <div className="w-14 h-14 rounded-2xl bg-brand-dim border border-brand/20 flex items-center justify-center mb-6">
                  {step.icon}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-xs text-brand font-medium">Step {step.number}</span>
                </div>

                <h3 className="font-display text-xl font-bold text-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="font-sans text-[15px] text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
