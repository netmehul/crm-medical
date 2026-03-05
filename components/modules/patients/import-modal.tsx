"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from "lucide-react";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import { Patient } from "@/lib/types";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (patients: Patient[]) => void;
}

type Step = 1 | 2 | 3;

const systemFields = ["name", "phone", "age", "gender", "email", "bloodGroup", "address"];

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter(Boolean);
      const hdrs = lines[0].split(",").map((h) => h.trim());
      setHeaders(hdrs);
      const autoMap: Record<string, string> = {};
      hdrs.forEach((h) => {
        const lower = h.toLowerCase().replace(/[^a-z]/g, "");
        const match = systemFields.find((f) => f.toLowerCase() === lower);
        if (match) autoMap[h] = match;
      });
      setMapping(autoMap);
      setPreviewRows(lines.slice(1, 6).map((l) => l.split(",").map((c) => c.trim())));
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    maxFiles: 1,
  });

  const handleImport = () => {
    const patients: Patient[] = previewRows.map((row, i) => {
      const p: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (mapping[h]) p[mapping[h]] = row[idx] || "";
      });
      return {
        id: `IMP${Date.now()}${i}`,
        name: p.name || "Unknown",
        age: parseInt(p.age) || 0,
        gender: (p.gender as Patient["gender"]) || "Other",
        phone: p.phone || "",
        email: p.email,
        bloodGroup: p.bloodGroup,
        address: p.address,
        status: "New" as const,
        createdAt: new Date().toISOString().split("T")[0],
      };
    });
    onImport(patients);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setMapping({});
    setPreviewRows([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Import Patients" size="lg">
      {/* Step indicators */}
      <div className="flex items-center gap-4 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s ? "bg-brand text-bg-base" : "bg-bg-surface text-text-muted border border-border-subtle"
            }`}>{s}</span>
            <span className={`text-xs font-medium ${step >= s ? "text-text-primary" : "text-text-muted"}`}>
              {s === 1 ? "Upload" : s === 2 ? "Map Columns" : "Preview"}
            </span>
            {s < 3 && <div className={`w-12 h-px ${step > s ? "bg-brand" : "bg-border-subtle"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragActive ? "border-brand bg-brand/5" : "border-border-subtle hover:border-text-muted"
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={40} className="mx-auto text-text-muted mb-4" />
              <p className="text-sm text-text-primary font-medium">Drag & drop your file here</p>
              <p className="text-xs text-text-muted mt-1">Accepts .csv and .xlsx files</p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-bg-surface border border-border-subtle">
              <FileSpreadsheet size={18} className="text-brand" />
              <span className="text-sm text-text-primary">{fileName}</span>
              <span className="text-xs text-text-muted ml-auto">{headers.length} columns detected</span>
            </div>

            <div className="space-y-2">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-3">
                  <span className="w-36 text-sm text-text-secondary truncate">{h}</span>
                  <span className="text-text-muted">→</span>
                  <select
                    value={mapping[h] || ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}
                    className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary cursor-pointer"
                  >
                    <option value="">Skip this column</option>
                    {systemFields.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  {!mapping[h] && <AlertTriangle size={14} className="text-warning" />}
                  {mapping[h] && <CheckCircle size={14} className="text-success" />}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Continue to Preview</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-surface border-b border-border-subtle">
                    {headers.filter((h) => mapping[h]).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-text-muted">{mapping[h]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-border-subtle/50">
                      {headers.map((h, idx) => mapping[h] ? (
                        <td key={h} className="px-3 py-2 text-text-secondary">{row[idx] || <span className="text-danger text-xs">Missing</span>}</td>
                      ) : null)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleImport}>
                Confirm Import ({previewRows.length} records)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
