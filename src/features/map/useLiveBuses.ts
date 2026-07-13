import { useMemo } from 'react';

// Live bus positions for the map. STUB for now: seeded along real Rwanda corridors. The shape matches the
// backend `bus:location` socket payload, so swapping this hook for a socket subscription is a drop-in later.

export type BusStatus = 'in_transit' | 'delayed' | 'arriving';

export interface LiveBus {
  id: string;
  code: string;
  routeName: string;
  from: string;
  to: string;
  status: BusStatus;
  eta: string;
  lng: number;
  lat: number;
}

type Coord = [number, number];
type Hub = 'kigali' | 'musanze' | 'rubavu' | 'huye' | 'nyagatare';

// Key intercity hubs (lng, lat).
const HUB: Record<Hub, Coord> = {
  kigali: [30.0606, -1.9441],
  musanze: [29.6349, -1.4998],
  rubavu: [29.2586, -1.6777],
  huye: [29.7407, -2.5967],
  nyagatare: [30.3272, -1.2929],
};

const lerp = (a: Coord, b: Coord, t: number): Coord => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Corridors drawn on the map (Kigali is the national hub).
export const RWANDA_ROUTES: { id: string; coords: Coord[] }[] = [
  { id: 'kgl-mus', coords: [HUB.kigali, HUB.musanze] },
  { id: 'kgl-rub', coords: [HUB.kigali, HUB.rubavu] },
  { id: 'kgl-huy', coords: [HUB.kigali, HUB.huye] },
  { id: 'kgl-nyg', coords: [HUB.kigali, HUB.nyagatare] },
];

export function useLiveBuses(): LiveBus[] {
  return useMemo(() => {
    const build = (
      id: string,
      code: string,
      from: Hub,
      to: Hub,
      status: BusStatus,
      eta: string,
      t: number,
    ): LiveBus => {
      const [lng, lat] = lerp(HUB[from], HUB[to], t);
      return { id, code, routeName: `${cap(from)} → ${cap(to)}`, from: cap(from), to: cap(to), status, eta, lng, lat };
    };
    return [
      build('b1', 'RAB-402', 'kigali', 'musanze', 'in_transit', '14:30', 0.55),
      build('b2', 'RAC-112', 'kigali', 'rubavu', 'delayed', '15:15', 0.35),
      build('b3', 'RAD-88', 'kigali', 'huye', 'arriving', '14:05', 0.9),
      build('b4', 'RAE-27', 'kigali', 'nyagatare', 'in_transit', '15:40', 0.4),
      build('b5', 'RAF-51', 'musanze', 'kigali', 'in_transit', '14:50', 0.25),
    ];
  }, []);
}
