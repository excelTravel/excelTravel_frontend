export interface CurrentUser {
  firstName: string;
  role: string;
  location: string;
}

// Stub profile until wired to Clerk (useUser) + GET /api/v1/me. Replace with the real signed-in user.
export function useCurrentUser(): CurrentUser {
  return { firstName: 'Aline', role: 'Ops Manager', location: 'Kigali HQ' };
}

// Time-of-day period key ('morning' | 'afternoon' | 'evening') — translated in the header via i18n.
export function getGreetingPeriod(date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
