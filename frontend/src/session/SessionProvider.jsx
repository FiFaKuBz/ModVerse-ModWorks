import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SessionCtx = createContext(null);
export const useSession = () => useContext(SessionCtx);

const STORAGE_KEY = "mv_session_exp";
const SESSION_MS = 0.5 * 60 * 1000; // ⏰ 2 minutes for demo (change to 30 * 60 * 1000 in production)
const WARN_BEFORE_MS = 0.5*30 * 1000; // show warning 30s before expire

export default function SessionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expiresAt, setExpiresAt] = useState(() => Number(localStorage.getItem(STORAGE_KEY)) || 0);
  const [warn, setWarn] = useState(false);
  const timers = useRef({});

  const clearTimers = () => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
  };

  const schedule = (nextExp) => {
    clearTimers();
    const now = Date.now();
    const msLeft = nextExp - now;
    const warnAt = Math.max(0, msLeft - WARN_BEFORE_MS);
    timers.current.warn = setTimeout(() => setWarn(true), warnAt);
    timers.current.expire = setTimeout(() => logout(true), msLeft);
  };

  const bump = () => {
    if (!expiresAt) return;
    const next = Date.now() + SESSION_MS;
    localStorage.setItem(STORAGE_KEY, String(next));
    setExpiresAt(next);
    setWarn(false);
    schedule(next);
  };

  const login = () => {
    const next = Date.now() + SESSION_MS;
    localStorage.setItem(STORAGE_KEY, String(next));
    setExpiresAt(next);
    schedule(next);
  };

  const logout = (expired = false) => {
    clearTimers();
    setWarn(false);
    setExpiresAt(0);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/", { replace: true, state: expired ? { reason: "expired" } : undefined });
  };

  useEffect(() => {
    if (expiresAt && expiresAt > Date.now()) schedule(expiresAt);
    return clearTimers;
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const onAct = () => bump();
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((e) =>
      window.addEventListener(e, onAct, { passive: true })
    );
    return () =>
      ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((e) =>
        window.removeEventListener(e, onAct)
      );
  }, [expiresAt]);

  useEffect(() => {
    if (expiresAt) bump();
  }, [location.pathname]);

  const value = useMemo(() => ({ expiresAt, login, logout, warn, setWarn, bump }), [expiresAt, warn]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
