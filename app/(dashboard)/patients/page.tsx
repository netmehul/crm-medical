"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Upload, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Patient } from "@/lib/types";
import { patientsApi } from "@/lib/api";
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
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchPatients = useCallback(async () => {
    try {
      setError(null);
      const result = await patientsApi.list({ page: 1, limit: 50 });
      setPatients(result.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load patients";
      setError(message);
      addToast({ type: "error", title: "Error", message });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await patientsApi.delete(deleteId);
      addToast({ type: "success", title: "Patient removed" });
      setDeleteId(null);
      await fetchPatients();
    } catch (err) {
      addToast({ type: "error", title: "Failed to delete patient", message: err instanceof Error ? err.message : undefined });
    }
  };

  const handleImport = (imported: Patient[]) => {
    setPatients((prev) => [...prev, ...imported]);
    addToast({ type: "success", title: `${imported.length} patients imported` });
  };

  const handleAddPatient = async (data: { name: string; age: string; gender: string; phone: string; email: string; bloodGroup: string; address: string }) => {
    await patientsApi.create({
      full_name: data.name,
      phone: data.phone,
      gender: data.gender.toLowerCase(),
      email: data.email || undefined,
      address: data.address || undefined,
      blood_group: data.bloodGroup || undefined,
    });
    addToast({ type: "success", title: "Patient added successfully" });
    await fetchPatients();
  };

  const handleEditPatient = async (data: { name: string; age: string; gender: string; phone: string; email: string; bloodGroup: string; address: string }) => {
    if (!editPatient) return;
    await patientsApi.update(editPatient.id, {
      full_name: data.name,
      phone: data.phone,
      gender: data.gender.toLowerCase(),
      email: data.email || undefined,
      address: data.address || undefined,
      blood_group: data.bloodGroup || undefined,
    });
    addToast({ type: "success", title: "Patient updated successfully" });
    setEditPatient(null);
    await fetchPatients();
  };

  const SortArrow = ({ field }: { field: SortField }) => (
    <span className={`ml-1 text-[10px] ${sortField === field ? "text-brand" : "text-text-muted"}`}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (error && patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-text-muted">{error}</p>
        <Button size="sm" onClick={() => { setLoading(true); fetchPatients(); }}>Retry</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-primary">Patients</h1>
          <p className="text-sm text-text-secondary mt-0.5">{patients.length} total patients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)} className="flex-1 md:flex-initial" size="md"><Plus size={18} /> Add Patient</Button>
          <Button variant="ghost" onClick={() => setImportOpen(true)} size="md" className="px-3"><Upload size={18} className="md:mr-2" /> <span className="hidden md:inline">Import</span></Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${filter === f ? "bg-brand/15 text-brand border-brand/30" : "bg-bg-surface text-text-muted border-border-subtle hover:bg-bg-hover"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rendering */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="No patients found" description="No patients match your search or filters." actionLabel="Add Patient" onAction={() => setAddOpen(true)} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-base/30">
                    {[
                      { label: "Patient", field: "name" as SortField },
                      { label: "Age", field: "age" as SortField },
                      { label: "Phone", field: null },
                      { label: "Last Visit", field: "lastVisit" as SortField },
                      { label: "Doctor", field: null },
                      { label: "Status", field: "status" as SortField },
                      { label: "", field: null },
                    ].map((col) => (
                      <th
                        key={col.label}
                        onClick={() => col.field && toggleSort(col.field)}
                        className={`px-4 py-4 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider ${col.field ? "cursor-pointer hover:text-text-primary select-none" : ""}`}
                      >
                        {col.label}
                        {col.field && <SortArrow field={col.field} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/patients/${p.id}`)}
                      className="hover:bg-bg-hover transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                            <p className="text-[10px] font-mono text-text-muted mt-0.5 tracking-tight">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-text-secondary">{p.age}</td>
                      <td className="px-4 py-4 text-sm text-text-secondary font-mono">{p.phone}</td>
                      <td className="px-4 py-4 text-sm text-text-secondary">{p.lastVisit ? formatDate(p.lastVisit) : "—"}</td>
                      <td className="px-4 py-4 text-sm text-text-secondary">{p.doctor || "—"}</td>
                      <td className="px-4 py-4"><Badge variant={statusVariant[p.status]}>{p.status}</Badge></td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditPatient(p)} className="p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-secondary cursor-pointer" title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-danger cursor-pointer" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/patients/${p.id}`)}
                className="glass-card p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="md" />
                    <div>
                      <h3 className="font-semibold text-text-primary">{p.name}</h3>
                      <p className="text-[11px] text-text-muted font-mono">{p.id}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-border-subtle pt-3 mt-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-muted uppercase tracking-wider font-bold text-[10px]">Age / Gender</span>
                    <span className="text-text-secondary font-medium">{p.age}y • {p.gender}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-muted uppercase tracking-wider font-bold text-[10px]">Phone</span>
                    <span className="text-text-secondary font-mono">{p.phone}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-muted uppercase tracking-wider font-bold text-[10px]">Last Visit</span>
                    <span className="text-text-secondary font-medium">{p.lastVisit ? formatDate(p.lastVisit) : "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-muted uppercase tracking-wider font-bold text-[10px]">Doctor</span>
                    <span className="text-text-secondary font-medium truncate">{p.doctor || "—"}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border-subtle/50">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditPatient(p); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-elevated text-text-secondary font-medium text-sm active:bg-bg-hover"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSortField("name"); /* Placeholder for more actions */ }}
                    className="w-12 flex items-center justify-center rounded-xl bg-bg-elevated text-text-muted active:bg-bg-hover"
                  >
                    <Trash2 size={14} onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Patient" description="Are you sure you want to remove this patient? This action cannot be undone." />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
      <AddPatientModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddPatient} />
      <AddPatientModal isOpen={!!editPatient} onClose={() => setEditPatient(null)} onAdd={handleEditPatient} editData={editPatient} />
    </motion.div>
  );
}
