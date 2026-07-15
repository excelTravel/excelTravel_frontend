// Shared Fleet stub data (Rwanda). One source for the gallery, the side rails, and the panels.
// Shapes mirror the backend: vehicles / drivers / maintenance_logs. Wired to the API later.

export type VehicleStatus = 'active' | 'maintenance' | 'retired';
export interface Vehicle {
  plate: string; // format "RAA 000 A"
  model: string;
  capacity: number;
  year: number;
  status: VehicleStatus;
  driver: string | null;
  driverPhone: string | null;
  nextServiceDate: string; // next maintenance day
  currentTrip: { code: string; route: string } | null; // running now
  nextTrip: { code: string; time: string } | null; // scheduled, not yet started
  maintenanceSince: string | null; // ISO datetime when it entered maintenance
}

export const VEHICLES: Vehicle[] = [
  { plate: 'RAB 402 C', model: 'Executive Coach', capacity: 40, year: 2023, status: 'active', driver: 'Sarah Uwase', driverPhone: '+250 788 123 401', nextServiceDate: '24 Jul 2026', currentTrip: { code: 'TRP-8492', route: 'Kigali → Musanze' }, nextTrip: null, maintenanceSince: null },
  { plate: 'RAC 112 D', model: 'Toyota Hiace', capacity: 30, year: 2021, status: 'active', driver: 'Patrick Habimana', driverPhone: '+250 788 224 112', nextServiceDate: '15 Jul 2026', currentTrip: { code: 'TRP-8495', route: 'Kigali → Rubavu' }, nextTrip: null, maintenanceSince: null },
  { plate: 'RAD 088 A', model: 'Yutong Bus', capacity: 44, year: 2022, status: 'active', driver: 'Liliane Ingabire', driverPhone: '+250 788 889 088', nextServiceDate: '02 Aug 2026', currentTrip: { code: 'TRP-8502', route: 'Kigali → Huye' }, nextTrip: null, maintenanceSince: null },
  { plate: 'RAE 027 B', model: 'Coaster', capacity: 33, year: 2020, status: 'active', driver: null, driverPhone: null, nextServiceDate: '13 Jul 2026', currentTrip: null, nextTrip: { code: 'TRP-8510', time: '11:30' }, maintenanceSince: null },
  { plate: 'RAF 051 C', model: 'Executive Coach', capacity: 40, year: 2023, status: 'maintenance', driver: null, driverPhone: null, nextServiceDate: 'In service', currentTrip: null, nextTrip: null, maintenanceSince: '2026-07-12T09:00:00' },
  { plate: 'RAA 005 A', model: 'Rosa (legacy)', capacity: 28, year: 2015, status: 'retired', driver: null, driverPhone: null, nextServiceDate: '—', currentTrip: null, nextTrip: null, maintenanceSince: null },
];

export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';
export interface DriverTrip {
  code: string;
  from: string;
  to: string;
  start: number;
  end: number;
}
export interface Driver {
  id: string;
  name: string;
  license: string;
  licenseExpiry: string;
  rating: number;
  status: DriverStatus;
  vehicle: string | null;
  phone: string;
  emergencyPhone: string;
  hoursWorked: number; // this week
  trips: DriverTrip[];
}

export const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Sarah Uwase', license: 'RW-DL-4471', licenseExpiry: '12 Mar 2028', rating: 4.92, status: 'on_trip', vehicle: 'RAB 402 C', phone: '+250 788 123 401', emergencyPhone: '+250 788 900 111', hoursWorked: 32, trips: [ { code: 'TRP-8492', from: 'KGL', to: 'MUS', start: 6, end: 10 }, { code: 'TRP-8540', from: 'MUS', to: 'KGL', start: 11, end: 15 } ] },
  { id: 'd2', name: 'Patrick Habimana', license: 'RW-DL-2210', licenseExpiry: '30 Sep 2027', rating: 4.71, status: 'on_trip', vehicle: 'RAC 112 D', phone: '+250 788 224 112', emergencyPhone: '+250 788 445 220', hoursWorked: 28, trips: [ { code: 'TRP-8495', from: 'KGL', to: 'RUB', start: 8, end: 13 } ] },
  { id: 'd3', name: 'Liliane Ingabire', license: 'RW-DL-8890', licenseExpiry: '05 Jan 2029', rating: 4.88, status: 'on_trip', vehicle: 'RAD 088 A', phone: '+250 788 889 088', emergencyPhone: '+250 788 771 903', hoursWorked: 35, trips: [ { code: 'TRP-8502', from: 'KGL', to: 'HUY', start: 7, end: 11 }, { code: 'TRP-8551', from: 'HUY', to: 'KGL', start: 13, end: 17 } ] },
  { id: 'd4', name: 'Jean Mugabo', license: 'RW-DL-1120', licenseExpiry: '18 Jun 2026', rating: 4.55, status: 'available', vehicle: null, phone: '+250 788 112 004', emergencyPhone: '+250 788 330 118', hoursWorked: 21, trips: [ { code: 'TRP-8560', from: 'KGL', to: 'NYA', start: 15, end: 20 } ] },
  { id: 'd5', name: 'Claudine Umutoni', license: 'RW-DL-6634', licenseExpiry: '22 Nov 2027', rating: 4.79, status: 'off_duty', vehicle: null, phone: '+250 788 663 400', emergencyPhone: '+250 788 550 662', hoursWorked: 0, trips: [] },
  { id: 'd6', name: 'Eric Nkusi', license: 'RW-DL-3321', licenseExpiry: '09 Feb 2026', rating: 4.2, status: 'suspended', vehicle: null, phone: '+250 788 332 100', emergencyPhone: '+250 788 221 337', hoursWorked: 0, trips: [] },
];

// Weekly shift roster (stub). Mon→Sun; null = day off. Hours = end − start. Drives the roster grid + the
// fairness/workload board so ops can balance load and avoid overworking anyone. (No backend shift table yet.)
export interface Shift {
  start: number;
  end: number;
}
export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const WEEKLY_CAP = 45; // fair-work ceiling (hours/week)

export const ROSTER: Record<string, (Shift | null)[]> = {
  d1: [{ start: 6, end: 14 }, { start: 6, end: 14 }, { start: 6, end: 14 }, { start: 6, end: 14 }, { start: 6, end: 14 }, null, null],
  d2: [{ start: 8, end: 16 }, { start: 8, end: 16 }, { start: 8, end: 16 }, { start: 8, end: 16 }, { start: 8, end: 16 }, { start: 8, end: 16 }, null],
  d3: [{ start: 7, end: 15 }, { start: 7, end: 15 }, { start: 7, end: 15 }, { start: 7, end: 15 }, { start: 7, end: 15 }, null, null],
  d4: [null, { start: 14, end: 22 }, { start: 14, end: 22 }, { start: 14, end: 22 }, { start: 14, end: 22 }, { start: 14, end: 22 }, null],
  d5: [null, null, { start: 6, end: 13 }, { start: 6, end: 13 }, { start: 6, end: 13 }, { start: 6, end: 13 }, { start: 6, end: 13 }],
  d6: [null, null, null, null, null, null, null],
};

export function weeklyHours(id: string): number {
  return (ROSTER[id] ?? []).reduce((sum, s) => sum + (s ? s.end - s.start : 0), 0);
}

// Fleet-wide summary (represents the whole fleet, not just the sampled cards above).
export const FLEET_SUMMARY = {
  total: 142,
  active: 118,
  maintenance: 12,
  retired: 12,
  scheduledToday: 84,
  totalDrivers: 96,
  onShift: 71,
  inTrip: 43,
  available: 28,
  get utilization() {
    return Math.round((this.active / this.total) * 100);
  },
};
