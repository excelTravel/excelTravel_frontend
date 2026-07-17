// Network stub data (Rwanda). Mirrors the backend routes / stops / fares modules. Wired to the API later.

export interface Station {
  id: string;
  name: string;
  lng: number;
  lat: number;
}
export const STATIONS: Station[] = [
  { id: 's1', name: 'Nyabugogo', lng: 30.0434, lat: -1.9397 },
  { id: 's2', name: 'Musanze', lng: 29.6349, lat: -1.4998 },
  { id: 's3', name: 'Rubavu', lng: 29.2586, lat: -1.6777 },
  { id: 's4', name: 'Huye', lng: 29.7407, lat: -2.5967 },
  { id: 's5', name: 'Nyagatare', lng: 30.3272, lat: -1.2929 },
  { id: 's6', name: 'Muhanga', lng: 29.7554, lat: -2.0853 },
];

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  times: string[];
  status: 'active' | 'inactive';
  stationIds: string[]; // ordered stations along the route (for per-route leg fares)
}
export const ROUTES: Route[] = [
  { id: 'r1', name: 'Kigali — Musanze', origin: 'Nyabugogo', destination: 'Musanze', distanceKm: 116, durationMin: 150, times: ['06:00', '09:00', '12:00', '15:00'], status: 'active', stationIds: ['s1', 's2'] },
  { id: 'r2', name: 'Kigali — Rubavu', origin: 'Nyabugogo', destination: 'Rubavu', distanceKm: 157, durationMin: 210, times: ['07:00', '13:00'], status: 'active', stationIds: ['s1', 's2', 's3'] },
  { id: 'r3', name: 'Kigali — Huye', origin: 'Nyabugogo', destination: 'Huye', distanceKm: 133, durationMin: 180, times: ['06:30', '11:00', '16:00'], status: 'active', stationIds: ['s1', 's6', 's4'] },
  { id: 'r4', name: 'Nyagatare — Remera', origin: 'Nyagatare', destination: 'Nyabugogo', distanceKm: 165, durationMin: 220, times: ['06:00', '12:00', '17:30'], status: 'inactive', stationIds: ['s5', 's1'] },
];

export const stationName = (id: string) => STATIONS.find((s) => s.id === id)?.name ?? id;

// RURA-regulated station-to-station fares (national — same both ways, no route). Keyed a<b.
export const FARES: Record<string, number> = {
  's1|s2': 3500, 's1|s3': 5000, 's1|s4': 4200, 's1|s5': 4800, 's1|s6': 1500,
  's2|s3': 2500, 's4|s7': 900, 's2|s6': 2200, 's3|s4': 6000,
};
export function fareBetween(a: string, b: string): number | null {
  if (a === b) return null;
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  return FARES[key] ?? null;
}
