// The Vehicle shape VehiclesPanel maps live /vehicles rows onto for VehicleCard/VehicleDetailModal.

export type VehicleStatus = 'active' | 'maintenance' | 'retired';
export interface Vehicle {
  id: string;
  plate: string; // format "RAA-000-A"
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
  photoUrl: string | null;
}
