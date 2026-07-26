// Provisional urgency thresholds for vehicle maintenance and driver license status. These numbers are
// OUR proposal, not a confirmed ops policy — see docs/specs/fleet-status-thresholds.md for the full
// writeup and how to change them once the ops manager gives the real numbers.
export const MAINTENANCE_DUE_SOON_DAYS = 5;
export const LICENSE_EXPIRING_SOON_MONTHS = 3;
const AVG_DAYS_PER_MONTH = 30.4375;

export type UrgencyTone = 'success' | 'warning' | 'danger' | 'neutral';
export interface UrgencyStatus {
  label: string;
  tone: UrgencyTone;
}

// Vehicle maintenance status from its most recent nextServiceDate (null = no service ever logged).
export function maintenanceStatus(nextServiceDate: string | null, now = new Date()): UrgencyStatus {
  if (!nextServiceDate) return { label: 'No service logged', tone: 'neutral' };
  const daysUntil = (new Date(nextServiceDate).getTime() - now.getTime()) / 86_400_000;
  if (daysUntil < 0) return { label: 'Due for maintenance', tone: 'danger' };
  if (daysUntil <= MAINTENANCE_DUE_SOON_DAYS) return { label: 'Soon to be maintained', tone: 'warning' };
  return { label: 'Properly maintained', tone: 'success' };
}

// Driver license status from its expiry date (null = no license on file).
export function licenseStatus(licenseExpiry: string | null, now = new Date()): UrgencyStatus {
  if (!licenseExpiry) return { label: 'No license on file', tone: 'neutral' };
  const monthsUntil = (new Date(licenseExpiry).getTime() - now.getTime()) / (AVG_DAYS_PER_MONTH * 86_400_000);
  if (monthsUntil < 0) return { label: 'License expired', tone: 'danger' };
  if (monthsUntil <= LICENSE_EXPIRING_SOON_MONTHS) return { label: 'License expiring soon', tone: 'warning' };
  return { label: 'License active', tone: 'success' };
}
