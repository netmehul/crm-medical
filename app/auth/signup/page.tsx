"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, isAppReady, isPlatformAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isPlatformAdmin) router.push("/admin");
    else if (isAppReady) router.push("/dashboard");
  }, [isAppReady, isPlatformAdmin, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!orgName.trim() && !clinicName.trim()) { setError("Please enter your organization or clinic name."); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await register(orgName || clinicName, clinicName || orgName, name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
          background: "linear-gradient(135deg, rgba(129,140,248,0.06) 0%, #EFF6FF 50%, rgba(11,179,122,0.05) 100%)",
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 800 600" fill="none">
          <motion.path
            d="M0 300 L100 300 L120 300 L140 250 L160 350 L180 200 L200 400 L220 280 L240 320 L260 300 L400 300 L420 300 L440 250 L460 350 L480 200 L500 400 L520 280 L540 320 L560 300 L800 300"
            stroke="var(--secondary)"
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
            Start managing your clinic<br />
            <span className="text-secondary">in minutes</span>, not months.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-text-secondary text-base"
          >
            Join 500+ clinics already using MediCRM. Free 30-day trial, no credit card required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col gap-3 mt-8"
          >
            {["Setup in 5 minutes", "HIPAA-ready security", "Cancel anytime"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center text-success text-xs">✓</span>
                {item}
              </div>
            ))}
          </motion.div>
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
            <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
              <span className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-brand pulse-dot" />
              </span>
              <span className="font-display font-extrabold text-xl text-text-primary">
                Medi<span className="text-brand">CRM</span>
              </span>
            </div>

            <h2 className="font-display font-bold text-xl text-text-primary mb-1">Create your account</h2>
            <p className="text-sm text-text-secondary mb-6">Get started with your free 30-day trial</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Dr. Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Organization Name"
                placeholder="e.g. MediPoint Group"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />

              <Input
                label="First Branch Name"
                placeholder="e.g. MediPoint — Ahmedabad"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />

              <Input
                label="Email"
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

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
                Create Account
              </Button>
            </form>

            <p className="text-xs text-text-muted text-center mt-4">
              By signing up, you agree to our{" "}
              <a href="#" className="text-brand hover:underline">Terms</a> and{" "}
              <a href="#" className="text-brand hover:underline">Privacy Policy</a>
            </p>

            <div className="mt-6 pt-4 border-t border-border-subtle text-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-brand font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
