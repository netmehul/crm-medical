"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Palette, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Avatar from "@/components/ui/avatar";
import { useToast } from "@/lib/toast-context";

type Tab = "profile" | "notifications" | "appearance";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [selectedSidebar, setSelectedSidebar] = useState(0);
  const { addToast } = useToast();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "My Profile", icon: <User size={16} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { key: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary flex items-center gap-2">
          <Settings size={22} className="text-brand" /> Settings
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.key ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar name={user?.name || "User"} size="lg" ringColor="var(--brand)" />
                <div>
                  <h2 className="font-display font-semibold text-lg text-text-primary">{user?.name}</h2>
                  <p className="text-sm text-text-secondary capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={user?.name} />
                <Input label="Email" defaultValue={user?.email} />
                <Input label="Phone" defaultValue="" />
                <Input label="Specialization" defaultValue={user?.role === "org_admin" ? "General Medicine" : ""} />
              </div>
              <Button onClick={() => addToast({ type: "success", title: "Profile updated successfully" })}>
                Save Changes
              </Button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display font-semibold text-base text-text-primary">Notification Preferences</h2>
              {[
                { label: "Appointment reminders", desc: "Get notified before upcoming appointments", default: true },
                { label: "Follow-up alerts", desc: "Notifications for overdue follow-ups", default: true },
                { label: "Low stock warnings", desc: "Alert when inventory items fall below threshold", default: true },
                { label: "New booking notifications", desc: "Notify when new appointments are booked", default: false },
                { label: "MR visit logs", desc: "Get notified about medical rep visits", default: false },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-subtle">
                  <div>
                    <p className="text-sm text-text-primary">{pref.label}</p>
                    <p className="text-xs text-text-muted">{pref.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={pref.default} className="sr-only peer" />
                    <div className="w-9 h-5 bg-border-subtle rounded-full peer-checked:bg-brand transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
              <Button onClick={() => addToast({ type: "success", title: "Preferences saved" })}>Save Preferences</Button>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display font-semibold text-base text-text-primary">Appearance</h2>
              <div className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                <p className="text-sm text-text-primary mb-2">Theme</p>
                <div className="flex gap-2">
                  {["Light (Default)", "Dark", "System"].map((t, i) => (
                    <button
                      key={t}
                      onClick={() => { setSelectedTheme(i); addToast({ type: "success", title: `Theme set to ${t}` }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selectedTheme === i ? "bg-brand/15 text-brand border border-border-brand" : "bg-bg-elevated text-text-secondary border border-border-subtle hover:bg-bg-hover"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                <p className="text-sm text-text-primary mb-2">Sidebar</p>
                <div className="flex gap-2">
                  {["Expanded", "Collapsed"].map((t, i) => (
                    <button
                      key={t}
                      onClick={() => { setSelectedSidebar(i); addToast({ type: "success", title: `Sidebar set to ${t}` }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selectedSidebar === i ? "bg-brand/15 text-brand border border-border-brand" : "bg-bg-elevated text-text-secondary border border-border-subtle hover:bg-bg-hover"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
