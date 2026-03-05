"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { Role, User } from "./types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<Role, User> = {
  doctor: { id: "U001", name: "Dr. Sharma", email: "doctor@medicrm.com", role: "doctor" },
  receptionist: { id: "U002", name: "Nisha Verma", email: "reception@medicrm.com", role: "receptionist" },
  staff: { id: "U003", name: "Ravi Kumar", email: "staff@medicrm.com", role: "staff" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("medicrm_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("medicrm_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (_email: string, _password: string, role: Role) => {
    await new Promise((r) => setTimeout(r, 800));
    const loggedUser = mockUsers[role];
    setUser(loggedUser);
    localStorage.setItem("medicrm_user", JSON.stringify(loggedUser));
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: Role) => {
    await new Promise((r) => setTimeout(r, 1000));
    const newUser: User = {
      id: `U${Date.now()}`,
      name,
      email,
      role,
    };
    setUser(newUser);
    localStorage.setItem("medicrm_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("medicrm_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
