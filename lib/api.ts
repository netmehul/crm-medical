import type {
  Patient, Appointment, Prescription, Medication,
  InventoryItem, MedicalRep, MRVisit, PatientNote, Invoice,
  ExternalLab, LabReferral, ReferralTest, ReferralCommunication,
  PatientReport, Supplier, SupplierVisit, Notification
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const TOKEN_KEY = "medicrm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    throw new ApiError(json.message || "Request failed", res.status);
  }

  return json.data as T;
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Mappers: backend snake_case → frontend camelCase ────────────────

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function mapPatient(r: Record<string, unknown>): Patient {
  const status: Patient["status"] =
    r.file_status === "inactive" ? "Inactive" :
      r.next_followup_at ? "Follow-up Due" : "Active";

  return {
    id: r.id as string,
    name: r.full_name as string,
    patientCode: r.patient_code as string | undefined,
    age: r.age as number | undefined,
    dateOfBirth: r.date_of_birth as string | undefined,
    gender: capitalize(r.gender as string || "other") as Patient["gender"],
    phone: r.phone as string || "",
    email: r.email as string | undefined,
    address: r.address as string | undefined,
    bloodGroup: r.blood_group as string | undefined,
    lastVisit: r.last_visit_at as string | undefined,
    doctor: r.assigned_doctor_name as string | undefined,
    status,
    createdAt: r.created_at as string,
    fileId: r.file_id as string | undefined,
    fileNumber: r.file_number as string | undefined,
  };
}

function mapAppointment(r: Record<string, unknown>): Appointment {
  const dateStr = (r.scheduled_at || r.appointment_date || "") as string;
  let date = "";
  let time = r.time as string || "";

  if (dateStr) {
    if (dateStr.includes(" ")) {
      const parts = dateStr.split(" ");
      date = parts[0];
      if (!time) time = parts[1].substring(0, 5);
    } else if (dateStr.includes("T")) {
      const parts = dateStr.split("T");
      date = parts[0];
      if (!time) time = parts[1].substring(0, 5);
    } else {
      date = dateStr;
    }
  }

  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string || "",
    patientCode: r.patient_code as string | undefined,
    doctorId: r.doctor_id as string | undefined,
    doctorName: r.doctor_name as string || "",
    date: date || todayStr(),
    time: (time && !time.includes("und")) ? time.substring(0, 5) : "10:00",
    type: capitalize(((r.type as string) || "general").replace(/_/g, "-")) as Appointment["type"],
    status: capitalize((r.status as string) || "scheduled") as Appointment["status"],
    reason: r.reason as string | undefined,
    notes: r.notes as string | undefined,
  };
}

function mapPrescription(r: Record<string, unknown>): Prescription {
  const meds = (r.medications as Record<string, unknown>[] || []).map(mapMedication);
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string || "",
    doctorName: r.doctor_name as string || "",
    date: (r.prescription_date || r.visit_date || r.created_at || "") as string,
    diagnosis: (r.diagnosis || "") as string,
    medications: meds,
    notes: r.notes as string | undefined,
    status: capitalize((r.status as string) || "finalized") as Prescription["status"],
  };
}

function mapMedication(r: Record<string, unknown>): Medication {
  return {
    id: r.id as string,
    drugName: (r.medicine_name || r.drug_name || "") as string,
    dosage: (r.dosage || "") as string,
    frequency: (r.frequency || "") as string,
    duration: (r.duration || "") as string,
    notes: r.instructions as string | undefined,
  };
}

function mapInventoryItem(r: Record<string, unknown>): InventoryItem {
  const qty = r.quantity != null ? Number(r.quantity) : 0;
  const threshold = r.reorder_level != null ? Number(r.reorder_level) : (r.low_stock_threshold != null ? Number(r.low_stock_threshold) : 10);
  const status: InventoryItem["status"] =
    qty === 0 ? "Out of Stock" : qty <= threshold ? "Low Stock" : "In Stock";

  const catMap: Record<string, InventoryItem["category"]> = {
    medicine: "Medicines", equipment: "Equipment",
    consumable: "Consumables", sample: "Samples", other: "Other",
  };

  return {
    id: r.id as string,
    name: r.item_name as string,
    sku: r.sku as string | undefined,
    category: catMap[(r.category as string) || "other"] || "Other",
    currentStock: qty,
    unit: (r.unit || "") as string,
    threshold,
    unitPrice: r.cost_per_unit_cents != null ? Number(r.cost_per_unit_cents) : undefined,
    sellingPriceCents: r.selling_price_cents != null ? Number(r.selling_price_cents) : 0,
    supplier: r.supplier_name as string || r.supplier as string | undefined,
    supplierId: r.supplier_id as string | undefined,
    costPerUnitCents: r.cost_per_unit_cents != null ? Number(r.cost_per_unit_cents) : undefined,
    expiryDate: r.expiry_date as string | undefined,
    status,
    lastUpdated: (r.updated_at || r.created_at || "") as string,
    split: r.split as InventoryItem["split"],
  };
}

function mapMedicalRep(r: Record<string, unknown>): MedicalRep {
  return {
    id: r.id as string,
    name: r.full_name as string,
    company: (r.company || "") as string,
    phone: (r.phone || "") as string,
    email: r.email as string | undefined,
    territory: r.territory as string | undefined,
    lastVisit: r.last_visit as string | undefined,
    products: [],
  };
}

function mapMRVisit(r: Record<string, unknown>): MRVisit {
  const purposeMap: Record<string, MRVisit["purpose"]> = {
    product_presentation: "Product Presentation",
    sample_drop: "Sample Drop",
    follow_up: "Follow-up",
    other: "Other",
  };
  return {
    id: r.id as string,
    repId: r.mr_id as string,
    repName: r.logged_by_name as string || "",
    date: (r.visit_date || "") as string,
    time: "",
    purpose: purposeMap[(r.purpose as string) || "other"] || "Other",
    products: r.products_discussed ? [(r.products_discussed as string)] : [],
    notes: r.notes as string | undefined,
  };
}

function mapSupplier(r: Record<string, unknown>): Supplier {
  return {
    id: r.id as string,
    name: r.name as string,
    contactPerson: r.contact_person as string | undefined,
    phone: r.phone as string | undefined,
    email: r.email as string | undefined,
    address: r.address as string | undefined,
    notes: r.notes as string | undefined,
    isActive: r.is_active === 1 || r.is_active === true,
    totalBilledCents: r.total_billed_cents != null ? Number(r.total_billed_cents) : undefined,
    pendingBalanceCents: r.pending_balance_cents != null ? Number(r.pending_balance_cents) : undefined,
    overdueBalanceCents: r.overdue_balance_cents != null ? Number(r.overdue_balance_cents) : undefined,
    totalPaidCents: r.total_paid_cents != null ? Number(r.total_paid_cents) : undefined,
    lastVisitDate: r.last_visit_date as string | undefined,
  };
}

function mapSupplierVisit(r: Record<string, unknown>): SupplierVisit {
  return {
    id: r.id as string,
    supplierId: r.supplier_id as string,
    visitDate: r.visit_date as string,
    repName: r.rep_name as string | undefined,
    repPhone: r.rep_phone as string | undefined,
    purpose: r.purpose as SupplierVisit["purpose"],
    notes: r.notes as string | undefined,
    loggedBy: r.logged_by as string | undefined,
  };
}

function mapNotification(r: Record<string, unknown>): Notification {
  return {
    id: r.id as string,
    title: r.title as string,
    message: r.message as string,
    type: r.type as Notification["type"],
    isRead: r.is_read === 1 || r.is_read === true,
    readAt: r.read_at as string | undefined,
    dueDate: r.due_date as string | undefined,
    referenceId: r.reference_id as string | undefined,
    referenceType: r.reference_type as string | undefined,
    createdAt: r.created_at as string,
  };
}

function mapNote(r: Record<string, unknown>): PatientNote {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    title: (r.title || "") as string,
    content: (r.content || "") as string,
    createdByName: r.created_by_name as string | undefined,
    createdAt: (r.created_at || "") as string,
  };
}

function mapInvoice(r: Record<string, unknown>): Invoice {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    invoiceNumber: r.invoice_number as string | undefined,
    totalAmount: r.total_amount != null ? Number(r.total_amount) : 0,
    paidAmount: r.paid_amount != null ? Number(r.paid_amount) : 0,
    paymentStatus: (r.payment_status || "draft") as string,
    description: r.description as string | undefined,
    invoiceDate: (r.invoice_date || "") as string,
    dueDate: r.due_date as string | undefined,
    createdAt: (r.created_at || "") as string,
  };
}

function mapReport(r: Record<string, unknown>): PatientReport {
  return {
    id: r.id as string,
    clinicId: r.clinic_id as string,
    patientId: r.patient_id as string,
    fileId: r.file_id as string,
    reportName: r.report_name as string,
    reportType: (r.report_type || "other") as PatientReport["reportType"],
    filePath: r.file_path as string,
    fileName: r.file_name as string,
    fileType: r.file_type as string | undefined,
    fileSizeKb: r.file_size_kb as number | undefined,
    reportDate: r.report_date as string | undefined,
    notes: r.notes as string | undefined,
    uploadedBy: r.uploaded_by as string | undefined,
    uploadedByName: r.uploaded_by_name as string | undefined,
    createdAt: r.created_at as string,
  };
}

// ─── Paginated response helper ──────────────────────────────────────

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
}

function mapPaginated<T>(
  data: { items: Record<string, unknown>[]; pagination: Record<string, unknown> },
  mapper: (r: Record<string, unknown>) => T
): PaginatedResult<T> {
  return {
    items: (data.items || []).map(mapper),
    total: (data.pagination?.total ?? 0) as number,
    page: (data.pagination?.page ?? 1) as number,
    totalPages: (data.pagination?.totalPages ?? 1) as number,
    hasNext: (data.pagination?.hasNext ?? false) as boolean,
  };
}

// ─── Auth API ────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{
      tier: string; token: string; redirect: string;
      user: Record<string, unknown>;
      clinic?: Record<string, unknown>;
      branches?: Record<string, unknown>[];
    }>(
      "/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  signup: (data: { org_name: string; clinic_name: string; full_name: string; email: string; password: string }) =>
    request<{ token: string; user: Record<string, unknown>; clinic: Record<string, unknown> }>(
      "/auth/signup", { method: "POST", body: JSON.stringify(data) }
    ),

  branchSelect: (clinicId: string) =>
    request<{ token: string; user: Record<string, unknown>; clinic: Record<string, unknown> }>(
      "/auth/branch-select", { method: "POST", body: JSON.stringify({ clinicId }) }
    ),

  me: () =>
    request<{ user: Record<string, unknown>; clinic: Record<string, unknown> }>("/auth/me"),

  invite: (data: { email: string; full_name: string; password: string; role: string; clinic_ids?: string[] }) =>
    request<Record<string, unknown>>("/auth/invite", { method: "POST", body: JSON.stringify(data) }),
};

// ─── Patients API ────────────────────────────────────────────────────

export const patientsApi = {
  list: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/patients${qs(params)}`
    );
    return mapPaginated(data, mapPatient);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/patients/${id}`);
    return mapPatient(data);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/patients", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapPatient(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/patients/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapPatient(data);
  },

  delete: (id: string) =>
    request(`/patients/${id}`, { method: "DELETE" }),
};

// ─── Appointments API ────────────────────────────────────────────────

export const appointmentsApi = {
  list: async (params: { page?: number; limit?: number; date?: string; status?: string; doctor_id?: string; patient_id?: string } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/appointments${qs(params)}`
    );
    return mapPaginated(data, mapAppointment);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/appointments/${id}`);
    return mapAppointment(data);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/appointments", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapAppointment(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/appointments/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapAppointment(data);
  },

  delete: (id: string) =>
    request(`/appointments/${id}`, { method: "DELETE" }),
};

// ─── Prescriptions API ──────────────────────────────────────────────

export const prescriptionsApi = {
  list: async (params: { page?: number; limit?: number } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/prescriptions${qs(params)}`
    );
    return mapPaginated(data, mapPrescription);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/prescriptions/${id}`);
    return mapPrescription(data);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/prescriptions", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapPrescription(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/prescriptions/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapPrescription(data);
  },

  delete: (id: string) =>
    request(`/prescriptions/${id}`, { method: "DELETE" }),
};

// ─── Inventory API ──────────────────────────────────────────────────

export const inventoryApi = {
  list: async (params: { page?: number; limit?: number; search?: string; category?: string } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/inventory${qs(params)}`
    );
    return mapPaginated(data, mapInventoryItem);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/inventory/${id}`);
    return mapInventoryItem(data);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/inventory", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapInventoryItem(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/inventory/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapInventoryItem(data);
  },

  delete: (id: string) =>
    request(`/inventory/${id}`, { method: "DELETE" }),

  stockTransaction: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/inventory/${id}/stock`, {
      method: "POST", body: JSON.stringify(body),
    });
    return mapInventoryItem(data);
  },

  lowStock: async () => {
    const data = await request<Record<string, unknown>[]>("/inventory/low-stock");
    return (data || []).map(mapInventoryItem);
  },

  getPaymentSummary: async () => {
    return await request<Record<string, number>>("/inventory/payment-summary");
  },

  getSupplierReport: async () => {
    const data = await request<Record<string, unknown>[]>("/inventory/supplier-report");
    return data.map(mapSupplier);
  },

  markAsPaid: (id: string, body: { paid_amount_cents: number; notes?: string }) =>
    request(`/inventory/transactions/${id}/pay`, { method: "PUT", body: JSON.stringify(body) }),
};

// ─── Suppliers API ─────────────────────────────────────────────────

export const suppliersApi = {
  list: async () => {
    const data = await request<Record<string, unknown>>("/suppliers");
    const rows = (data?.rows as Record<string, unknown>[]) || (Array.isArray(data) ? data : []);
    return rows.map(mapSupplier);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/suppliers", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapSupplier(data);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/suppliers/${id}`);
    return mapSupplier(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/suppliers/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapSupplier(data);
  },

  delete: (id: string) =>
    request(`/suppliers/${id}`, { method: "DELETE" }),

  logVisit: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/suppliers/${id}/visits`, {
      method: "POST", body: JSON.stringify(body),
    });
    return mapSupplierVisit(data);
  },

  getVisits: async (id: string) => {
    const data = await request<Record<string, unknown>[]>(`/suppliers/${id}/visits`);
    return data.map(mapSupplierVisit);
  },

  getBalance: async (id: string) => {
    return await request<Record<string, number>>(`/suppliers/${id}/balance`);
  },
};

// ─── Notifications API ─────────────────────────────────────────────

export const notificationsApi = {
  list: async () => {
    const data = await request<Record<string, unknown>>("/notifications");
    const rows = (data?.rows as Record<string, unknown>[]) || (Array.isArray(data) ? data : []);
    return rows.map(mapNotification);
  },

  getUnreadCount: async () => {
    const data = await request<{ unread_count: number }>("/notifications/unread-count");
    return data.unread_count;
  },

  markRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: "PUT" }),

  markAllRead: () =>
    request("/notifications/read-all", { method: "PUT" }),
};

// ─── Medical Reps API ───────────────────────────────────────────────

export const medicalRepsApi = {
  list: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/medical-reps${qs(params)}`
    );
    return mapPaginated(data, mapMedicalRep);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/medical-reps/${id}`);
    return mapMedicalRep(data);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/medical-reps", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapMedicalRep(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/medical-reps/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapMedicalRep(data);
  },

  delete: (id: string) =>
    request(`/medical-reps/${id}`, { method: "DELETE" }),

  logVisit: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/medical-reps/${id}/visits`, {
      method: "POST", body: JSON.stringify(body),
    });
    return data;
  },

  getVisits: async (id: string, params: { page?: number; limit?: number } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/medical-reps/${id}/visits${qs(params)}`
    );
    return mapPaginated(data, mapMRVisit);
  },
};

// ─── Patient Files API ──────────────────────────────────────────────

export const patientFilesApi = {
  getNotes: async (patientId: string, params: { page?: number; limit?: number } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/patient-files/${patientId}/notes${qs(params)}`
    );
    return mapPaginated(data, mapNote);
  },

  addNote: async (patientId: string, body: { title: string; content?: string }) => {
    const data = await request<Record<string, unknown>>(`/patient-files/${patientId}/notes`, {
      method: "POST", body: JSON.stringify(body),
    });
    return mapNote(data);
  },

  updateNote: async (patientId: string, noteId: string, body: { title?: string; content?: string }) => {
    const data = await request<Record<string, unknown>>(`/patient-files/${patientId}/notes/${noteId}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapNote(data);
  },

  deleteNote: (patientId: string, noteId: string) =>
    request(`/patient-files/${patientId}/notes/${noteId}`, { method: "DELETE" }),
  getReports: async (patientId: string, params: { page?: number; limit?: number } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/patient-files/${patientId}/reports${qs(params)}`
    );
    return mapPaginated(data, mapReport);
  },
  uploadReport: async (patientId: string, formData: FormData) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/patient-files/${patientId}/reports`, {
      method: "POST",
      headers,
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new ApiError(json.message || "Upload failed", res.status);
    }
    return mapReport(json.data);
  },
  deleteReport: (patientId: string, reportId: string) =>
    request(`/patient-files/${patientId}/reports/${reportId}`, { method: "DELETE" }),

  getBilling: async (patientId: string, params: { page?: number; limit?: number } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/patient-files/${patientId}/billing${qs(params)}`
    );
    return mapPaginated(data, mapInvoice);
  },

  createInvoice: async (patientId: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/patient-files/${patientId}/billing`, {
      method: "POST", body: JSON.stringify(body),
    });
    return mapInvoice(data);
  },
};

// ─── Org Management API ─────────────────────────────────────────────

export interface OrgBranch {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  is_active: number;
  patient_count: number;
  staff_count: number;
  created_at: string;
  updated_at?: string;
}

export interface BranchStaff {
  id: string;
  full_name: string;
  email: string;
  is_active: number;
  role: string;
  assigned_at: string;
}

export interface OrgBranchDetail extends OrgBranch {
  appointment_count: number;
  staff: BranchStaff[];
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  is_active: number;
  created_at: string;
  branches: { role: string; clinic_id: string; clinic_name: string }[];
}

export interface TeamMemberDetail extends TeamMember {
  updated_at: string;
  branches: {
    role: string;
    clinic_id: string;
    clinic_name: string;
    clinic_city: string | null;
    clinic_patients: number;
    membership_active: number;
    assigned_at: string;
  }[];
  stats: {
    total_appointments: number;
    total_prescriptions: number;
  };
}

export const orgApi = {
  getBranches: () =>
    request<OrgBranch[]>("/org/branches"),

  getBranch: (id: string) =>
    request<OrgBranchDetail>(`/org/branches/${id}`),

  createBranch: (data: { name: string; phone?: string; email?: string; address?: string; city?: string }) =>
    request<OrgBranch>("/org/branches", { method: "POST", body: JSON.stringify(data) }),

  updateBranch: (id: string, data: Record<string, unknown>) =>
    request<OrgBranch>(`/org/branches/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getTeam: () =>
    request<TeamMember[]>("/org/team"),

  getTeamMember: (userId: string) =>
    request<TeamMemberDetail>(`/org/team/${userId}`),

  inviteUser: (data: { full_name: string; email: string; password: string; role?: string; clinic_ids?: string[] }) =>
    request<{ id: string; full_name: string; email: string; role: string }>("/org/team/invite", {
      method: "POST", body: JSON.stringify(data),
    }),

  updateUser: (userId: string, data: Record<string, unknown>) =>
    request<{ id: string; updated: boolean }>(`/org/team/${userId}`, {
      method: "PUT", body: JSON.stringify(data),
    }),

  deactivateUser: (userId: string) =>
    request<{ id: string; deactivated: boolean }>(`/org/team/${userId}`, { method: "DELETE" }),

  getSubscription: () =>
    request<Record<string, unknown>>("/org/subscription"),
};

// ─── External Labs API ──────────────────────────────────────────────

function mapExternalLab(r: Record<string, unknown>): ExternalLab {
  return {
    id: r.id as string,
    name: r.name as string,
    type: (r.type || "lab") as ExternalLab["type"],
    contactPerson: r.contact_person as string | undefined,
    phone: r.phone as string | undefined,
    whatsappNumber: r.whatsapp_number as string | undefined,
    email: r.email as string | undefined,
    address: r.address as string | undefined,
    city: r.city as string | undefined,
    pincode: r.pincode as string | undefined,
    notes: r.notes as string | undefined,
    isActive: r.is_active === 1 || r.is_active === true,
    referralCount: (r.referral_count ?? 0) as number,
    createdAt: (r.created_at || "") as string,
  };
}

function mapReferralTest(r: Record<string, unknown>): ReferralTest {
  return {
    id: r.id as string,
    testName: (r.test_name || "") as string,
    testCode: r.test_code as string | undefined,
    instructions: r.instructions as string | undefined,
    sortOrder: (r.sort_order ?? 0) as number,
  };
}

function mapReferralCommunication(r: Record<string, unknown>): ReferralCommunication {
  return {
    id: r.id as string,
    channel: (r.channel || "email") as ReferralCommunication["channel"],
    sentTo: r.sent_to as string | undefined,
    sentByName: r.sent_by_name as string | undefined,
    status: (r.status || "sent") as ReferralCommunication["status"],
    errorMessage: r.error_message as string | undefined,
    sentAt: (r.sent_at || "") as string,
  };
}

function mapLabReferral(r: Record<string, unknown>): LabReferral {
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    patientName: (r.patient_name || "") as string,
    patientCode: r.patient_code as string | undefined,
    labId: r.lab_id as string,
    labName: (r.lab_name || "") as string,
    labType: (r.lab_type || "lab") as string,
    labEmail: r.lab_email as string | undefined,
    labPhone: r.lab_phone as string | undefined,
    labWhatsapp: r.lab_whatsapp as string | undefined,
    labContact: r.lab_contact as string | undefined,
    referredBy: r.referred_by as string,
    doctorName: (r.doctor_name || "") as string,
    referenceNumber: (r.reference_number || "") as string,
    referralDate: (r.referral_date || "") as string,
    urgency: (r.urgency || "routine") as LabReferral["urgency"],
    clinicalNotes: r.clinical_notes as string | undefined,
    specialInstructions: r.special_instructions as string | undefined,
    status: (r.status || "pending") as LabReferral["status"],
    letterPath: r.letter_path as string | undefined,
    letterGeneratedAt: r.letter_generated_at as string | undefined,
    emailSentAt: r.email_sent_at as string | undefined,
    emailSentTo: r.email_sent_to as string | undefined,
    whatsappSentAt: r.whatsapp_sent_at as string | undefined,
    whatsappSentTo: r.whatsapp_sent_to as string | undefined,
    tests: ((r.tests as Record<string, unknown>[]) || []).map(mapReferralTest),
    communications: ((r.communications as Record<string, unknown>[]) || []).map(mapReferralCommunication),
    createdAt: (r.created_at || "") as string,
  };
}

export const labsApi = {
  list: async (params: { page?: number; limit?: number; search?: string; type?: string } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/labs${qs(params)}`
    );
    return mapPaginated(data, mapExternalLab);
  },

  listActive: async () => {
    const data = await request<Record<string, unknown>[]>("/labs/active");
    return (data || []).map(mapExternalLab);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/labs/${id}`);
    return mapExternalLab(data);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/labs", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapExternalLab(data);
  },

  update: async (id: string, body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>(`/labs/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    });
    return mapExternalLab(data);
  },

  delete: (id: string) =>
    request(`/labs/${id}`, { method: "DELETE" }),
};

// ─── Referrals API ──────────────────────────────────────────────────

export const referralsApi = {
  list: async (params: { page?: number; limit?: number; patientId?: string; status?: string; labId?: string } = {}) => {
    const data = await request<{ items: Record<string, unknown>[]; pagination: Record<string, unknown> }>(
      `/referrals${qs(params)}`
    );
    return mapPaginated(data, mapLabReferral);
  },

  get: async (id: string) => {
    const data = await request<Record<string, unknown>>(`/referrals/${id}`);
    return mapLabReferral(data);
  },

  create: async (body: Record<string, unknown>) => {
    const data = await request<Record<string, unknown>>("/referrals", {
      method: "POST", body: JSON.stringify(body),
    });
    return mapLabReferral(data);
  },

  updateStatus: async (id: string, status: string) => {
    const data = await request<Record<string, unknown>>(`/referrals/${id}/status`, {
      method: "PATCH", body: JSON.stringify({ status }),
    });
    return mapLabReferral(data);
  },

  uploadLetter: async (id: string, formData: FormData) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/referrals/${id}/letter`, {
      method: "POST",
      headers,
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new ApiError(json.message || "Upload failed", res.status);
    }
    return mapLabReferral(json.data);
  },

  generateLetter: async (id: string) =>
    request<{ path: string; url: string }>(`/referrals/${id}/generate-letter`, { method: "POST" }),

  getLetterUrl: (id: string) =>
    `${BASE_URL}/referrals/${id}/letter`,

  send: async (id: string, body: { channels: string[]; emailOverride?: string; phoneOverride?: string }) =>
    request<Record<string, unknown>>(`/referrals/${id}/send`, {
      method: "POST", body: JSON.stringify(body),
    }),

  getCommunications: async (id: string) => {
    const data = await request<Record<string, unknown>[]>(`/referrals/${id}/communications`);
    return (data || []).map(mapReferralCommunication);
  },
};

// ─── Public API (no auth required) ───────────────────────────────────

export interface PublicPlan {
  id: string;
  name: string;
  slug: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  annualDiscountPercent?: number;
  tagline: string | null;
  featureBullets: string[];
  limits?: Record<string, number>;
  modules?: Record<string, boolean>;
  isPopular: boolean;
  displayOrder: number;
}

export const publicPlansApi = {
  getPlans: () =>
    request<PublicPlan[]>("/public/plans"),
};

// ─── Payments API ───────────────────────────────────────────────────

export const paymentsApi = {
  upgrade: (planSlug?: string) =>
    request("/payments/upgrade", {
      method: "POST",
      body: JSON.stringify(planSlug ? { plan: planSlug } : {}),
    }),

  history: () =>
    request<Record<string, unknown>[]>("/payments/history"),
};
