"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, FileText,
  Bell, Briefcase, Package, ArrowRight,
  Activity, ClipboardList, TrendingUp,
  UserPlus, Search, Pill, Printer,
  Clock, AlertTriangle, Boxes,
} from "lucide-react";
import type { ReactNode } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface TabContent {
  id: string;
  label: string;
  icon: ReactNode;
  headline: string;
  bullets: string[];
  bulletIcons: ReactNode[];
}

const tabs: TabContent[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    headline: "Your clinic at a glance",
    bullets: ["KPI cards with real-time data", "Follow-up reminders feed", "Activity timeline", "Booking alerts"],
    bulletIcons: [<Activity size={14} key="1" />, <Bell size={14} key="2" />, <ClipboardList size={14} key="3" />, <Calendar size={14} key="4" />],
  },
  {
    id: "patients",
    label: "Patients",
    icon: <Users size={16} />,
    headline: "Full patient intelligence",
    bullets: ["Smart Excel import", "Detailed profile pages", "Complete visit history", "Document & report links"],
    bulletIcons: [<UserPlus size={14} key="1" />, <Users size={14} key="2" />, <ClipboardList size={14} key="3" />, <FileText size={14} key="4" />],
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: <Calendar size={16} />,
    headline: "Effortless scheduling",
    bullets: ["Calendar view", "List view", "Status tracking", "Quick booking"],
    bulletIcons: [<Calendar size={14} key="1" />, <ClipboardList size={14} key="2" />, <TrendingUp size={14} key="3" />, <Clock size={14} key="4" />],
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    icon: <FileText size={16} />,
    headline: "Digital prescriptions, done right",
    bullets: ["Medication builder", "Per-visit records", "Print-ready format", "Drug interaction alerts"],
    bulletIcons: [<Pill size={14} key="1" />, <ClipboardList size={14} key="2" />, <Printer size={14} key="3" />, <AlertTriangle size={14} key="4" />],
  },
  {
    id: "followups",
    label: "Follow-ups",
    icon: <Bell size={16} />,
    headline: "Never miss a follow-up",
    bullets: ["Auto reminders", "Dashboard alerts", "Timeline tracking", "Patient notifications"],
    bulletIcons: [<Clock size={14} key="1" />, <Bell size={14} key="2" />, <Activity size={14} key="3" />, <Users size={14} key="4" />],
  },
  {
    id: "mr",
    label: "MR Management",
    icon: <Briefcase size={16} />,
    headline: "Know your reps",
    bullets: ["Visit logs", "Sample tracking", "Product catalog", "Performance metrics"],
    bulletIcons: [<ClipboardList size={14} key="1" />, <Package size={14} key="2" />, <Search size={14} key="3" />, <TrendingUp size={14} key="4" />],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: <Package size={16} />,
    headline: "Always in stock",
    bullets: ["Low-stock alerts", "Stock in/out tracking", "MR product linking", "Category organization"],
    bulletIcons: [<AlertTriangle size={14} key="1" />, <Boxes size={14} key="2" />, <Briefcase size={14} key="3" />, <Package size={14} key="4" />],
  },
];

function ModuleMockup({ tab }: { tab: TabContent }) {
  return (
    <div className="w-full rounded-xl border border-border-default bg-bg-base overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default bg-bg-elevated">
        <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
        <span className="ml-3 font-mono text-xs text-text-muted">{tab.label}</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-dim flex items-center justify-center text-brand">{tab.icon}</div>
          <span className="font-display text-base font-bold text-text-primary">{tab.headline}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tab.bullets.map((bullet, i) => (
            <div key={bullet} className="flex items-center gap-2 px-3 py-3 rounded-lg bg-bg-surface border border-border-default">
              <span className="text-brand opacity-60">{tab.bulletIcons[i]}</span>
              <span className="text-xs font-sans text-text-secondary">{bullet}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-bg-elevated/50 border border-border-default" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModuleTabs() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const prefersReducedMotion = useReducedMotion();
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="bg-bg-surface py-20 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-12"
        >
          <p className="font-mono text-xs font-medium text-brand uppercase tracking-[0.2em] mb-4">
            Full Platform
          </p>
          <h2
            className="font-display font-bold text-text-primary mb-4"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            Everything Your Clinic Needs
          </h2>
          <p className="font-sans text-base lg:text-lg text-text-secondary max-w-xl mx-auto">
            8 integrated modules. One login. No switching between tools.
          </p>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex overflow-x-auto gap-1 mb-10 pb-2 scrollbar-none border-b border-border-default">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-sans text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-[3px] -mb-px ${
                activeTab === tab.id
                  ? "text-brand border-brand"
                  : "text-text-muted border-transparent hover:text-text-secondary"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease }}
            className="grid lg:grid-cols-[40fr_60fr] gap-10 lg:gap-16 items-start"
          >
            {/* Left: feature info */}
            <div className="space-y-5">
              <h3 className="font-display text-2xl font-bold text-text-primary">
                {currentTab.headline}
              </h3>
              <ul className="space-y-3">
                {currentTab.bullets.map((bullet, i) => (
                  <li key={bullet} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-dim flex items-center justify-center text-brand flex-shrink-0">
                      {currentTab.bulletIcons[i]}
                    </span>
                    <span className="font-sans text-[15px] text-text-secondary">{bullet}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 font-sans text-sm font-medium text-brand hover:underline pt-2"
              >
                Learn more <ArrowRight size={14} />
              </a>
            </div>

            {/* Right: mockup */}
            <ModuleMockup tab={currentTab} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
