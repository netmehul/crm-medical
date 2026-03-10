"use client";

import { motion } from "framer-motion";
import { CreditCard, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BillingComingSoonPage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
          <CreditCard size={40} />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Billing & Invoicing
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand/15 text-brand text-xs font-bold uppercase tracking-widest">
              Coming Soon
            </span>
          </div>
        </div>

        <p className="text-text-secondary max-w-md mx-auto leading-relaxed">
          We&apos;re building a comprehensive billing system that will allow you to generate 
          professional invoices, track patient payments, and manage clinic finances 
          seamlessly within MediCRM.
        </p>

        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {[
            "Professional PDF Invoices",
            "Payment Status Tracking",
            "Automatic Tax Calculations",
            "Financial Reports",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-subtle">
              <Sparkles size={16} className="text-brand shrink-0" />
              <span className="text-sm font-medium text-text-primary">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
