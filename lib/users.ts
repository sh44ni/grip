// ============================================================
// GRIP — Hardcoded Users (no DB table needed)
// ============================================================

export const USERS = [
  { id: 'zeeshan', name: 'Zeeshan', pin: '1510', color: '#14B8A6', initial: 'Z' },
  { id: 'maryam',  name: 'Maryam',  pin: '7272', color: '#A855F7', initial: 'M' },
] as const;

export type UserId = (typeof USERS)[number]['id'];
export type AppUser = (typeof USERS)[number];

export function getUserById(id: string): AppUser | undefined {
  return USERS.find((u) => u.id === id);
}

export function verifyPin(userId: string, pin: string): boolean {
  const user = getUserById(userId);
  return !!user && user.pin === pin;
}

export const USER_STORAGE_KEY = 'grip_current_user';
