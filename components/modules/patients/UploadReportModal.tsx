"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";

interface UploadReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (formData: FormData) => Promise<void>;
    patientName: string;
}

export default function UploadReportModal({ isOpen, onClose, onUpload, patientName }: UploadReportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [reportName, setReportName] = useState("");
    const [reportType, setReportType] = useState("other");
    const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                addToast({ type: "error", title: "File too large", message: "Maximum file size is 10MB" });
                return;
            }
            setFile(selectedFile);
            if (!reportName) {
                // Default report name to filename without extension
                setReportName(selectedFile.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            if (droppedFile.size > 10 * 1024 * 1024) {
                addToast({ type: "error", title: "File too large", message: "Maximum file size is 10MB" });
                return;
            }
            setFile(droppedFile);
            if (!reportName) {
                setReportName(droppedFile.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !reportName) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("reportName", reportName);
        formData.append("reportType", reportType);
        formData.append("reportDate", reportDate);
        formData.append("notes", notes);

        try {
            await onUpload(formData);
            addToast({ type: "success", title: "Report uploaded", message: "The report has been successfully saved." });
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload report");
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setReportName("");
        setReportType("other");
        setReportDate(new Date().toISOString().split("T")[0]);
        setNotes("");
        setError(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Upload Report for ${patientName}`} size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Drop Zone */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${file ? "border-brand/40 bg-brand/5" : "border-border-subtle hover:border-brand/30 hover:bg-bg-hover"
                        }`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${file ? "bg-brand text-white" : "bg-bg-surface text-text-muted"}`}>
                        {file ? <FileText size={24} /> : <Upload size={24} />}
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-text-primary">
                            {file ? file.name : "Click or drag to upload"}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                            Supports PDF, JPG, PNG (Max 10MB)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary">Report Name *</label>
                        <input
                            type="text"
                            required
                            value={reportName}
                            onChange={(e) => setReportName(e.target.value)}
                            placeholder="e.g. Blood Test Results"
                            className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
                        >
                            <option value="lab_report">Lab Report</option>
                            <option value="xray">X-Ray</option>
                            <option value="scan">Scan</option>
                            <option value="ecg">ECG</option>
                            <option value="insurance">Insurance</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary">Report Date</label>
                        <input
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Notes (optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Any additional information..."
                        className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-xs text-red-500">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" className="flex-1" onClick={handleClose} type="button">Cancel</Button>
                    <Button
                        className="flex-1"
                        disabled={!file || !reportName || uploading}
                        isLoading={uploading}
                        type="submit"
                    >
                        {uploading ? "Uploading..." : "Upload Report"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
