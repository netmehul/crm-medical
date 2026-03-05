"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast, ToastType } from "@/lib/toast-context";

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-success" />,
  error: <XCircle size={18} className="text-danger" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  info: <Info size={18} className="text-brand" />,
};

const borderColors: Record<ToastType, string> = {
  success: "border-l-success",
  error: "border-l-danger",
  warning: "border-l-warning",
  info: "border-l-brand",
};

const progressColors: Record<ToastType, string> = {
  success: "bg-success",
  error: "bg-danger",
  warning: "bg-warning",
  info: "bg-brand",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {toasts.map((toast, i) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, y: -10 }}
            animate={{ opacity: 1, x: 0, y: i * 4 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`glass-card border-l-4 ${borderColors[toast.type]} p-4 relative overflow-hidden`}
          >
            <div className="flex items-start gap-3">
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-text-secondary mt-0.5">{toast.message}</p>
                )}
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-primary cursor-pointer" aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5">
              <div
                className={`h-full ${progressColors[toast.type]}`}
                style={{ animation: "toast-progress 3s linear forwards" }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
