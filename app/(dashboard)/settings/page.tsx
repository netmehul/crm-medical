"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Bell, Palette, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import Modal from "@/components/ui/modal";
import { useToast } from "@/lib/toast-context";

type Tab = "profile" | "users" | "notifications" | "appearance";

const mockStaff = [
  { id: "U001", name: "Dr. Sharma", email: "doctor@medicrm.com", role: "doctor" },
  { id: "U002", name: "Nisha Verma", email: "reception@medicrm.com", role: "receptionist" },
  { id: "U003", name: "Ravi Kumar", email: "staff@medicrm.com", role: "staff" },
];

const roleVariant: Record<string, "brand" | "info" | "warning"> = {
  doctor: "brand", receptionist: "info", staff: "warning",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [selectedSidebar, setSelectedSidebar] = useState(0);
  const { addToast } = useToast();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "My Profile", icon: <User size={16} /> },
    { key: "users", label: "User Management", icon: <Shield size={16} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { key: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage your account and clinic preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
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

        {/* Content */}
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
                <Input label="Phone" defaultValue="+91 98765 43210" />
                <Input label="Specialization" defaultValue={user?.role === "doctor" ? "General Medicine" : ""} />
              </div>
              <Button onClick={() => addToast({ type: "success", title: "Profile updated successfully" })}>
                Save Changes
              </Button>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-base text-text-primary">Team Members</h2>
                <Button size="sm" onClick={() => setAddUserOpen(true)}><Plus size={16} /> Add User</Button>
              </div>
              <div className="glass-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {["User", "Email", "Role", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockStaff.map((s) => (
                      <tr key={s.id} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={s.name} size="sm" />
                            <span className="text-sm font-medium text-text-primary">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{s.email}</td>
                        <td className="px-4 py-3"><Badge variant={roleVariant[s.role]}>{s.role}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => addToast({ type: "info", title: `Editing ${s.name}...` })} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-secondary transition-colors cursor-pointer"><Pencil size={14} /></button>
                            <button onClick={() => addToast({ type: "warning", title: `Remove ${s.name}?`, message: "This would require confirmation" })} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-danger transition-colors cursor-pointer"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Add User Modal */}
      <Modal isOpen={addUserOpen} onClose={() => setAddUserOpen(false)} title="Add New User" size="md">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="User's full name" />
          <Input label="Email" type="email" placeholder="email@medicrm.com" />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
            <select className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer">
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <Input label="Temporary Password" type="password" placeholder="Set initial password" />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button onClick={() => { addToast({ type: "success", title: "User added successfully" }); setAddUserOpen(false); }}>Add User</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
