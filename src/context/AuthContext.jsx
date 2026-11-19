import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Front-end only demo authentication.
// Accounts live in localStorage (passwords are salted + SHA-256 hashed with the Web Crypto API).
// This is intentionally NOT production security: a real app would use a backend + HTTP-only cookies.

const AuthContext = createContext(null);
const USERS_KEY = 'aurora-users-v1';
const SESSION_KEY = 'aurora-session-v1';

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const randomId = () => Math.random().toString(36).slice(2, 10);
const publicUser = ({ id, name, email, createdAt }) => ({ id, name, email, createdAt });

async function hashPassword(password, salt) {
  const text = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return btoa(unescape(encodeURIComponent(text))); // fallback for insecure contexts (demo only)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const id = read(SESSION_KEY, null);
    if (!id) return null;
    const found = read(USERS_KEY, []).find((u) => u.id === id);
    return found ? publicUser(found) : null;
  });

  const register = useCallback(async ({ name, email, password }) => {
    await wait(700); // feels like a real network call
    const users = read(USERS_KEY, []);
    const mail = email.trim().toLowerCase();
    if (users.some((u) => u.email === mail)) throw new Error('An account with this email already exists.');
    const salt = randomId();
    const record = {
      id: randomId(),
      name: name.trim(),
      email: mail,
      salt,
      hash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };
    write(USERS_KEY, [...users, record]);
    write(SESSION_KEY, record.id);
    setUser(publicUser(record));
    return publicUser(record);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    await wait(600);
    const mail = email.trim().toLowerCase();
    const record = read(USERS_KEY, []).find((u) => u.email === mail);
    if (!record || (await hashPassword(password, record.salt)) !== record.hash) {
      throw new Error('Incorrect email or password.');
    }
    write(SESSION_KEY, record.id);
    setUser(publicUser(record));
    return publicUser(record);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async ({ name }) => {
      await wait(400);
      const users = read(USERS_KEY, []);
      const next = users.map((u) => (u.id === user?.id ? { ...u, name: name.trim() } : u));
      write(USERS_KEY, next);
      const updated = next.find((u) => u.id === user?.id);
      if (updated) setUser(publicUser(updated));
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, register, login, logout, updateProfile }),
    [user, register, login, logout, updateProfile]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
