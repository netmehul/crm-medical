"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Upload, Eye, Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { mockPatients } from "@/lib/mock-data";
import { Patient } from "@/lib/types";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import ImportModal from "@/components/modules/patients/import-modal";
import AddPatientModal from "@/components/modules/patients/add-patient-modal";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

type FilterType = "All" | "Active" | "Follow-up Due" | "New";
type SortField = "name" | "age" | "lastVisit" | "status";
type SortDir = "asc" | "desc";

const statusVariant: Record<string, "brand" | "warning" | "info" | "muted"> = {
  Active: "brand",
  "Follow-up Due": "warning",
  New: "info",
  Inactive: "muted",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const { addToast } = useToast();

  const filters: FilterType[] = ["All", "Active", "Follow-up Due", "New"];

  const filtered = useMemo(() => {
    let list = patients;
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));
    if (filter !== "All") list = list.filter((p) => p.status === filter);
    list = [...list].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [patients, search, filter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setPatients((prev) => prev.filter((p) => p.id !== deleteId));
    addToast({ type: "success", title: "Patient removed" });
    setDeleteId(null);
  };

  const handleImport = (imported: Patient[]) => {
    setPatients((prev) => [...prev, ...imported]);
    addToast({ type: "success", title: `${imported.length} patients imported` });
  };

  const handleAddPatient = (patient: Patient) => {
    setPatients((prev) => [...prev, patient]);
    addToast({ type: "success", title: "Patient added successfully" });
  };

  const handleEditPatient = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    addToast({ type: "success", title: "Patient updated successfully" });
    setEditPatient(null);
  };

  const SortArrow = ({ field }: { field: SortField }) => (
    <span className={`ml-1 text-[10px] ${sortField === field ? "text-brand" : "text-text-muted"}`}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Patients</h1>
          <p className="text-sm text-text-secondary mt-0.5">{patients.length} total patients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setImportOpen(true)} size="sm"><Upload size={16} /> Import</Button>
          <Button onClick={() => setAddOpen(true)} size="sm"><Plus size={16} /> Add Patient</Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-64">
          <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
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
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="No patients found" description="No patients match your search or filters. Add your first patient to get started." actionLabel="Add Patient" onAction={() => setAddOpen(true)} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  {[
                    { label: "Patient", field: "name" as SortField },
                    { label: "Age", field: "age" as SortField },
                    { label: "Phone", field: null },
                    { label: "Last Visit", field: "lastVisit" as SortField },
                    { label: "Doctor", field: null },
                    { label: "Status", field: "status" as SortField },
                    { label: "Actions", field: null },
                  ].map((col) => (
                    <th
                      key={col.label}
                      onClick={() => col.field && toggleSort(col.field)}
                      className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide ${col.field ? "cursor-pointer hover:text-text-primary select-none" : ""}`}
                    >
                      {col.label}
                      {col.field && <SortArrow field={col.field} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{p.name}</p>
                          <p className="text-xs text-text-muted">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{p.age}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary font-mono">{p.phone}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{p.lastVisit ? formatDate(p.lastVisit) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{p.doctor || "—"}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[p.status]}>{p.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/patients/${p.id}`} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-brand transition-colors" title="View">
                          <Eye size={15} />
                        </Link>
                        <button onClick={() => setEditPatient(p)} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-secondary transition-colors cursor-pointer" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-danger transition-colors cursor-pointer" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Patient" description="Are you sure you want to remove this patient? This action cannot be undone." />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
      <AddPatientModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddPatient} />
      <AddPatientModal isOpen={!!editPatient} onClose={() => setEditPatient(null)} onAdd={handleEditPatient} editData={editPatient} />
    </motion.div>
  );
}
