"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const oldWayLines = [
  "Scattered spreadsheets.",
  "Missed follow-ups.",
  "Paper prescriptions.",
  "Lost patient records.",
];

const newWayLines = [
  "Everything in one place.",
  "Every patient remembered.",
  "Every follow-up on time.",
  "Every decision — informed.",
];

export default function ProblemSolution() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative bg-bg-base py-28 lg:py-40 overflow-hidden">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="max-w-3xl mx-auto text-center space-y-16">
          {/* The Old Way */}
          <div className="space-y-6">
            <motion.p
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease }}
              className="font-mono text-sm font-medium text-brand uppercase tracking-[0.2em]"
            >
              The Old Way
            </motion.p>

            <div className="space-y-2 lg:space-y-3">
              {oldWayLines.map((line, i) => (
                <motion.div
                  key={line}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease }}
                  className="relative inline-block w-full"
                >
                  <span
                    className="font-display font-bold text-text-secondary/70"
                    style={{ fontSize: "clamp(24px, 4vw, 48px)" }}
                  >
                    <span className="relative">
                      {line}
                      <motion.span
                        className="absolute left-0 top-1/2 h-[3px] bg-danger/60"
                        initial={prefersReducedMotion ? { width: "100%" } : { width: 0 }}
                        whileInView={prefersReducedMotion ? {} : { width: "100%" }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease }}
                      />
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease }}
            className="flex justify-center"
          >
            <div className="w-12 h-12 rounded-full border border-brand/30 bg-brand-dim flex items-center justify-center pulse-dot">
              <ArrowDown size={20} className="text-brand" />
            </div>
          </motion.div>

          {/* The MediCRM Way */}
          <div className="space-y-6">
            <motion.p
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease }}
              className="font-mono text-sm font-medium text-brand uppercase tracking-[0.2em]"
            >
              The MediCRM Way
            </motion.p>

            <div className="space-y-2 lg:space-y-3">
              {newWayLines.map((line, i) => (
                <motion.p
                  key={line}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  className="font-display font-bold text-text-primary"
                  style={{ fontSize: "clamp(24px, 4vw, 48px)" }}
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
