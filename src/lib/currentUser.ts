export interface CurrentUser {
  firstName: string;
  role: string;
  location: string;
}

// Stub profile until wired to Clerk (useUser) + GET /api/v1/me. Replace with the real signed-in user.
export function useCurrentUser(): CurrentUser {
  return { firstName: 'Aline', role: 'Ops Manager', location: 'Kigali HQ' };
}

// Time-of-day greeting for the dashboard welcome.
export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
