export type Role = "org_admin" | "receptionist";
export type Tier = "platform" | "app";

export interface Clinic {
  id: string;
  name: string;
  plan: string;
  planModules?: Record<string, boolean>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  clinic?: Clinic;
}

export interface Branch {
  clinicId: string;
  clinicName: string;
  city?: string;
  role: Role;
}

export interface Patient {
  id: string;
  name: string;
  patientCode?: string;
  age?: number;
  dateOfBirth?: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  lastVisit?: string;
  doctor?: string;
  status: "Active" | "Follow-up Due" | "New" | "Inactive";
  createdAt: string;
  fileId?: string;
  fileNumber?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientCode?: string;
  patientAge?: number;
  doctorId?: string;
  doctorName: string;
  date: string;
  time: string;
  type: "General" | "Follow-up" | "Procedure" | "Emergency";
  status: "Scheduled" | "Completed" | "Cancelled" | "No-show";
  reason?: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  status: "Draft" | "Finalized";
  followup_required?: boolean;
  followup_date?: string;
  followup_time?: string;
  followup_notes?: string;
}

export interface Medication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  lastVisit: string;
  followUpDate: string;
  reason: string;
  status: "Overdue" | "Today" | "Upcoming" | "Completed";
  doctorName: string;
}

export interface MedicalRep {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  territory?: string;
  lastVisit?: string;
  products: MRProduct[];
}

export interface MRProduct {
  id: string;
  name: string;
  category: string;
  notes?: string;
}

export interface MRVisit {
  id: string;
  repId: string;
  repName: string;
  date: string;
  time: string;
  purpose: "Product Presentation" | "Sample Drop" | "Follow-up" | "Other";
  products: string[];
  notes?: string;
  duration?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category: "Medicines" | "Equipment" | "Consumables" | "Samples" | "Other";
  currentStock: number;
  unit: string;
  threshold: number;
  unitPrice?: number;
  supplier?: string;
  expiryDate?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: "Stock In" | "Stock Out";
  quantity: number;
  date: string;
  notes?: string;
  previousBalance: number;
  newBalance: number;
}

export interface ActivityItem {
  id: string;
  type: "appointment" | "patient" | "prescription" | "inventory" | "followup";
  action: string;
  description: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  title: string;
  content: string;
  createdByName?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  invoiceNumber?: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  description?: string;
  invoiceDate: string;
  dueDate?: string;
  createdAt: string;
}

export interface ExternalLab {
  id: string;
  name: string;
  type: "lab" | "diagnostic" | "imaging" | "pathology" | "other";
  contactPerson?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  notes?: string;
  isActive: boolean;
  referralCount: number;
  createdAt: string;
}

export type ReferralUrgency = "routine" | "urgent" | "emergency";
export type ReferralStatus = "pending" | "sent" | "appointment_confirmed" | "sample_collected" | "results_received" | "cancelled";

export interface ReferralTest {
  id: string;
  testName: string;
  testCode?: string;
  instructions?: string;
  sortOrder: number;
}

export interface ReferralCommunication {
  id: string;
  channel: "email" | "whatsapp" | "print";
  sentTo?: string;
  sentByName?: string;
  status: "sent" | "failed" | "delivered";
  errorMessage?: string;
  sentAt: string;
}

export interface LabReferral {
  id: string;
  patientId: string;
  patientName: string;
  patientCode?: string;
  labId: string;
  labName: string;
  labType: string;
  labEmail?: string;
  labPhone?: string;
  labWhatsapp?: string;
  labContact?: string;
  referredBy: string;
  doctorName: string;
  referenceNumber: string;
  referralDate: string;
  urgency: ReferralUrgency;
  clinicalNotes?: string;
  specialInstructions?: string;
  status: ReferralStatus;
  letterPath?: string;
  letterGeneratedAt?: string;
  emailSentAt?: string;
  emailSentTo?: string;
  whatsappSentAt?: string;
  whatsappSentTo?: string;
  tests: ReferralTest[];
  communications: ReferralCommunication[];
  createdAt: string;
}

export interface PatientReport {
  id: string;
  clinicId: string;
  patientId: string;
  fileId: string;
  reportName: string;
  reportType: "lab_report" | "xray" | "scan" | "ecg" | "insurance" | "other";
  filePath: string;
  fileName: string;
  fileType?: string;
  fileSizeKb?: number;
  reportDate?: string;
  notes?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  createdAt: string;
}
