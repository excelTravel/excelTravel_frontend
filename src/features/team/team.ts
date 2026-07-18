// Team stub data (Rwanda). Passengers list; staff/agents come live from /users.

// Passengers who have travelled with this company. `bookings` = trips booked with us; `logins`/`lastLogin`
// come from Clerk (the backend users table doesn't track logins yet — see docs/integration-map.md).
// `updated` = last time the passenger changed any profile detail.
export interface Passenger {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  bookings: number;
  lastLogin: string; // ISO date
  logins: number;
  updated: string; // ISO date of last profile change
}

export const PASSENGERS: Passenger[] = [
  { id: 'p1', name: 'Jean Paul Ndayisaba', phone: '+250 788 300 011', email: 'jp.nda@gmail.com', bookings: 42, lastLogin: '2026-07-16', logins: 210, updated: '2026-07-02' },
  { id: 'p2', name: 'Sandrine Mukamana', phone: '+250 788 300 012', email: 'sandrine.m@gmail.com', bookings: 7, lastLogin: '2026-07-15', logins: 33, updated: '2026-06-20' },
  { id: 'p3', name: 'Eric Gatete', phone: '+250 788 300 013', email: null, bookings: 1, lastLogin: '2026-05-30', logins: 3, updated: '2026-05-30' },
  { id: 'p4', name: 'Divine Iradukunda', phone: '+250 788 300 014', email: 'divine.ira@gmail.com', bookings: 18, lastLogin: '2026-07-14', logins: 96, updated: '2026-07-10' },
  { id: 'p5', name: 'Patrick Habimana', phone: '+250 788 300 015', email: 'p.habimana@gmail.com', bookings: 3, lastLogin: '2026-07-01', logins: 12, updated: '2026-04-18' },
  { id: 'p6', name: 'Aline Umutoni', phone: '+250 788 300 016', email: 'aline.u@gmail.com', bookings: 65, lastLogin: '2026-07-16', logins: 340, updated: '2026-07-15' },
  { id: 'p7', name: 'Claude Nshimiyimana', phone: '+250 788 300 017', email: null, bookings: 12, lastLogin: '2026-07-11', logins: 58, updated: '2026-06-01' },
  { id: 'p8', name: 'Grace Mutesi', phone: '+250 788 300 018', email: 'grace.mut@gmail.com', bookings: 9, lastLogin: '2026-07-13', logins: 44, updated: '2026-07-09' },
];
