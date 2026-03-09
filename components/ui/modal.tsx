"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal / Drawer Content */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full bg-bg-elevated shadow-2xl overflow-y-auto max-h-[92vh] md:max-h-[85vh] no-scrollbar",
              "md:static md:rounded-2xl md:translate-y-0 md:opacity-100",
              "rounded-t-3xl md:rounded-xl",
              "p-6 pt-2 md:pt-6",
              "fixed bottom-0 md:relative",
              sizeClasses[size],
              "pb-safe md:pb-6"
            )}
          >
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-border-strong/20 rounded-full mx-auto my-3 md:hidden" />

            <div className="flex items-center justify-between mb-5">
              {title ? (
                <h2 className="text-xl md:text-lg font-display font-bold text-text-primary">{title}</h2>
              ) : <div />}
              <button
                onClick={onClose}
                className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full bg-bg-surface md:bg-transparent text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
