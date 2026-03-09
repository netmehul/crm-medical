"use client";

import { FileText, Image as ImageIcon, Download, Trash2, ExternalLink, MoreVertical } from "lucide-react";
import { PatientReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

interface ReportCardProps {
    report: PatientReport;
    onView: (report: PatientReport) => void;
    onDownload: (report: PatientReport) => void;
    onDelete: (report: PatientReport) => void;
}

const reportTypeConfig: Record<string, { label: string; variant: "info" | "success" | "warning" | "brand" | "danger" | "muted" }> = {
    lab_report: { label: "Lab Report", variant: "brand" },
    xray: { label: "X-Ray", variant: "info" },
    scan: { label: "Scan", variant: "info" },
    ecg: { label: "ECG", variant: "info" },
    insurance: { label: "Insurance", variant: "success" },
    other: { label: "Other", variant: "muted" },
};

export default function ReportCard({ report, onView, onDownload, onDelete }: ReportCardProps) {
    const config = reportTypeConfig[report.reportType] || reportTypeConfig.other;
    const isImage = report.fileType?.startsWith("image/");

    return (
        <div className="glass-card p-5 group transition-all hover:border-brand/30">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0">
                    {isImage ? (
                        <ImageIcon className="text-brand" size={24} />
                    ) : (
                        <FileText className="text-brand" size={24} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-text-primary truncate" title={report.reportName}>
                            {report.reportName}
                        </h4>
                        <Badge variant={config.variant}>{config.label}</Badge>
                    </div>

                    <p className="text-xs text-text-muted mt-1">
                        {report.reportDate ? formatDate(report.reportDate) : formatDate(report.createdAt)}
                    </p>

                    {report.notes && (
                        <p className="text-xs text-text-secondary mt-2 line-clamp-2" title={report.notes}>
                            {report.notes}
                        </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-text-muted">
                        <span>Uploaded by {report.uploadedByName || "Staff"}</span>
                        <span>•</span>
                        <span>{report.fileSizeKb ? `${report.fileSizeKb} KB` : "Unknown size"}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="flex-1 text-[11px]" onClick={() => onView(report)}>
                    <ExternalLink size={12} /> View
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-[11px]" onClick={() => onDownload(report)}>
                    <Download size={12} /> Download
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => onDelete(report)}>
                    <Trash2 size={12} /> Delete
                </Button>
            </div>
        </div>
    );
}
