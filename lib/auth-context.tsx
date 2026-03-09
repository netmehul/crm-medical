"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, Clinic, Branch, Tier } from "./types";
import { authApi, setToken, clearToken, getToken } from "./api";

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  tier: Tier | null;
  branches: Branch[] | null;
  isAuthenticated: boolean;
  isAppReady: boolean;
  isPlatformAdmin: boolean;
  needsBranchSelect: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ redirect: string; branches?: Branch[] }>;
  register: (orgName: string, clinicName: string, fullName: string, email: string, password: string) => Promise<void>;
  selectBranch: (clinicId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isPlatformAdmin = tier === "platform" && !!user;
  const isAppReady = tier === "app" && !!user && !!clinic;
  const needsBranchSelect = tier === "app" && !!user && !!branches && !clinic;
  const isAuthenticated = isPlatformAdmin || isAppReady;

  const applyAppAuth = (userData: Record<string, unknown>, clinicData: Record<string, unknown> | null) => {
    setTier("app");
    setUser({
      id: userData.id as string,
      name: (userData.full_name || userData.name) as string,
      email: userData.email as string,
      role: (userData.role as User["role"]) || "org_admin",
    });
    if (clinicData) {
      setClinic({
        id: clinicData.id as string,
        name: clinicData.name as string,
        plan: (clinicData.plan as string) || "free",
        planModules: (clinicData.planModules as Record<string, boolean>) || {},
      });
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.tier === "platform") {
        setTier("platform");
        setUser({
          id: payload.adminId,
          name: "Platform Admin",
          email: payload.email,
          role: "org_admin",
        });
        setIsLoading(false);
        return;
      }
    } catch {
      // token not decodable, try /me
    }

    authApi.me()
      .then((data) => {
        if (data.user) {
          applyAppAuth(data.user, data.clinic || null);
        }
      })
      .catch(() => { clearToken(); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.token);

    const loginTier = (data.tier || "app") as Tier;
    const redirect = (data.redirect || "/dashboard") as string;

    if (loginTier === "platform") {
      setTier("platform");
      setUser({
        id: (data.user as Record<string, unknown>).id as string,
        name: (data.user as Record<string, unknown>).full_name as string,
        email: (data.user as Record<string, unknown>).email as string,
        role: "org_admin",
      });
      return { redirect };
    }

    if (data.branches) {
      const branchList = (data.branches as Record<string, unknown>[]).map((b) => ({
        clinicId: b.clinicId as string,
        clinicName: b.clinicName as string,
        city: b.city as string | undefined,
        role: b.role as User["role"],
      }));
      setBranches(branchList);
      setTier("app");
      setUser({
        id: (data.user as Record<string, unknown>).id as string,
        name: (data.user as Record<string, unknown>).full_name as string,
        email: (data.user as Record<string, unknown>).email as string,
        role: "org_admin",
      });
      return { redirect, branches: branchList };
    }

    applyAppAuth(data.user as Record<string, unknown>, data.clinic as Record<string, unknown>);
    return { redirect };
  }, []);

  const register = useCallback(async (orgName: string, clinicName: string, fullName: string, email: string, password: string) => {
    const data = await authApi.signup({
      org_name: orgName,
      clinic_name: clinicName,
      full_name: fullName,
      email,
      password,
    });
    setToken(data.token);
    applyAppAuth(data.user, data.clinic);
  }, []);

  const selectBranch = useCallback(async (clinicId: string) => {
    const data = await authApi.branchSelect(clinicId);
    setToken(data.token);
    applyAppAuth(data.user, data.clinic);
    setBranches(null);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setClinic(null);
    setTier(null);
    setBranches(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, clinic, tier, branches,
      isAuthenticated,
      isAppReady,
      isPlatformAdmin,
      needsBranchSelect,
      isLoading,
      login, register, selectBranch, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
