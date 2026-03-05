"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Stethoscope, User, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

const roles: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: "doctor", label: "Doctor", icon: <Stethoscope size={18} /> },
  { value: "receptionist", label: "Receptionist", icon: <User size={18} /> },
  { value: "staff", label: "Staff", icon: <ShieldCheck size={18} /> },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("doctor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, role);
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-center items-center p-12"
        style={{
          background: `linear-gradient(135deg, rgba(8,145,178,0.06) 0%, #EFF6FF 50%, rgba(59,130,246,0.05) 100%)`,
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 800 600" fill="none">
          <motion.path
            d="M0 300 L100 300 L120 300 L140 250 L160 350 L180 200 L200 400 L220 280 L240 320 L260 300 L400 300 L420 300 L440 250 L460 350 L480 200 L500 400 L520 280 L540 320 L560 300 L800 300"
            stroke="var(--brand)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        <div className="relative z-10 text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-brand pulse-dot" />
              </span>
              <span className="font-display font-extrabold text-2xl text-text-primary">
                Medi<span className="text-brand">CRM</span>
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="font-display font-bold text-3xl lg:text-4xl text-text-primary leading-tight mb-4"
          >
            Precision in care,<br />
            <span className="text-brand">clarity</span> in management.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-text-secondary text-base"
          >
            Your complete clinic management solution — from appointments to inventory, designed for modern medical practice.
          </motion.p>
        </div>
      </motion.div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeft size={16} /> Back to home
            </Link>
          </div>

          <div className="glass-card p-8">
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <span className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-brand pulse-dot" />
              </span>
              <span className="font-display font-extrabold text-xl text-text-primary">
                Medi<span className="text-brand">CRM</span>
              </span>
            </div>

            <h2 className="font-display font-bold text-xl text-text-primary mb-1">Welcome back</h2>
            <p className="text-sm text-text-secondary mb-6">Sign in to your account to continue</p>

            {/* Role selector */}
            <div className="flex gap-2 mb-6">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    role === r.value
                      ? "bg-brand/15 text-brand border border-border-brand"
                      : "bg-bg-surface text-text-secondary border border-border-subtle hover:bg-bg-hover"
                  }`}
                >
                  {r.icon}
                  <span className="hidden sm:inline">{r.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="doctor@medicrm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-danger"
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full" isLoading={loading} size="lg">
                Sign In
              </Button>
            </form>

            <p className="text-xs text-text-muted text-center mt-6">
              Demo: Enter any email/password and select a role
            </p>

            <div className="mt-6 pt-4 border-t border-border-subtle text-center">
              <p className="text-sm text-text-secondary">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-brand font-medium hover:underline">
                  Create one free
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
