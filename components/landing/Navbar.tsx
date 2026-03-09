"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backdropFilter: scrolled ? "blur(24px)" : undefined,
          WebkitBackdropFilter: scrolled ? "blur(24px)" : undefined,
          background: scrolled ? "var(--bg-base)" : "transparent",
          borderBottom: scrolled ? "1px solid var(--border-base)" : "1px solid transparent",
          transition: "background 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease",
          opacity: scrolled ? 0.95 : 1,
        }}
      >
        <div className="mx-auto max-w-[1280px] px-6 h-[72px] flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-75 pulse-dot" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            <span className="font-display text-xl font-[800] tracking-tight">
              <span className="text-text-primary">Medi</span>
              <span className="text-brand">CRM</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative font-sans text-[15px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 py-1 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-brand transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/auth/login"
              className="font-sans text-[15px] font-medium text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
            >
              Log In
            </a>
            <a
              href="/auth/signup"
              className="font-sans text-[15px] font-semibold bg-brand text-text-on-brand px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{ boxShadow: "0 0 20px var(--brand-glow)" }}
            >
              Start Free Trial
            </a>
          </div>

          {/* Mobile Hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-text-primary p-2 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-bg-void/98 flex flex-col items-center justify-center gap-8 lg:hidden"
            style={{ backdropFilter: "blur(24px)" }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="font-display text-2xl font-bold text-text-primary hover:text-brand transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <div className="flex flex-col gap-3 mt-4 w-64">
              <a
                href="/auth/login"
                className="text-center font-sans text-base text-text-secondary border border-border-base rounded-lg px-6 py-3 hover:border-brand hover:text-brand transition-all"
              >
                Log In
              </a>
              <a
                href="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="text-center font-sans text-base font-semibold bg-brand text-text-on-brand rounded-lg px-6 py-3"
              >
                Start Free Trial
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky CTA */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden p-3"
            style={{
              background: "var(--bg-base)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid var(--border-base)",
              opacity: 0.95,
            }}
          >
            <a
              href="/auth/signup"
              className="block text-center font-sans text-[15px] font-semibold bg-brand text-text-on-brand rounded-lg px-5 py-3 w-full"
            >
              Start Free Trial →
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
