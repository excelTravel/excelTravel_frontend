import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

// Types mirror the live backend responses (excelTravel_backend). The API returns bare arrays / objects
// (no envelope). Regenerate from openapi.json once it's refreshed; hand-typed here until then.

export interface Me {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'company_admin' | 'manager' | 'agent' | 'driver' | 'passenger';
  companyId: string | null;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ApiRoute {
  id: string;
  companyId: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number | null;
  estimatedDurationMin: number | null;
  departureTimes: string[];
  status: 'active' | 'inactive';
}

export interface ApiStop {
  id: string;
  name: string;
  type: 'station' | 'stop';
  parentStationId: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  address: string | null;
}

export interface ApiFare {
  id: string;
  originStationId: string;
  destinationStationId: string;
  fareAmount: number;
  fareSource: 'manual' | 'tapgo';
}

export interface ApiVehicle {
  id: string;
  companyId: string;
  routeId: string | null;
  plateNumber: string;
  model: string | null;
  capacity: number;
  year: number | null;
  status: 'active' | 'maintenance' | 'retired';
  currentKm: number;
}

export interface ApiTrip {
  id: string;
  companyId: string;
  routeId: string;
  vehicleId: string;
  driverId: string | null;
  direction: 'outbound' | 'return';
  departureTime: string;
  status: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'company_admin' | 'manager' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  companyId: string;
}

export interface ApiCompany {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  commissionRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Stable query keys so mutations can invalidate precisely later.
export const qk = {
  me: ['me'] as const,
  routes: ['routes'] as const,
  stops: ['stops'] as const,
  fares: ['fares'] as const,
  vehicles: ['vehicles'] as const,
  trips: ['trips'] as const,
  users: ['users'] as const,
  companies: ['companies'] as const,
};

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => apiFetch<Me>('/me') });
export const useRoutes = () => useQuery({ queryKey: qk.routes, queryFn: () => apiFetch<ApiRoute[]>('/routes') });
export const useStops = () => useQuery({ queryKey: qk.stops, queryFn: () => apiFetch<ApiStop[]>('/stops') });
export const useFares = () => useQuery({ queryKey: qk.fares, queryFn: () => apiFetch<ApiFare[]>('/fares') });
export const useVehicles = () => useQuery({ queryKey: qk.vehicles, queryFn: () => apiFetch<ApiVehicle[]>('/vehicles') });
export const useTrips = () => useQuery({ queryKey: qk.trips, queryFn: () => apiFetch<ApiTrip[]>('/trips') });
export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: () => apiFetch<ApiUser[]>('/users') });
export const useCompanies = () => useQuery({ queryKey: qk.companies, queryFn: () => apiFetch<ApiCompany[]>('/companies') });
