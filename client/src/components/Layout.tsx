import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, Shield, X } from 'lucide-react';
import clsx from 'clsx';
import { navGroups } from '../navigation';
import { useAppStore } from '../store';
import { ConfirmDialog } from './ConfirmDialog';

export function Layout() {
  const { logout, sidebarCollapsed, toggleSidebar, user } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const navigate = useNavigate();
  const bottomPaths = new Set(['/', '/documents', '/documents/upload', '/settings']);
  const bottomLabels: Record<string, string> = { '/': 'Home', '/documents': 'Vault', '/documents/upload': 'Upload', '/settings': 'Settings' };
  const bottomItems = navGroups.flatMap((group) => group.items).filter((item) => bottomPaths.has(item.path));

  const handleLogout = async () => {
    await logout();
    setConfirmLogout(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell min-h-screen text-slate-950">
      <aside className={clsx('vault-sidebar fixed inset-y-0 left-0 z-40 flex flex-col transition-all', sidebarCollapsed ? 'w-[76px]' : 'w-[244px]')}>
        <div className="sidebar-brand">
          <div className="brand-mark grid place-items-center rounded-xl bg-cyan-600 text-white"><Shield size={26} /></div>
          {!sidebarCollapsed && <strong className="block truncate text-[15px]">Personal Vault</strong>}
        </div>
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && <div className="sidebar-section-label">{group.label}</div>}
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.path} to={item.path} end className={({ isActive }) => clsx('sidebar-link group', isActive && 'active', sidebarCollapsed && 'justify-center')} title={item.title}>
                      <span className="sidebar-link-icon"><Icon size={18} /></span>
                      {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="sidebar-actions">
          <button className="collapse-control" type="button" onClick={toggleSidebar} title="Toggle sidebar">
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className={clsx('app-main transition-all', sidebarCollapsed ? 'pl-[76px]' : 'pl-[244px]')}>
        <header className="topbar sticky top-0 z-30 flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button className="icon-button mobile-drawer-trigger" type="button" onClick={() => setMobileMenuOpen(true)} title="Open menu" aria-label="Open menu"><Menu size={18} /></button>
            <div className="mobile-top-title">
              <Shield aria-hidden="true" />
              <strong>Personal</strong>
              <span>Vault</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm sm:block">{user?.fullName || 'Vault user'}</button>
            <button className="icon-button" type="button" title="Security alerts" aria-label="Security alerts"><Bell size={18} /></button>
            <button className="icon-button text-rose-700" type="button" onClick={() => setConfirmLogout(true)} title="Logout" aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-6 py-6">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} end className={({ isActive }) => clsx('mobile-bottom-link', isActive && 'active')}>
              <Icon size={19} />
              <span>{bottomLabels[item.path] || item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu-layer">
          <button className="mobile-menu-backdrop" type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="mobile-menu-panel" aria-label="Mobile navigation">
            <div className="mobile-menu-head">
              <div className="mobile-menu-brand">
                <Shield />
                <div><span className="eyebrow">Navigation</span><strong>Personal Vault</strong></div>
              </div>
              <button className="icon-button" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
            </div>
            <nav className="mobile-menu-list">
              {navGroups.map((group) => (
                <section key={group.label}>
                  <div className="sidebar-section-label">{group.label}</div>
                  <div className="mobile-menu-items">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return <NavLink key={item.path} to={item.path} end className={({ isActive }) => clsx('mobile-menu-link', isActive && 'active')} onClick={() => setMobileMenuOpen(false)}><Icon size={18} /><span>{item.title}</span></NavLink>;
                    })}
                  </div>
                </section>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <ConfirmDialog open={confirmLogout} title="Log out?" message="You will need to sign in again before accessing private documents." confirmLabel="Log Out" tone="danger" onCancel={() => setConfirmLogout(false)} onConfirm={handleLogout} />
    </div>
  );
}
