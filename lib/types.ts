export type Role = "doctor" | "receptionist" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  lastVisit?: string;
  doctor?: string;
  status: "Active" | "Follow-up Due" | "New" | "Inactive";
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  doctorName: string;
  date: string;
  time: string;
  type: "General" | "Follow-up" | "Procedure" | "Emergency";
  status: "Scheduled" | "Completed" | "Cancelled" | "No-show";
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
  category: "Medicines" | "Equipment" | "Consumables" | "Samples";
  currentStock: number;
  unit: string;
  threshold: number;
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
