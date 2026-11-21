// State store: seed JSON -> localStorage -> React context.
// Every mutation goes through the shared modules in banking.js.
// A "Reset data" control restores the seed and clears the session.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, SEED_VERSION } from '../data/seed.js';
import { supabase } from './supabase.js';

export const STORAGE_KEY = 'steinberg-state-v1';
export const SESSION_KEY = 'steinberg-session-v1';

function upgradeState(parsed) {
  const seed = buildSeed();
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.users)) return seed;

  // Keep the visitor's data. Only backfill fields/settings that are new.
  const out = { ...seed, ...parsed };
  out.settings = { ...seed.settings, ...(parsed.settings || {}) };
  out.users = parsed.users.map((u) => ({
    ...u,
    currencies:
      Array.isArray(u.currencies) && u.currencies.length
        ? u.currencies
        : seed.users.find((su) => su.id === u.id)?.currencies || [1, 2, 3],
    profilePicture: u.profilePicture || '',
    allowWithdrawal: u.allowWithdrawal === undefined ? 1 : u.allowWithdrawal,
    pin: u.pin || '1234',
    cotCode: u.cotCode || 'COT-123456',
    imfCode: u.imfCode || 'IMF-123456',
    address: u.address || '',
  }));
  const collections = [
    'transactions',
    'currencies',
    'branches',
    'beneficiaries',
    'cards',
    'tickets',
    'ticketMessages',
    'notices',
    'contactMessages',
    'counter',
  ];
  for (const key of collections) {
    if (out[key] === undefined) out[key] = seed[key];
  }
  out.version = SEED_VERSION;
  return out;
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return upgradeState(JSON.parse(raw));
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

  // Shared cloud persistence (Supabase). Hydrate once from the remote row;
  // afterwards every change is pushed back (debounced). localStorage remains
  // as an instant offline cache.
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from('app_state').select('data').eq('id', 1).maybeSingle();
        if (cancelled) return;
        if (data && data.data) {
          setState(upgradeState(data.data));
        } else {
          await supabase.from('app_state').upsert({
            id: 1,
            data: loadInitialState(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('Cloud hydrate failed:', e);
      }
      if (!cancelled) {
        hydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const t = setTimeout(() => {
      supabase
        .from('app_state')
        .upsert({ id: 1, data: state, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error('Cloud save failed:', error);
        });
    }, 800);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [session]);

  const notify = useCallback((type, text, duration) => setFlash({ type, text, at: Date.now(), duration }), []);
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

  const verifyCredentials = useCallback((email, password) => {
    const user = state.users.find(
      (u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase() && u.password === String(password),
    );
    if (!user) return { ok: false, error: 'These credentials do not match our records.' };
    if (user.userType === 'customer' && Number(user.status) !== 1) {
      return { ok: false, error: 'Your account is inactive. Please contact support.' };
    }
    return { ok: true, user };
  }, [state.users]);

  const signInWithPin = useCallback((user, pin) => {
    if (String(user.pin || '') !== String(pin || '')) {
      return { ok: false, error: 'The 4-digit passcode is invalid.' };
    }
    setSession({ userId: user.id, role: user.userType, signedInAt: new Date().toISOString() });
    return { ok: true, role: user.userType };
  }, []);

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
      verifyCredentials,
      signInWithPin,
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
