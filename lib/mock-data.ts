import {
  Patient, Appointment, Prescription, FollowUp,
  MedicalRep, InventoryItem, ActivityItem, Notification, MRVisit
} from "./types";

export const mockPatients: Patient[] = [
  { id: "P001", name: "Aarav Mehta", age: 34, gender: "Male", phone: "+91 98765 43210", email: "aarav@email.com", bloodGroup: "B+", lastVisit: "2026-03-01", doctor: "Dr. Sharma", status: "Active", createdAt: "2025-11-15" },
  { id: "P002", name: "Priya Iyer", age: 28, gender: "Female", phone: "+91 87654 32109", email: "priya.i@email.com", bloodGroup: "O+", lastVisit: "2026-02-28", doctor: "Dr. Sharma", status: "Follow-up Due", createdAt: "2025-09-20" },
  { id: "P003", name: "Rohan Das", age: 45, gender: "Male", phone: "+91 76543 21098", bloodGroup: "A-", lastVisit: "2026-02-15", doctor: "Dr. Patel", status: "Active", createdAt: "2025-08-10" },
  { id: "P004", name: "Sneha Kulkarni", age: 52, gender: "Female", phone: "+91 65432 10987", email: "sneha.k@email.com", bloodGroup: "AB+", lastVisit: "2026-01-20", doctor: "Dr. Sharma", status: "Follow-up Due", createdAt: "2025-06-01" },
  { id: "P005", name: "Vikram Singh", age: 38, gender: "Male", phone: "+91 54321 09876", bloodGroup: "B-", lastVisit: "2026-03-04", doctor: "Dr. Patel", status: "Active", createdAt: "2026-01-05" },
  { id: "P006", name: "Anjali Deshmukh", age: 29, gender: "Female", phone: "+91 43210 98765", email: "anjali.d@email.com", bloodGroup: "O-", lastVisit: "2026-03-05", doctor: "Dr. Sharma", status: "New", createdAt: "2026-03-05" },
  { id: "P007", name: "Karan Malhotra", age: 61, gender: "Male", phone: "+91 32109 87654", bloodGroup: "A+", lastVisit: "2026-02-20", doctor: "Dr. Patel", status: "Active", createdAt: "2025-05-12" },
  { id: "P008", name: "Meera Joshi", age: 41, gender: "Female", phone: "+91 21098 76543", email: "meera.j@email.com", bloodGroup: "B+", lastVisit: "2026-02-10", doctor: "Dr. Sharma", status: "Follow-up Due", createdAt: "2025-07-22" },
];

export const mockAppointments: Appointment[] = [
  { id: "A001", patientId: "P001", patientName: "Aarav Mehta", patientAge: 34, doctorName: "Dr. Sharma", date: "2026-03-05", time: "09:00", type: "General", status: "Scheduled" },
  { id: "A002", patientId: "P002", patientName: "Priya Iyer", patientAge: 28, doctorName: "Dr. Sharma", date: "2026-03-05", time: "09:30", type: "Follow-up", status: "Scheduled" },
  { id: "A003", patientId: "P005", patientName: "Vikram Singh", patientAge: 38, doctorName: "Dr. Patel", date: "2026-03-05", time: "10:00", type: "General", status: "Completed" },
  { id: "A004", patientId: "P006", patientName: "Anjali Deshmukh", patientAge: 29, doctorName: "Dr. Sharma", date: "2026-03-05", time: "10:30", type: "General", status: "Scheduled" },
  { id: "A005", patientId: "P003", patientName: "Rohan Das", patientAge: 45, doctorName: "Dr. Patel", date: "2026-03-05", time: "11:00", type: "Procedure", status: "Scheduled" },
  { id: "A006", patientId: "P007", patientName: "Karan Malhotra", patientAge: 61, doctorName: "Dr. Patel", date: "2026-03-04", time: "14:00", type: "Follow-up", status: "Completed" },
  { id: "A007", patientId: "P004", patientName: "Sneha Kulkarni", patientAge: 52, doctorName: "Dr. Sharma", date: "2026-03-04", time: "15:00", type: "General", status: "Cancelled" },
  { id: "A008", patientId: "P008", patientName: "Meera Joshi", patientAge: 41, doctorName: "Dr. Sharma", date: "2026-03-06", time: "09:00", type: "Follow-up", status: "Scheduled" },
];

export const mockPrescriptions: Prescription[] = [
  {
    id: "RX001", patientId: "P001", patientName: "Aarav Mehta", doctorName: "Dr. Sharma", date: "2026-03-01", diagnosis: "Acute Bronchitis",
    medications: [
      { id: "M1", drugName: "Amoxicillin", dosage: "500mg", frequency: "3 times daily", duration: "7 days", notes: "After meals" },
      { id: "M2", drugName: "Cetirizine", dosage: "10mg", frequency: "Once daily", duration: "5 days", notes: "At bedtime" },
    ],
    status: "Finalized"
  },
  {
    id: "RX002", patientId: "P002", patientName: "Priya Iyer", doctorName: "Dr. Sharma", date: "2026-02-28", diagnosis: "Migraine",
    medications: [
      { id: "M3", drugName: "Sumatriptan", dosage: "50mg", frequency: "As needed", duration: "PRN", notes: "Max 2 per day" },
      { id: "M4", drugName: "Paracetamol", dosage: "650mg", frequency: "Twice daily", duration: "3 days" },
    ],
    status: "Finalized"
  },
  {
    id: "RX003", patientId: "P005", patientName: "Vikram Singh", doctorName: "Dr. Patel", date: "2026-03-04", diagnosis: "Hypertension Management",
    medications: [
      { id: "M5", drugName: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "30 days", notes: "Morning" },
      { id: "M6", drugName: "Losartan", dosage: "50mg", frequency: "Once daily", duration: "30 days", notes: "Evening" },
    ],
    status: "Finalized"
  },
  {
    id: "RX004", patientId: "P006", patientName: "Anjali Deshmukh", doctorName: "Dr. Sharma", date: "2026-03-05", diagnosis: "Seasonal Allergies",
    medications: [
      { id: "M7", drugName: "Montelukast", dosage: "10mg", frequency: "Once daily", duration: "14 days" },
    ],
    status: "Draft"
  },
];

export const mockFollowUps: FollowUp[] = [
  { id: "F001", patientId: "P002", patientName: "Priya Iyer", lastVisit: "2026-02-28", followUpDate: "2026-03-05", reason: "Migraine follow-up - check medication efficacy", status: "Today", doctorName: "Dr. Sharma" },
  { id: "F002", patientId: "P004", patientName: "Sneha Kulkarni", lastVisit: "2026-01-20", followUpDate: "2026-03-01", reason: "Post-procedure wound assessment", status: "Overdue", doctorName: "Dr. Sharma" },
  { id: "F003", patientId: "P008", patientName: "Meera Joshi", lastVisit: "2026-02-10", followUpDate: "2026-03-06", reason: "Blood work results review", status: "Upcoming", doctorName: "Dr. Sharma" },
  { id: "F004", patientId: "P003", patientName: "Rohan Das", lastVisit: "2026-02-15", followUpDate: "2026-03-03", reason: "Diabetes management review", status: "Overdue", doctorName: "Dr. Patel" },
  { id: "F005", patientId: "P007", patientName: "Karan Malhotra", lastVisit: "2026-02-20", followUpDate: "2026-03-10", reason: "Cardiac evaluation follow-up", status: "Upcoming", doctorName: "Dr. Patel" },
];

export const mockMedicalReps: MedicalRep[] = [
  { id: "MR001", name: "Rajesh Kumar", company: "Sun Pharma", phone: "+91 99887 76655", email: "rajesh@sunpharma.com", lastVisit: "2026-03-03", products: [
    { id: "MP1", name: "Azithromycin 500mg", category: "Antibiotics", notes: "New formulation" },
    { id: "MP2", name: "Pantoprazole 40mg", category: "Gastrointestinal" },
  ]},
  { id: "MR002", name: "Deepika Nair", company: "Cipla Ltd", phone: "+91 88776 65544", email: "deepika@cipla.com", lastVisit: "2026-02-25", products: [
    { id: "MP3", name: "Montelukast 10mg", category: "Respiratory" },
    { id: "MP4", name: "Cetirizine 10mg", category: "Antihistamine" },
    { id: "MP5", name: "Fluticasone Inhaler", category: "Respiratory" },
  ]},
  { id: "MR003", name: "Amit Trivedi", company: "Dr. Reddy's", phone: "+91 77665 54433", lastVisit: "2026-02-18", products: [
    { id: "MP6", name: "Amlodipine 5mg", category: "Cardiovascular" },
    { id: "MP7", name: "Metformin 500mg", category: "Diabetes" },
  ]},
];

export const mockMRVisits: MRVisit[] = [
  { id: "MV001", repId: "MR001", repName: "Rajesh Kumar", date: "2026-03-03", time: "14:00", purpose: "Product Presentation", products: ["Azithromycin 500mg"], notes: "Presented new formulation with improved bioavailability", duration: "30 min" },
  { id: "MV002", repId: "MR002", repName: "Deepika Nair", date: "2026-02-25", time: "11:00", purpose: "Sample Drop", products: ["Fluticasone Inhaler", "Montelukast 10mg"], notes: "Left 20 samples of each", duration: "15 min" },
  { id: "MV003", repId: "MR001", repName: "Rajesh Kumar", date: "2026-02-15", time: "10:00", purpose: "Follow-up", products: ["Pantoprazole 40mg"], notes: "Checking feedback on prescribed samples", duration: "20 min" },
];

export const mockInventory: InventoryItem[] = [
  { id: "I001", name: "Amoxicillin 500mg", category: "Medicines", currentStock: 250, unit: "Tablets", threshold: 100, status: "In Stock", lastUpdated: "2026-03-04" },
  { id: "I002", name: "Paracetamol 650mg", category: "Medicines", currentStock: 45, unit: "Tablets", threshold: 100, status: "Low Stock", lastUpdated: "2026-03-03" },
  { id: "I003", name: "Surgical Gloves (M)", category: "Consumables", currentStock: 200, unit: "Pairs", threshold: 50, status: "In Stock", lastUpdated: "2026-03-01" },
  { id: "I004", name: "Digital Thermometer", category: "Equipment", currentStock: 5, unit: "Units", threshold: 3, status: "In Stock", lastUpdated: "2026-02-20" },
  { id: "I005", name: "Cetirizine 10mg", category: "Medicines", currentStock: 0, unit: "Tablets", threshold: 50, status: "Out of Stock", lastUpdated: "2026-03-05" },
  { id: "I006", name: "Azithromycin 500mg (Samples)", category: "Samples", currentStock: 30, unit: "Tablets", threshold: 10, status: "In Stock", lastUpdated: "2026-03-03" },
  { id: "I007", name: "Blood Pressure Monitor", category: "Equipment", currentStock: 2, unit: "Units", threshold: 2, status: "Low Stock", lastUpdated: "2026-02-28" },
  { id: "I008", name: "Disposable Syringes", category: "Consumables", currentStock: 15, unit: "Units", threshold: 50, status: "Low Stock", lastUpdated: "2026-03-04" },
];

export const mockActivity: ActivityItem[] = [
  { id: "AC1", type: "appointment", action: "completed", description: "Vikram Singh's appointment completed", timestamp: "2026-03-05T10:45:00" },
  { id: "AC2", type: "patient", action: "registered", description: "New patient Anjali Deshmukh registered", timestamp: "2026-03-05T10:15:00" },
  { id: "AC3", type: "prescription", action: "created", description: "Prescription created for Anjali Deshmukh", timestamp: "2026-03-05T10:30:00" },
  { id: "AC4", type: "inventory", action: "alert", description: "Paracetamol 650mg stock is low", timestamp: "2026-03-05T09:00:00" },
  { id: "AC5", type: "followup", action: "overdue", description: "Sneha Kulkarni follow-up overdue", timestamp: "2026-03-05T08:00:00" },
  { id: "AC6", type: "appointment", action: "booked", description: "Meera Joshi booked for Mar 6", timestamp: "2026-03-04T16:00:00" },
];

export const mockNotifications: Notification[] = [
  { id: "N1", title: "Appointment Reminder", message: "Aarav Mehta's appointment at 9:00 AM", type: "info", read: false, timestamp: "2026-03-05T08:30:00" },
  { id: "N2", title: "Follow-up Overdue", message: "Sneha Kulkarni's follow-up was due on Mar 1", type: "warning", read: false, timestamp: "2026-03-05T08:00:00" },
  { id: "N3", title: "Low Stock Alert", message: "Paracetamol 650mg below threshold", type: "error", read: false, timestamp: "2026-03-05T09:00:00" },
  { id: "N4", title: "New Booking", message: "Meera Joshi booked for March 6", type: "success", read: true, timestamp: "2026-03-04T16:00:00" },
];
