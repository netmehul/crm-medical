"use client";

import { Twitter, Linkedin, Instagram } from "lucide-react";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Changelog", href: "#" },
  { label: "Roadmap", href: "#" },
];

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Press", href: "#" },
];

const supportLinks = [
  { label: "Help Center", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
];

const socials = [
  { icon: <Twitter size={18} />, href: "#", label: "Twitter" },
  { icon: <Linkedin size={18} />, href: "#", label: "LinkedIn" },
  { icon: <Instagram size={18} />, href: "#", label: "Instagram" },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-sans text-sm font-semibold text-text-primary mb-4">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="font-sans text-sm text-text-muted hover:text-brand transition-colors duration-200"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      className="relative bg-bg-void pt-16 pb-8"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(11,179,122,0.02) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-75 pulse-dot" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
              </span>
              <span className="font-display text-lg font-[800] tracking-tight">
                <span className="text-text-primary">Medi</span>
                <span className="text-brand">CRM</span>
              </span>
            </a>
            <p className="font-sans text-sm text-text-muted mb-6 max-w-[200px]">
              The CRM that thinks like a doctor.
            </p>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg border border-border-default flex items-center justify-center text-text-muted hover:text-brand hover:border-brand/30 transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Support" links={supportLinks} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border-default pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-text-muted">
            &copy; {new Date().getFullYear()} MediCRM. All rights reserved.
          </p>
          <p className="font-sans text-xs text-text-muted">
            Made with <span className="text-danger">♥</span> for clinics everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
