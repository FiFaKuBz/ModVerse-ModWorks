import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SessionCtx = createContext(null);
export const useSession = () => useContext(SessionCtx);

// ----- Config (FR-SM-002)
const MINS = Number(import.meta.env.VITE_SESSION_MINUTES ?? 15); // default 15
const SESSION_MS = MINS * 60 * 1000;
const WARN_BEFORE_MS = 60 * 1000; // warn 60s before (FR-SM-003)
const KEY_EXP = "mv_session_exp";

export default function SessionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [expiresAt, setExpiresAt] = useState(() => Number(localStorage.getItem(KEY_EXP)) || 0);
  const [warn, setWarn] = useState(false);
  const timers = useRef({});

  const clearTimers = () => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
  };

  const schedule = (nextExp) => {
    clearTimers();
    const msLeft = nextExp - Date.now();
    const warnAt = Math.max(0, msLeft - WARN_BEFORE_MS);
    timers.current.warn = setTimeout(() => setWarn(true), warnAt);
    timers.current.expire = setTimeout(() => logout(true), msLeft);
  };

  const login = () => {
    const next = Date.now() + SESSION_MS;
    localStorage.setItem(KEY_EXP, String(next));
    setWarn(false);
    setExpiresAt(next);
    schedule(next);
  };

  const bump = () => {
    if (!expiresAt) return;
    const next = Date.now() + SESSION_MS;
    localStorage.setItem(KEY_EXP, String(next));
    setWarn(false);
    setExpiresAt(next);
    schedule(next);
  };

  const logout = (expired = false) => {
    clearTimers();
    setWarn(false);
    setExpiresAt(0);
    localStorage.removeItem(KEY_EXP);
    // FR-SM-005 / 006: redirect with reason
    navigate("/", { replace: true, state: expired ? { reason: "expired" } : undefined });
  };

  // init
  useEffect(() => {
    if (expiresAt > Date.now()) schedule(expiresAt);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // user activity -> bump (FR-SM-001/004)
  useEffect(() => {
    if (!expiresAt) return;
    const onAct = () => bump();
    const evs = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    return () => evs.forEach((e) => window.removeEventListener(e, onAct));
  }, [expiresAt]);

  // route change also counts as activity
  useEffect(() => { if (expiresAt) bump(); }, [location.pathname]);

  const value = useMemo(() => ({ expiresAt, login, logout, warn, setWarn, bump }), [expiresAt, warn]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
