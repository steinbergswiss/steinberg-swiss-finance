// State store: seed JSON -> localStorage -> React context.
// Every mutation goes through the shared modules in banking.js.
// A "Reset data" control restores the seed and clears the session.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeed, SEED_VERSION } from '../data/seed.js';

export const STORAGE_KEY = 'steinberg-state-v1';
export const SESSION_KEY = 'steinberg-session-v1';

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === SEED_VERSION) return parsed;
    }
  } catch {
    /* corrupted storage -> fall back to seed */
  }
  const seed = buildSeed();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    /* storage unavailable (private mode) — app still runs in memory */
  }
  return seed;
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadInitialState);
  const [session, setSession] = useState(loadSession);
  const [flash, setFlash] = useState(null); // {type, text}

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state]);

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [session]);

  const notify = useCallback((type, text) => setFlash({ type, text, at: Date.now() }), []);
  const clearFlash = useCallback(() => setFlash(null), []);

  const apply = useCallback((result, fallbackMessage) => {
    if (result && result.ok) {
      setState(result.state);
      notify('success', result.message || fallbackMessage);
      return true;
    }
    if (result && result.errors) notify('error', result.errors.join(' '));
    else if (result) notify('error', result.message || 'Something went wrong.');
    return false;
  }, [notify]);

  const signIn = useCallback((email, password) => {
    const user = state.users.find(
      (u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase() && u.password === String(password),
    );
    if (!user) return { ok: false, error: 'These credentials do not match our records.' };
    if (user.userType === 'customer' && Number(user.status) !== 1) {
      return { ok: false, error: 'Your account is inactive. Please contact support.' };
    }
    const s = { userId: user.id, role: user.userType, signedInAt: new Date().toISOString() };
    setSession(s);
    return { ok: true, role: user.userType };
  }, [state.users]);

  // Sign in with an already-known user object (used right after registration,
  // where the freshly created user is not yet in the stale state closure).
  const signInAs = useCallback((user) => {
    setSession({ userId: user.id, role: user.userType, signedInAt: new Date().toISOString() });
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  const resetData = useCallback(() => {
    const seed = buildSeed();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {
      /* ignore */
    }
    setState(seed);
    setSession(null);
    setFlash(null);
  }, []);

  const currentUser = useMemo(
    () => (session ? state.users.find((u) => u.id === session.userId) || null : null),
    [session, state.users],
  );

  const value = useMemo(
    () => ({
      state,
      session,
      currentUser,
      flash,
      notify,
      clearFlash,
      apply,
      signIn,
      signInAs,
      signOut,
      resetData,
      // convenience: replace state directly after shared-module operations
      setState,
    }),
    [state, session, currentUser, flash, notify, clearFlash, apply, signIn, signInAs, signOut, resetData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
