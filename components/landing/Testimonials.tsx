"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  clinic: string;
  initials: string;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "We cut our patient wait time in half. The follow-up reminders alone are worth every rupee.",
    name: "Dr. Priya Sharma",
    role: "Cardiologist",
    clinic: "Apollo Clinic",
    initials: "PS",
    color: "bg-brand",
  },
  {
    quote: "Finally, a system my receptionist actually wanted to use. Setup took less than a day.",
    name: "Dr. Arjun Mehta",
    role: "General Practitioner",
    clinic: "MediPoint",
    initials: "AM",
    color: "bg-secondary",
  },
  {
    quote: "The inventory alerts saved us from running out of critical supplies twice already.",
    name: "Kavita Rao",
    role: "Clinic Manager",
    clinic: "HealthFirst",
    initials: "KR",
    color: "bg-success",
  },
  {
    quote: "Moving from paper prescriptions to MediCRM was the best decision we made this year.",
    name: "Dr. Nisha Gupta",
    role: "Dermatologist",
    clinic: "SkinCare Plus",
    initials: "NG",
    color: "bg-warning",
  },
  {
    quote: "Multi-doctor scheduling was a nightmare before. Now it just works. Every single day.",
    name: "Dr. Rahul Verma",
    role: "Orthopedic Surgeon",
    clinic: "OrthoLife Clinic",
    initials: "RV",
    color: "bg-danger",
  },
  {
    quote: "The MR management module alone saves us 5 hours per week. No more manual sample logs.",
    name: "Sunita Desai",
    role: "Admin Head",
    clinic: "PrimeCare Hospital",
    initials: "SD",
    color: "bg-brand",
  },
];

export default function Testimonials() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="testimonials" className="bg-bg-base py-20 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-14"
        >
          <p className="font-mono text-xs font-medium text-brand uppercase tracking-[0.2em] mb-4">
            Testimonials
          </p>
          <h2
            className="font-display font-bold text-text-on-light"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            Doctors Love It.
          </h2>
          <h2
            className="font-display font-bold text-text-on-light"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            Receptionists Live By It.
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="group relative rounded-2xl bg-white border border-gray-200 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5 hover:border-l-2 hover:border-l-brand"
            >
              {/* Decorative quote mark */}
              <span
                className="absolute top-4 right-6 font-display text-[60px] font-[800] text-brand leading-none select-none pointer-events-none"
                style={{ opacity: 0.08 }}
              >
                &ldquo;
              </span>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className="text-brand fill-brand" />
                ))}
              </div>

              {/* Quote */}
              <p className="font-sans text-[15px] leading-relaxed text-text-light-muted mb-6 relative z-10">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xs font-display font-bold text-white">{t.initials}</span>
                </div>
                <div>
                  <div className="font-sans text-sm font-semibold text-text-on-light">{t.name}</div>
                  <div className="font-sans text-xs text-text-light-muted">{t.role}, {t.clinic}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
