"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { appointmentsApi } from "@/lib/api";
import { Appointment } from "@/lib/types";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

interface FollowUpRow {
  id: string;
  patientName: string;
  date: string;
  reason: string;
  doctorName: string;
  status: "Overdue" | "Today" | "Upcoming" | "Completed";
  type: string;
}

const statusVariant: Record<string, "danger" | "warning" | "brand" | "success"> = {
  Overdue: "danger", Today: "warning", Upcoming: "brand", Completed: "success",
};

function deriveStatus(apt: Appointment): FollowUpRow["status"] {
  if (apt.status === "Completed" || apt.status === "Cancelled") return "Completed";
  const today = new Date().toISOString().split("T")[0];
  const aptDate = apt.date;
  if (aptDate < today) return "Overdue";
  if (aptDate === today) return "Today";
  return "Upcoming";
}

export default function HistoryPage() {
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const result = await appointmentsApi.list({ limit: 100 });
      const mapped: FollowUpRow[] = result.items.map((a) => ({
        id: a.id,
        patientName: a.patientName,
        date: a.date,
        reason: a.reason || a.notes || `${a.type} appointment`,
        doctorName: a.doctorName,
        status: deriveStatus(a),
        type: a.type,
      }));
      setRows(mapped);
    } catch {
      addToast({ type: "error", title: "Failed to load follow-ups" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filters = ["All", "Overdue", "Today", "Upcoming", "Completed"];
  const filtered = filter === "All" ? rows : rows.filter((f) => f.status === filter);

  const markContacted = async (id: string) => {
    try {
      await appointmentsApi.update(id, { status: "completed" });
      addToast({ type: "success", title: "Marked as contacted" });
      fetchData();
    } catch {
      addToast({ type: "error", title: "Failed to update" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">History & Follow-ups</h1>
        <p className="text-sm text-text-secondary mt-0.5">Track and manage patient follow-up schedules</p>
      </div>

      <div className="flex gap-1.5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === f ? "bg-brand/15 text-brand border border-border-brand" : "bg-bg-surface text-text-secondary border border-border-subtle hover:bg-bg-hover"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Patient", "Date", "Type", "Reason", "Doctor", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((fu, i) => (
                <motion.tr
                  key={fu.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`border-b border-border-subtle/50 hover:bg-bg-hover transition-colors ${fu.status === "Overdue" ? "border-l-2 border-l-danger" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={fu.patientName} size="sm" />
                      <span className="text-sm font-medium text-text-primary">{fu.patientName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{formatDate(fu.date)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{fu.type}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary max-w-[200px] truncate">{fu.reason}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{fu.doctorName}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[fu.status]}>{fu.status}</Badge></td>
                  <td className="px-4 py-3">
                    {fu.status !== "Completed" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => markContacted(fu.id)}>
                          <CheckCircle size={14} /> Mark Contacted
                        </Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-text-muted">No follow-ups in this category</div>}
      </div>
    </motion.div>
  );
}
