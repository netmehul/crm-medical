"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Loader2, Search } from "lucide-react";
import { patientFilesApi } from "@/lib/api";
import { PatientReport } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import Button from "@/components/ui/button";
import ReportCard from "./ReportCard";
import UploadReportModal from "./UploadReportModal";

interface ReportsTabProps {
    patientId: string;
    patientName: string;
    reports?: PatientReport[];
    onRefresh?: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:5000";

export default function ReportsTab({ patientId, patientName, reports, onRefresh }: ReportsTabProps) {
    const [localReports, setLocalReports] = useState<PatientReport[]>([]);
    const [loading, setLoading] = useState(!reports);
    const [error, setError] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { addToast } = useToast();

    const displayReports = reports || localReports;

    const fetchReports = useCallback(async () => {
        if (reports) return; // Use parent's reports
        setLoading(true);
        try {
            const data = await patientFilesApi.getReports(patientId);
            setLocalReports(data.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load reports");
        } finally {
            setLoading(false);
        }
    }, [patientId, reports]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleUpload = async (formData: FormData) => {
        try {
            const newReport = await patientFilesApi.uploadReport(patientId, formData);
            if (onRefresh) {
                onRefresh();
            } else {
                setLocalReports((prev) => [newReport, ...prev]);
            }
        } catch (err) {
            throw err; // Handled by modal
        }
    };

    const handleView = (report: PatientReport) => {
        // Construct the URL. filePath is relative to public/uploads or absolute disk path?
        // In our backend, cb(null, uploadDir) sets it to the full disk path.
        // Wait, let's check what's stored in the DB.
        // Repo uses r.file_path = req.file.path;
        // req.file.path is the full disk path. This is bad for serving.
        // I should fix the backend to save a relative path.

        // For now, let's assume it's relative or we fix it.
        // If it's absolute, we can't easily serve it.
        // Actually, I'll fix the backend to save a relative path.

        // Assume relative path: /clinic_.../patient_.../reports/...
        const relativePath = report.filePath.split("public\\uploads\\")[1]?.replace(/\\/g, "/") ||
            report.filePath.split("public/uploads/")[1] ||
            report.fileName;

        const url = `${BACKEND_URL}/uploads/${relativePath}`;
        window.open(url, "_blank");
    };

    const handleDownload = (report: PatientReport) => {
        const relativePath = report.filePath.split("public\\uploads\\")[1]?.replace(/\\/g, "/") ||
            report.filePath.split("public/uploads/")[1] ||
            report.fileName;
        const url = `${BACKEND_URL}/uploads/${relativePath}`;

        const link = document.createElement("a");
        link.href = url;
        link.download = report.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (report: PatientReport) => {
        if (!confirm("Are you sure you want to delete this report? This cannot be undone.")) return;

        try {
            await patientFilesApi.deleteReport(patientId, report.id);
            if (onRefresh) {
                onRefresh();
            } else {
                setLocalReports((prev) => prev.filter((r) => r.id !== report.id));
            }
            addToast({ type: "success", title: "Report deleted" });
        } catch {
            addToast({ type: "error", title: "Failed to delete report" });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-sm">Loading reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Medical Reports</h3>
                    <p className="text-sm text-text-muted">Manage patient lab reports, scans, and documents.</p>
                </div>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                    <Plus size={18} /> Upload Report
                </Button>
            </div>

            {displayReports.length === 0 ? (
                <div className="glass-card py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center text-text-muted mb-4 border border-border-subtle">
                        <FileText size={32} />
                    </div>
                    <h4 className="text-lg font-medium text-text-primary">No reports uploaded yet</h4>
                    <p className="text-sm text-text-muted mt-1 max-w-xs">
                        Start by uploading the patient's lab reports, X-rays, or other medical documents.
                    </p>
                    <Button variant="ghost" className="mt-6" onClick={() => setIsUploadModalOpen(true)}>
                        <Plus size={16} /> Upload First Report
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {displayReports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onView={handleView}
                            onDownload={handleDownload}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <UploadReportModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
                patientName={patientName}
            />
        </div>
    );
}
