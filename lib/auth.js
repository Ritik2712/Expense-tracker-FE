const STORAGE_KEY = 'expense_tracker_user';

export function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  const normalizedUser = {
    ...user,
    id: user?.id || user?.sub || null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
