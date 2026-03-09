/**
 * Module and limit registry — must match backend planRegistry.js
 */

export const MODULES = [
  { key: "patients", name: "Patients", group: "patients", description: "Patient records and profiles" },
  { key: "appointments", name: "Appointments", group: "patients", description: "Calendar and appointment scheduling" },
  { key: "prescriptions", name: "Prescriptions", group: "patients", description: "Prescription management" },
  { key: "follow_ups", name: "Follow-ups", group: "patients", description: "Follow-up tracking" },
  { key: "medical_reps", name: "Medical Reps", group: "operations", description: "Medical representative management" },
  { key: "inventory", name: "Inventory", group: "operations", description: "Stock management" },
  { key: "external_labs", name: "External Labs", group: "operations", description: "Lab referrals" },
  { key: "branches", name: "Branches", group: "management", description: "Multi-branch management" },
  { key: "team", name: "Team", group: "management", description: "Team and user management" },
  { key: "reportUploads", name: "Report Uploads", group: "features", description: "Upload patient reports (PDF, images)" },
  { key: "billing", name: "Billing", group: "features", description: "Billing and invoicing" },
  { key: "mrManagement", name: "MR Management", group: "features", description: "Medical rep management" },
  { key: "labCommunication", name: "Lab Communication", group: "features", description: "Email/WhatsApp send to labs" },
];

export const LIMIT_KEYS = [
  { key: "patients", label: "Max patients", description: "Maximum patients per clinic (-1 = unlimited)" },
  { key: "appointmentsPerMonth", label: "Appointments per month", description: "Monthly appointment limit" },
  { key: "seats", label: "Team seats", description: "Maximum team members per clinic" },
  { key: "referralsPerMonth", label: "Lab referrals per month", description: "Monthly lab referral limit" },
];

export const MODULE_GROUPS = {
  patients: "Patients",
  operations: "Operations",
  management: "Management",
  features: "Features",
};

const LIMIT_BULLET_LABELS: Record<string, string> = {
  patients: "patients",
  appointmentsPerMonth: "appointments/month",
  seats: "team members",
  referralsPerMonth: "lab referrals/month",
};

const BOOLEAN_DISPLAY_NAMES: Record<string, string> = {
  reportUploads: "Report uploads",
  billing: "Billing & invoicing",
  inventory: "Inventory management",
  mrManagement: "MR management",
  labCommunication: "Lab communication",
};

export function buildFeatureBullets(
  modules: Record<string, boolean>,
  limits: Record<string, number>
): string[] {
  const bullets: string[] = [];
  const added = new Set<string>();
  for (const m of MODULES) {
    if (modules[m.key]) {
      bullets.push(m.name);
      added.add(m.key);
    }
  }
  for (const k of Object.keys(BOOLEAN_DISPLAY_NAMES)) {
    if (modules[k] && !added.has(k)) bullets.push(BOOLEAN_DISPLAY_NAMES[k]);
  }
  for (const l of LIMIT_KEYS) {
    const val = limits[l.key];
    if (val === undefined) continue;
    const isUnlimited = val === -1 || val === Infinity;
    const label = LIMIT_BULLET_LABELS[l.key] || l.label;
    bullets.push(isUnlimited ? `Unlimited ${label}` : `Up to ${val} ${label}`);
  }
  return bullets;
}
