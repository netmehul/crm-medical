"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, MapPin, Shield, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Branch } from "@/lib/types";

export default function BranchSelectPage() {
  const { user, branches, selectBranch, needsBranchSelect, isLoading } = useAuth();
  const router = useRouter();
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !needsBranchSelect && !branches) {
      router.push("/auth/login");
    }
  }, [needsBranchSelect, isLoading, branches, router]);

  if (isLoading || !branches) return null;

  const handleSelect = async (branch: Branch) => {
    setSelecting(branch.clinicId);
    try {
      await selectBranch(branch.clinicId);
      router.push("/dashboard");
    } catch {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-base">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-brand pulse-dot" />
            </span>
            <span className="font-display font-extrabold text-2xl text-text-primary">
              Medi<span className="text-brand">CRM</span>
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "Doctor"}.
          </h1>
          <p className="text-text-secondary">Select a branch to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map((branch, i) => (
            <motion.button
              key={branch.clinicId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(branch)}
              disabled={selecting !== null}
              className={`glass-card p-6 text-left transition-all hover:border-brand/40 hover:shadow-brand
                ${selecting === branch.clinicId ? "border-brand ring-2 ring-brand/20" : ""}
                ${selecting !== null && selecting !== branch.clinicId ? "opacity-50" : ""}
              `}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <Building2 size={22} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-text-primary text-lg truncate">
                    {branch.clinicName}
                  </h3>
                  {branch.city && (
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-1">
                      <MapPin size={14} />
                      <span>{branch.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-text-muted mt-2">
                    {branch.role === "org_admin" ? (
                      <><Shield size={14} className="text-brand" /> <span className="text-brand font-medium">Org Admin</span></>
                    ) : (
                      <><UserCheck size={14} /> <span>Receptionist</span></>
                    )}
                  </div>
                </div>
              </div>

              {selecting === branch.clinicId && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-brand">
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
