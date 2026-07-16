// Team stub data (Rwanda). Mirrors the backend users / agents modules. Wired to the API later.

export type StaffRole = 'company_admin' | 'manager' | 'agent';
export type StaffStatus = 'active' | 'inactive' | 'suspended';
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
}

export const STAFF: Staff[] = [
  { id: 'u1', name: 'David Nkusi', email: 'david@exceltravel.rw', phone: '+250 788 100 001', role: 'company_admin', status: 'active' },
  { id: 'u2', name: 'Aline Uwase', email: 'aline@exceltravel.rw', phone: '+250 788 100 002', role: 'manager', status: 'active' },
  { id: 'u3', name: 'Grace Mukamana', email: 'grace@exceltravel.rw', phone: '+250 788 100 003', role: 'agent', status: 'active' },
  { id: 'u4', name: 'Eric Kayitare', email: 'eric@exceltravel.rw', phone: '+250 788 100 004', role: 'agent', status: 'suspended' },
  { id: 'u5', name: 'Josiane Rugwiro', email: 'josiane@exceltravel.rw', phone: '+250 788 100 005', role: 'manager', status: 'inactive' },
];

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  stations: string[];
}

export const AGENTS: Agent[] = [
  { id: 'a1', name: 'Alice Niyonzima', email: 'a.niyonzima@exceltravel.rw', phone: '+250 788 200 001', stations: ['Nyagatare', 'Kayonza'] },
  { id: 'a2', name: 'Bruno Uwimana', email: 'b.uwimana@exceltravel.rw', phone: '+250 788 200 002', stations: ['Rwamagana'] },
  { id: 'a3', name: 'Diane Ishimwe', email: 'd.ishimwe@exceltravel.rw', phone: '+250 788 200 003', stations: ['Huye', 'Nyanza'] },
  { id: 'a4', name: 'Chris Mukama', email: 'c.mukama@exceltravel.rw', phone: '+250 788 200 004', stations: [] },
];
