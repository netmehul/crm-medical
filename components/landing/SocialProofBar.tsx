"use client";

import { motion, useReducedMotion } from "framer-motion";

const clinicNames = [
  "Apollo Clinics",
  "Fortis Health",
  "MediPoint Care",
  "HealthFirst",
  "CityMed Hospital",
  "PrimeCare",
  "LifeLine Clinic",
  "Sunrise Medical",
];

function LogoPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-6 opacity-45 hover:opacity-100 transition-opacity duration-300 group cursor-default">
      <div className="w-8 h-8 rounded-lg bg-brand-dim border border-border-default flex items-center justify-center group-hover:border-brand/40 transition-colors">
        <span className="font-display text-xs font-bold text-brand">{name[0]}</span>
      </div>
      <span className="font-sans text-sm font-medium text-text-secondary whitespace-nowrap group-hover:text-text-primary transition-colors">
        {name}
      </span>
    </div>
  );
}

export default function SocialProofBar() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative bg-bg-surface border-t border-b border-border-default py-10 overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="font-display font-[800] text-text-primary whitespace-nowrap"
          style={{ fontSize: "clamp(80px, 12vw, 160px)", opacity: 0.03 }}
        >
          500+
        </span>
      </div>

      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
        whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center font-sans text-sm text-text-muted mb-6 relative z-10"
      >
        Trusted by <span className="text-brand font-medium">500+</span> clinics across India
      </motion.p>

      {/* Marquee */}
      <div className="relative z-10">
        <div className="flex marquee-track" style={{ width: "max-content" }}>
          {[...clinicNames, ...clinicNames, ...clinicNames].map((name, i) => (
            <LogoPlaceholder key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
