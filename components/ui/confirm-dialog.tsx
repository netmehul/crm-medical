"use client";

import Modal from "./modal";
import Button from "./button";
import { Trash2, CheckCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  variant?: "danger" | "confirm";
  confirmLabel?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, description,
  variant = "danger", confirmLabel, isLoading
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDanger ? "bg-danger-dim" : "bg-brand-dim"}`}>
          {isDanger ? <Trash2 size={24} className="text-danger" /> : <CheckCircle size={24} className="text-brand" />}
        </div>
        <h3 className="text-lg font-display font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{description}</p>
        <div className="flex gap-3 w-full">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant={isDanger ? "danger" : "primary"} className="flex-1" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel || (isDanger ? "Delete" : "Confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
