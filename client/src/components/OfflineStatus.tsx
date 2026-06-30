import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CloudOff, FileArchive, LayoutDashboard, Settings } from 'lucide-react';

export function OfflineStatus() {
  const [offline, setOffline] = useState(() => navigator.onLine === false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <aside className="offline-status" role="status" aria-live="polite">
      <div className="offline-status-icon">
        <CloudOff size={19} />
      </div>
      <div className="offline-status-copy">
        <strong>Offline mode</strong>
        <span>Cached screens are available. Private documents and API data need a connection.</span>
      </div>
      <nav className="offline-status-actions" aria-label="Offline shortcuts">
        <NavLink to="/" aria-label="Dashboard"><LayoutDashboard size={17} /></NavLink>
        <NavLink to="/documents" aria-label="Documents"><FileArchive size={17} /></NavLink>
        <NavLink to="/settings" aria-label="Settings"><Settings size={17} /></NavLink>
      </nav>
    </aside>
  );
}
