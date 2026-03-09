"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface BreadcrumbContextType {
  customLabels: Record<string, string>;
  setLabel: (path: string, label: string) => void;
  clearLabel: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((path: string, label: string) => {
    setCustomLabels((prev) => (prev[path] === label ? prev : { ...prev, [path]: label }));
  }, []);

  const clearLabel = useCallback((path: string) => {
    setCustomLabels((prev) => {
      if (!(path in prev)) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const value = useMemo(() => ({ customLabels, setLabel, clearLabel }), [customLabels, setLabel, clearLabel]);

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}
