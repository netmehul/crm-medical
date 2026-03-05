"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${6 + Math.random() * 8}s`,
        size: Math.random() * 2 + 1,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: 0,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export default function FinalCTA() {
  const prefersReducedMotion = useReducedMotion();

  const words1 = ["Your", "Clinic", "Deserves"];
  const words2 = ["Better", "Software."];

  return (
    <section className="relative bg-bg-void py-24 lg:py-40 overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(11,179,122,0.10) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {!prefersReducedMotion && <Particles />}

      <div className="relative mx-auto max-w-[1280px] px-6 text-center">
        {/* Headline */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-x-[0.35em]">
            {words1.map((word, i) => (
              <motion.span
                key={word}
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.85, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="font-display font-[800] text-text-primary"
                style={{ fontSize: "clamp(40px, 7vw, 80px)" }}
              >
                {word}
              </motion.span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-x-[0.35em]">
            {words2.map((word, i) => (
              <motion.span
                key={word}
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.85, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease }}
                className="font-display font-[800]"
                style={{
                  fontSize: "clamp(40px, 7vw, 80px)",
                  background: "linear-gradient(135deg, var(--brand), var(--secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>

        <motion.p
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5, ease }}
          className="font-sans text-lg lg:text-xl text-text-secondary max-w-xl mx-auto mb-10"
        >
          Join 500+ clinics already running on MediCRM.
          <br />
          Setup takes minutes. The impact lasts.
        </motion.p>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.65, ease }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 font-sans text-[15px] font-semibold bg-brand text-bg-void px-8 py-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 pulse-glow-btn"
          >
            Start Free Trial — No Card Needed
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 font-sans text-[15px] font-medium text-text-primary border border-secondary/40 px-8 py-4 rounded-lg transition-all duration-200 hover:border-secondary hover:text-secondary"
          >
            Book a Live Demo
          </a>
        </motion.div>

        <motion.p
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="font-sans text-sm text-text-muted"
        >
          ✓ Free 30-day trial &nbsp;·&nbsp; ✓ Full feature access &nbsp;·&nbsp; ✓ Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
