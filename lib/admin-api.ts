import { getToken } from "./api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function adminRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message || "Request failed", res.status);
  return json.data as T;
}

// ── Types ────────────────────────────────────────────────

export interface PlanCountItem {
  name: string;
  count: number;
  monthlyPriceCents: number;
  monthlyPriceUsd: number;
  contribution: number;
}

export interface DashboardStats {
  totalOrgs: number;
  proOrgs: number;
  freeOrgs: number;
  suspendedOrgs: number;
  totalUsers: number;
  totalClinics: number;
  totalPatients: number;
  mrr: number;
  planCounts?: Record<string, PlanCountItem>;
}

export interface OrgListItem {
  id: string;
  name: string;
  owner_email: string;
  phone: string | null;
  plan: string;
  plan_status: "active" | "suspended" | "cancelled";
  plan_activated_at: string | null;
  branch_count: number;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrgBranch {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  is_active: number;
  created_at: string;
}

export interface OrgUser {
  id: string;
  full_name: string;
  email: string;
  is_active: number;
  created_at: string;
  branches: { role: string; clinic_id: string; clinic_name: string }[];
}

export interface OrgPayment {
  id: string;
  organization_id: string;
  plan: string;
  amount_usd: number;
  status: string;
  mock_receipt: string | null;
  activated_at: string;
}

export interface OrgDetail extends OrgListItem {
  address: string | null;
  mock_customer_id: string | null;
  clinics: OrgBranch[];
  users: OrgUser[];
  payments: OrgPayment[];
  totalPatients: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── API functions ────────────────────────────────────────

export const adminApi = {
  getDashboard: () => adminRequest<DashboardStats>("/admin/dashboard"),

  getOrganizations: (params?: { search?: string; plan?: string; status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.plan) query.set("plan", params.plan);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return adminRequest<PaginatedResponse<OrgListItem>>(`/admin/organizations${qs ? `?${qs}` : ""}`);
  },

  getOrganization: (id: string) =>
    adminRequest<OrgDetail>(`/admin/organizations/${id}`),

  updateOrgPlan: (id: string, plan: string) =>
    adminRequest(`/admin/organizations/${id}/plan`, {
      method: "PUT",
      body: JSON.stringify({ plan }),
    }),

  updateStatus: (id: string, status: "active" | "suspended") =>
    adminRequest(`/admin/organizations/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // Plans
  getPlans: () => adminRequest<AdminPlanListItem[]>("/admin/plans"),
  getPlan: (id: string) => adminRequest<AdminPlanDetail>(`/admin/plans/${id}`),
  createPlan: (data: AdminPlanCreate) =>
    adminRequest<AdminPlanDetail>("/admin/plans", { method: "POST", body: JSON.stringify(data) }),
  updatePlan: (id: string, data: Partial<AdminPlanCreate>) =>
    adminRequest<AdminPlanDetail>(`/admin/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  duplicatePlan: (id: string) =>
    adminRequest<AdminPlanDetail>(`/admin/plans/${id}/duplicate`, { method: "POST" }),
  deletePlan: (id: string) =>
    adminRequest(`/admin/plans/${id}`, { method: "DELETE" }),
};

export interface AdminPlanListItem {
  id: string;
  name: string;
  slug: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  annualDiscountPercent: number;
  tagline: string | null;
  featureBullets: string[];
  isPopular: boolean;
  showOnLanding: boolean;
  displayOrder: number;
  status: string;
  orgCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPlanDetail extends AdminPlanListItem {
  modules: Record<string, boolean>;
  limits: Record<string, number>;
}

export interface AdminPlanCreate {
  name: string;
  slug?: string;
  monthlyPriceCents?: number;
  annualDiscountPercent?: number;
  tagline?: string;
  featureBullets?: string[];
  isPopular?: boolean;
  showOnLanding?: boolean;
  displayOrder?: number;
  status?: string;
  modules?: Record<string, boolean>;
  limits?: Record<string, number>;
}
