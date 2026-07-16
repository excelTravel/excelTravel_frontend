// Network stub data (Rwanda). Mirrors the backend routes / stops / fares modules. Wired to the API later.

export interface Station {
  id: string;
  name: string;
}
export const STATIONS: Station[] = [
  { id: 's1', name: 'Nyabugogo' },
  { id: 's2', name: 'Musanze' },
  { id: 's3', name: 'Rubavu' },
  { id: 's4', name: 'Huye' },
  { id: 's5', name: 'Nyagatare' },
  { id: 's6', name: 'Muhanga' },
];

export type StopType = 'station' | 'stop';
export interface Stop {
  id: string;
  name: string;
  type: StopType;
  parent: string | null;
  phone: string | null;
}
export const STOPS: Stop[] = [
  { id: 'st1', name: 'Nyabugogo', type: 'station', parent: null, phone: '+250 788 000 111' },
  { id: 'st2', name: 'Musanze', type: 'station', parent: null, phone: '+250 788 000 222' },
  { id: 'st3', name: 'Rubavu', type: 'station', parent: null, phone: '+250 788 000 333' },
  { id: 'st4', name: 'Huye', type: 'station', parent: null, phone: '+250 788 000 444' },
  { id: 'st5', name: 'Shyorongi', type: 'stop', parent: 'Nyabugogo', phone: null },
  { id: 'st6', name: 'Muhanga', type: 'stop', parent: 'Nyabugogo', phone: null },
  { id: 'st7', name: 'Nyanza', type: 'stop', parent: 'Huye', phone: null },
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
}
export const ROUTES: Route[] = [
  { id: 'r1', name: 'Kigali — Musanze', origin: 'Nyabugogo', destination: 'Musanze', distanceKm: 116, durationMin: 150, times: ['06:00', '09:00', '12:00', '15:00'], status: 'active' },
  { id: 'r2', name: 'Kigali — Rubavu', origin: 'Nyabugogo', destination: 'Rubavu', distanceKm: 157, durationMin: 210, times: ['07:00', '13:00'], status: 'active' },
  { id: 'r3', name: 'Kigali — Huye', origin: 'Nyabugogo', destination: 'Huye', distanceKm: 133, durationMin: 180, times: ['06:30', '11:00', '16:00'], status: 'active' },
  { id: 'r4', name: 'Nyagatare — Remera', origin: 'Nyagatare', destination: 'Nyabugogo', distanceKm: 165, durationMin: 220, times: ['06:00', '12:00', '17:30'], status: 'inactive' },
];

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
