// Shared Fleet stub data (Rwanda). One source for the gallery, the side rails, and the panels.
// Shapes mirror the backend: vehicles / drivers / maintenance_logs. Wired to the API later.

export type VehicleStatus = 'active' | 'maintenance' | 'retired';
export interface Vehicle {
  plate: string;
  model: string;
  capacity: number;
  year: number;
  status: VehicleStatus;
  driver: string | null;
  driverPhone: string | null;
  currentKm: number;
  nextServiceKm: number;
  nextServiceDate: string; // next maintenance day (derived from latest maintenance_log)
}

export const VEHICLES: Vehicle[] = [
  { plate: 'RAB-402', model: 'Executive Coach', capacity: 40, year: 2023, status: 'active', driver: 'Sarah Uwase', driverPhone: '+250 788 123 401', currentKm: 184320, nextServiceKm: 190000, nextServiceDate: '24 Jul 2026' },
  { plate: 'RAC-112', model: 'Toyota Hiace', capacity: 30, year: 2021, status: 'active', driver: 'Patrick Habimana', driverPhone: '+250 788 224 112', currentKm: 246980, nextServiceKm: 248000, nextServiceDate: '15 Jul 2026' },
  { plate: 'RAD-88', model: 'Yutong Bus', capacity: 44, year: 2022, status: 'active', driver: 'Liliane Ingabire', driverPhone: '+250 788 889 088', currentKm: 132540, nextServiceKm: 142000, nextServiceDate: '02 Aug 2026' },
  { plate: 'RAE-27', model: 'Coaster', capacity: 33, year: 2020, status: 'active', driver: null, driverPhone: null, currentKm: 301120, nextServiceKm: 301500, nextServiceDate: '13 Jul 2026' },
  { plate: 'RAF-51', model: 'Executive Coach', capacity: 40, year: 2023, status: 'maintenance', driver: null, driverPhone: null, currentKm: 98760, nextServiceKm: 108000, nextServiceDate: 'In service' },
  { plate: 'RAA-05', model: 'Rosa (legacy)', capacity: 28, year: 2015, status: 'retired', driver: null, driverPhone: null, currentKm: 512300, nextServiceKm: 512300, nextServiceDate: '—' },
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
  { id: 'd1', name: 'Sarah Uwase', license: 'RW-DL-4471', licenseExpiry: '12 Mar 2028', rating: 4.92, status: 'on_trip', vehicle: 'RAB-402', phone: '+250 788 123 401', emergencyPhone: '+250 788 900 111', hoursWorked: 32, trips: [ { code: 'TRP-8492', from: 'KGL', to: 'MUS', start: 6, end: 10 }, { code: 'TRP-8540', from: 'MUS', to: 'KGL', start: 11, end: 15 } ] },
  { id: 'd2', name: 'Patrick Habimana', license: 'RW-DL-2210', licenseExpiry: '30 Sep 2027', rating: 4.71, status: 'on_trip', vehicle: 'RAC-112', phone: '+250 788 224 112', emergencyPhone: '+250 788 445 220', hoursWorked: 28, trips: [ { code: 'TRP-8495', from: 'KGL', to: 'RUB', start: 8, end: 13 } ] },
  { id: 'd3', name: 'Liliane Ingabire', license: 'RW-DL-8890', licenseExpiry: '05 Jan 2029', rating: 4.88, status: 'on_trip', vehicle: 'RAD-88', phone: '+250 788 889 088', emergencyPhone: '+250 788 771 903', hoursWorked: 35, trips: [ { code: 'TRP-8502', from: 'KGL', to: 'HUY', start: 7, end: 11 }, { code: 'TRP-8551', from: 'HUY', to: 'KGL', start: 13, end: 17 } ] },
  { id: 'd4', name: 'Jean Mugabo', license: 'RW-DL-1120', licenseExpiry: '18 Jun 2026', rating: 4.55, status: 'available', vehicle: null, phone: '+250 788 112 004', emergencyPhone: '+250 788 330 118', hoursWorked: 21, trips: [ { code: 'TRP-8560', from: 'KGL', to: 'NYA', start: 15, end: 20 } ] },
  { id: 'd5', name: 'Claudine Umutoni', license: 'RW-DL-6634', licenseExpiry: '22 Nov 2027', rating: 4.79, status: 'off_duty', vehicle: null, phone: '+250 788 663 400', emergencyPhone: '+250 788 550 662', hoursWorked: 0, trips: [] },
  { id: 'd6', name: 'Eric Nkusi', license: 'RW-DL-3321', licenseExpiry: '09 Feb 2026', rating: 4.2, status: 'suspended', vehicle: null, phone: '+250 788 332 100', emergencyPhone: '+250 788 221 337', hoursWorked: 0, trips: [] },
];

export type Urgency = 'overdue' | 'due_soon' | 'logged';
export interface Job {
  id: string;
  vehicle: string;
  serviceType: string;
  when: string;
  odometerKm: number;
  cost: number;
  urgency: Urgency;
}

export const JOBS: Job[] = [
  { id: 'MT-2041', vehicle: 'RAE-27', serviceType: 'Brake system', when: 'Due 2d ago', odometerKm: 301120, cost: 320000, urgency: 'overdue' },
  { id: 'MT-2044', vehicle: 'RAC-112', serviceType: 'Full service', when: 'Due today', odometerKm: 246980, cost: 180000, urgency: 'due_soon' },
  { id: 'MT-2047', vehicle: 'RAF-51', serviceType: 'Engine repair', when: 'Due in 4d', odometerKm: 98760, cost: 640000, urgency: 'due_soon' },
  { id: 'MT-2050', vehicle: 'RAD-88', serviceType: 'Tyre replacement', when: 'Logged 12 Jul', odometerKm: 132540, cost: 220000, urgency: 'logged' },
  { id: 'MT-2038', vehicle: 'RAB-402', serviceType: 'Oil & filter', when: 'Logged 08 Jul', odometerKm: 184320, cost: 95000, urgency: 'logged' },
];

// Fleet-wide summary (represents the whole fleet, not just the sampled cards above).
export const FLEET_SUMMARY = {
  total: 142,
  active: 118,
  maintenance: 12,
  retired: 12,
  driversOnDuty: 96,
  servicesDue: 12,
  get utilization() {
    return Math.round((this.active / this.total) * 100);
  },
};

// Service interval ≈ 10,000 km — how far through the current cycle a vehicle is.
export function serviceProgress(v: Vehicle): number {
  const cycle = 10000;
  const done = Math.max(0, cycle - (v.nextServiceKm - v.currentKm));
  return Math.min(100, Math.round((done / cycle) * 100));
}
export function serviceDueSoon(v: Vehicle): boolean {
  return v.status !== 'retired' && v.nextServiceKm - v.currentKm <= 2000;
}
