// Trip scheduling & demand stubs (Rwanda). Full mock — the backend has no recurring-trip, trip-request or
// waitlist tables yet (flagged in docs/integration-map.md). Wire when those land.

export type Frequency = 'daily' | 'weekdays' | 'weekends' | 'weekly';
export interface Routine {
  id: string;
  from: string;
  to: string;
  frequency: Frequency;
  times: string[];
  bus: string;
  active: boolean;
}

export const ROUTINES: Routine[] = [
  { id: 'RT-01', from: 'Nyagatare', to: 'Remera', frequency: 'daily', times: ['06:00', '12:00', '17:30'], bus: 'RAE-027-B', active: true },
  { id: 'RT-02', from: 'Kigali', to: 'Musanze', frequency: 'weekdays', times: ['07:00', '15:00'], bus: 'RAB-402-C', active: true },
  { id: 'RT-03', from: 'Kigali', to: 'Rubavu', frequency: 'weekends', times: ['08:00'], bus: 'RAC-112-D', active: false },
];

// Agent + passenger waitlist per corridor. Agents at each station along the corridor register how many
// passengers are waiting; the system stages an idle bus at the origin (if one is parked there) so ops can
// early-dispatch once the bus is nearly full and everyone at pickup stations is boarded.
export interface WaitSegment {
  agent: string;
  station: string;
  pax: number;
}
export interface WaitCorridor {
  id: string;
  from: string;
  to: string;
  origin: string; // station where a bus would be staged/dispatched from
  capacity: number;
  scheduled: string; // scheduled departure time
  minsToDepart: number; // minutes until the scheduled departure (drives the countdown)
  segments: WaitSegment[];
  stagedBus: { plate: string; capacity: number } | null; // an idle bus parked at origin, or none
}

export const WAITLIST_CORRIDORS: WaitCorridor[] = [
  {
    id: 'WL-1', from: 'Kigali', to: 'Musanze', origin: 'Nyabugogo', capacity: 33, scheduled: '14:00', minsToDepart: 42,
    segments: [
      { agent: 'A. Niyonzima', station: 'Nyabugogo', pax: 20 },
      { agent: 'C. Mukama', station: 'Muhanga', pax: 9 },
    ],
    stagedBus: { plate: 'RAF-051-C', capacity: 40 },
  },
  {
    id: 'WL-2', from: 'Nyagatare', to: 'Kigali', origin: 'Nyagatare', capacity: 33, scheduled: '13:00', minsToDepart: 88,
    segments: [
      { agent: 'D. Ishimwe', station: 'Nyagatare', pax: 14 },
      { agent: 'B. Uwimana', station: 'Kayonza', pax: 8 },
      { agent: 'E. Habineza', station: 'Rwamagana', pax: 6 },
    ],
    stagedBus: null,
  },
  {
    id: 'WL-3', from: 'Rubavu', to: 'Kigali', origin: 'Rubavu', capacity: 30, scheduled: '16:00', minsToDepart: 210,
    segments: [{ agent: 'F. Mutoni', station: 'Rubavu', pax: 11 }],
    stagedBus: { plate: 'RAC-112-D', capacity: 30 },
  },
];

export const waitingTotal = (c: WaitCorridor) => c.segments.reduce((s, x) => s + x.pax, 0);

// "42m left" / "1h 28m left" until scheduled departure.
export function fmtCountdown(mins: number): { h: number; m: number } {
  return { h: Math.floor(mins / 60), m: mins % 60 };
}

// Live demand vs scheduled capacity (peak board).
export interface DemandNow {
  corridor: string;
  demand: number;
  capacity: number;
}
export const DEMAND_NOW: DemandNow[] = [
  { corridor: 'Kigali → Musanze', demand: 92, capacity: 80 },
  { corridor: 'Nyagatare → Remera', demand: 74, capacity: 33 },
  { corridor: 'Huye → Kigali', demand: 61, capacity: 80 },
  { corridor: 'Kigali → Rubavu', demand: 44, capacity: 60 },
];
