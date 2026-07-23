import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { sessionEvents, storageKeys } from '../api';
import { useAppStore } from '../store';

const SESSION_CHECK_INTERVAL_MS = 30_000;
const REFRESH_GRACE_MS = 5_000;

const getTokenExpiryMs = (token: string) => {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4), '=');
    const decoded = JSON.parse(atob(paddedPayload)) as { exp?: number };
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export function SessionTimeoutWatcher() {
  const user = useAppStore((state) => state.user);
  const clearSession = useAppStore((state) => state.clearSession);
  const refreshSession = useAppStore((state) => state.refreshSession);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const expireSession = () => {
      clearSession();
      if (!location.pathname.startsWith('/login')) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login', { replace: true });
      }
    };

    const onSessionExpired = () => expireSession();
    window.addEventListener(sessionEvents.expired, onSessionExpired);

    if (!user) {
      return () => window.removeEventListener(sessionEvents.expired, onSessionExpired);
    }

    let refreshing = false;
    const checkSession = async () => {
      if (refreshing) return;
      const token = localStorage.getItem(storageKeys.accessToken);
      const expiresAt = token ? getTokenExpiryMs(token) : null;
      if (!expiresAt) {
        expireSession();
        return;
      }

      if (Date.now() < expiresAt + REFRESH_GRACE_MS) return;

      refreshing = true;
      try {
        await refreshSession();
      } catch {
        expireSession();
      } finally {
        refreshing = false;
      }
    };

    void checkSession();
    const intervalId = window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(sessionEvents.expired, onSessionExpired);
    };
  }, [clearSession, location.pathname, navigate, refreshSession, user]);

  return null;
}
