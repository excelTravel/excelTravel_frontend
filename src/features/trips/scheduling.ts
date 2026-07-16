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

export interface AgentDemand {
  agent: string;
  station: string;
  pax: number;
}
export interface DemandCorridor {
  id: string;
  from: string;
  to: string;
  capacity: number;
  agents: AgentDemand[];
}

export const DEMAND: DemandCorridor[] = [
  {
    id: 'DC-1', from: 'Nyagatare', to: 'Remera', capacity: 33,
    agents: [
      { agent: 'A. Niyonzima', station: 'Nyagatare', pax: 10 },
      { agent: 'B. Uwimana', station: 'Kayonza', pax: 3 },
      { agent: 'C. Mukama', station: 'Rwamagana', pax: 6 },
    ],
  },
  {
    id: 'DC-2', from: 'Huye', to: 'Kigali', capacity: 40,
    agents: [
      { agent: 'D. Ishimwe', station: 'Huye', pax: 14 },
      { agent: 'E. Habineza', station: 'Nyanza', pax: 8 },
    ],
  },
];

export interface WaitEntry {
  id: string;
  from: string;
  to: string;
  station: string;
  waiting: number;
  threshold: number;
  scheduled: string;
  earliest: string;
}

export const WAITLIST: WaitEntry[] = [
  { id: 'WL-1', from: 'Kigali', to: 'Musanze', station: 'Nyabugogo', waiting: 28, threshold: 33, scheduled: '14:00', earliest: '12:20' },
  { id: 'WL-2', from: 'Kigali', to: 'Huye', station: 'Nyabugogo', waiting: 33, threshold: 33, scheduled: '15:30', earliest: '13:10' },
  { id: 'WL-3', from: 'Rubavu', to: 'Kigali', station: 'Rubavu', waiting: 11, threshold: 30, scheduled: '16:00', earliest: '—' },
];

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

export const pax = (c: DemandCorridor) => c.agents.reduce((s, a) => s + a.pax, 0);
