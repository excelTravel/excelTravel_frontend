// Admin stub data (Rwanda). Mirrors backend companies / private-bookings / audit-logs modules.

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  commission: number;
  status: 'active' | 'suspended';
  since: string;
}
export const COMPANIES: Company[] = [
  { id: 'c1', name: 'ExcelTravel', email: 'ops@exceltravel.rw', phone: '+250 788 300 001', commission: 8, status: 'active', since: '2024' },
  { id: 'c2', name: 'Volcano Express', email: 'info@volcano.rw', phone: '+250 788 300 002', commission: 10, status: 'active', since: '2023' },
  { id: 'c3', name: 'Ritco Ltd', email: 'contact@ritco.rw', phone: '+250 788 300 003', commission: 9, status: 'active', since: '2022' },
  { id: 'c4', name: 'Kigali Coach', email: 'hello@kgcoach.rw', phone: '+250 788 300 004', commission: 7, status: 'suspended', since: '2025' },
];

export type PBStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export type PBPurpose = 'wedding' | 'conference' | 'school' | 'corporate' | 'other';
export interface PrivateBooking {
  id: string;
  requester: string;
  phone: string;
  pickup: string;
  destination: string;
  date: string;
  pax: number;
  purpose: PBPurpose;
  status: PBStatus;
  invoice: number | null;
}
export const PRIVATE_BOOKINGS: PrivateBooking[] = [
  { id: 'PB-201', requester: 'Umutoni Events', phone: '+250 788 410 001', pickup: 'Kigali', destination: 'Musanze', date: '22 Jul 2026', pax: 44, purpose: 'wedding', status: 'pending', invoice: null },
  { id: 'PB-198', requester: 'RDB Corporate', phone: '+250 788 410 002', pickup: 'Kigali', destination: 'Rubavu', date: '25 Jul 2026', pax: 33, purpose: 'corporate', status: 'approved', invoice: 850000 },
  { id: 'PB-190', requester: 'Green Hills School', phone: '+250 788 410 003', pickup: 'Kigali', destination: 'Huye', date: '19 Jul 2026', pax: 40, purpose: 'school', status: 'completed', invoice: 620000 },
  { id: 'PB-185', requester: 'K. Mugabo (private)', phone: '+250 788 410 004', pickup: 'Kigali', destination: 'Nyagatare', date: '18 Jul 2026', pax: 20, purpose: 'other', status: 'rejected', invoice: null },
];

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject';
export interface AuditEntry {
  id: string;
  actor: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  change: string;
  ip: string;
  time: string;
}
export const AUDIT: AuditEntry[] = [
  { id: 'al1', actor: 'David Nkusi', action: 'update', entity: 'vehicles', entityId: 'RAF 051 C', change: 'status: active → maintenance', ip: '41.216.10.4', time: '12m' },
  { id: 'al2', actor: 'Aline Uwase', action: 'approve', entity: 'incidents', entityId: 'INC-3018', change: 'status: pending → approved', ip: '41.216.10.7', time: '2h' },
  { id: 'al3', actor: 'System', action: 'create', entity: 'bookings', entityId: 'TK-8921', change: '+1 booking · Kigali → Musanze', ip: '—', time: '3h' },
  { id: 'al4', actor: 'David Nkusi', action: 'update', entity: 'fares', entityId: 'Nyabugogo↔Musanze', change: 'fare: 3,200 → 3,500', ip: '41.216.10.4', time: '5h' },
  { id: 'al5', actor: 'Aline Uwase', action: 'delete', entity: 'routes', entityId: 'Kigali — Bugesera', change: 'route archived', ip: '41.216.10.7', time: '1d' },
];
