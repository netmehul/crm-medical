"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import MobileDrawer from "@/components/layout/mobile-drawer";
import { cn } from "@/lib/utils";

const NO_SHELL_ROUTES = ["/branch-select"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAppReady, isPlatformAdmin, needsBranchSelect, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isBranchSelect = NO_SHELL_ROUTES.some(r => pathname.startsWith(r));

  useEffect(() => {
    if (isLoading) return;
    if (isPlatformAdmin) { router.push("/admin"); return; }
    if (!isAppReady && !needsBranchSelect) { router.push("/auth/login"); }
  }, [isAppReady, isPlatformAdmin, needsBranchSelect, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-brand pulse-dot" />
          </div>
          <p className="text-sm text-text-muted font-sans">Loading...</p>
        </div>
      </div>
    );
  }

  if (isBranchSelect) {
    return <div className="min-h-screen bg-bg-base">{children}</div>;
  }

  if (!isAppReady) return null;

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-[248px]"
        )}
      >
        {/* Mobile Header is handled inside Header component or here? 
            Request says Top Header Bar for mobile. 
            I'll update the Header component to be responsive.
        */}
        <Header onMenuClick={() => setIsMobileDrawerOpen(true)} />

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] lg:pb-6">
          {children}
        </main>

        {/* Mobile Navigation */}
        <BottomNav onMoreClick={() => setIsMobileDrawerOpen(true)} />
        <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
      </div>
    </div>
  );
}
