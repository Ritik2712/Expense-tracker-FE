const STORAGE_KEY = 'expense_tracker_user';
let inMemoryUser = null;

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    id: user?.id || user?.sub || null,
  };
}

function notifyAuthChange(user) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:user-changed', { detail: user }));
}

export function setStoredUser(user) {
  const normalizedUser = normalizeUser(user);
  inMemoryUser = normalizedUser;
  if (typeof window !== 'undefined') {
    if (normalizedUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  notifyAuthChange(normalizedUser);
}

export function getStoredUser() {
  if (inMemoryUser) return inMemoryUser;
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    inMemoryUser = normalizeUser(parsed);
    return inMemoryUser;
  } catch {
    return null;
  }
}

export function clearStoredUser() {
  inMemoryUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  notifyAuthChange(null);
}
