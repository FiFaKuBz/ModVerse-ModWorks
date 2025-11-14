import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SessionCtx } from "./SessionContext";

// ----- Config (FR-SM-002)
const MINS = Number(import.meta.env.VITE_SESSION_MINUTES ?? 15); // default 15
const SESSION_MS      = Number(import.meta.env.VITE_SESSION_MS ?? MINS * 60 * 1000);
const WARN_BEFORE_MS  = Number(import.meta.env.VITE_SESSION_WARN_MS ?? 60 * 1000);
const KEY_EXP = "mv_session_exp";

export default function SessionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [expiresAt, setExpiresAt] = useState(() => Number(localStorage.getItem(KEY_EXP)) || 0);
  const [warn, setWarn] = useState(false);
  const timers = useRef({});

  const clearTimers = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
  }, []);

  const logout = useCallback(
    (expired = false) => {
      clearTimers();
      setWarn(false);
      setExpiresAt(0);
      localStorage.removeItem(KEY_EXP);
      navigate("/", { replace: true, state: expired ? { reason: "expired" } : undefined });
    },
    [clearTimers, navigate]
  );

  const schedule = useCallback(
    (nextExp) => {
      clearTimers();
      const msLeft = nextExp - Date.now();
      const warnAt = Math.max(0, msLeft - WARN_BEFORE_MS);
      timers.current.warn = setTimeout(() => setWarn(true), warnAt);
      timers.current.expire = setTimeout(() => logout(true), msLeft);
    },
    [clearTimers, logout]
  );

  const login = useCallback(() => {
    const next = Date.now() + SESSION_MS;
    localStorage.setItem(KEY_EXP, String(next));
    setWarn(false);
    setExpiresAt(next);
    schedule(next);
  }, [schedule]);

  const bump = useCallback(() => {
    if (!expiresAt) return;
    const next = Date.now() + SESSION_MS;
    localStorage.setItem(KEY_EXP, String(next));
    setWarn(false);
    setExpiresAt(next);
    schedule(next);
  }, [expiresAt, schedule]);

  useEffect(() => {
    if (expiresAt > Date.now()) {
      schedule(expiresAt);
      return clearTimers;
    }
    clearTimers();
    return clearTimers;
  }, [expiresAt, schedule, clearTimers]);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const onAct = () => bump();
    const evs = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    return () => evs.forEach((e) => window.removeEventListener(e, onAct));
  }, [expiresAt, bump]);

  useEffect(() => {
    if (expiresAt) bump();
  }, [location.pathname, expiresAt, bump]);

  const value = useMemo(
    () => ({ expiresAt, login, logout, warn, setWarn, bump }),
    [expiresAt, login, logout, warn, bump]
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
