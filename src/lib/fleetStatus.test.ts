import { describe, it, expect } from 'vitest';
import { maintenanceStatus, licenseStatus, MAINTENANCE_DUE_SOON_DAYS, LICENSE_EXPIRING_SOON_MONTHS } from './fleetStatus';

const DAY_MS = 86_400_000;
const now = new Date('2026-01-15T00:00:00Z');

describe('maintenanceStatus', () => {
  it('reports no service logged when there is no next-service date', () => {
    expect(maintenanceStatus(null, now).tone).toBe('neutral');
  });

  it('reports danger once the next-service date is in the past', () => {
    const overdue = new Date(now.getTime() - DAY_MS).toISOString();
    expect(maintenanceStatus(overdue, now).tone).toBe('danger');
  });

  it('reports warning inside the due-soon window', () => {
    const soon = new Date(now.getTime() + (MAINTENANCE_DUE_SOON_DAYS - 1) * DAY_MS).toISOString();
    expect(maintenanceStatus(soon, now).tone).toBe('warning');
  });

  it('reports success comfortably before the due-soon window', () => {
    const later = new Date(now.getTime() + (MAINTENANCE_DUE_SOON_DAYS + 10) * DAY_MS).toISOString();
    expect(maintenanceStatus(later, now).tone).toBe('success');
  });

  it('treats the exact due-soon boundary as warning, not success', () => {
    const boundary = new Date(now.getTime() + MAINTENANCE_DUE_SOON_DAYS * DAY_MS).toISOString();
    expect(maintenanceStatus(boundary, now).tone).toBe('warning');
  });
});

describe('licenseStatus', () => {
  const MONTH_MS = 30.4375 * DAY_MS;

  it('reports no license on file when there is no expiry', () => {
    expect(licenseStatus(null, now).tone).toBe('neutral');
  });

  it('reports danger once the license has expired', () => {
    const expired = new Date(now.getTime() - DAY_MS).toISOString();
    expect(licenseStatus(expired, now).tone).toBe('danger');
  });

  it('reports warning inside the expiring-soon window', () => {
    const soon = new Date(now.getTime() + (LICENSE_EXPIRING_SOON_MONTHS - 0.5) * MONTH_MS).toISOString();
    expect(licenseStatus(soon, now).tone).toBe('warning');
  });

  it('reports success comfortably before the expiring-soon window', () => {
    const later = new Date(now.getTime() + (LICENSE_EXPIRING_SOON_MONTHS + 6) * MONTH_MS).toISOString();
    expect(licenseStatus(later, now).tone).toBe('success');
  });
});
