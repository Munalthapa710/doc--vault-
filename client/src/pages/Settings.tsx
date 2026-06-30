import { FormEvent, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi } from '../api';
import { useAppStore } from '../store';

export function Settings() {
  const { user, refreshMe } = useAppStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [emailOtpLoginEnabled, setEmailOtpLoginEnabled] = useState(user?.emailOtpLoginEnabled ?? true);
  const { data: sessions } = useQuery({ queryKey: ['sessions'], queryFn: settingsApi.sessions });
  useEffect(() => { setFullName(user?.fullName || ''); setEmailOtpLoginEnabled(user?.emailOtpLoginEnabled ?? true); }, [user]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await settingsApi.updateProfile({ fullName, emailOtpLoginEnabled });
    await refreshMe();
    toast.success('Profile updated');
  };
  return (
    <div className="grid gap-5">
      <section className="page-header"><div><span className="eyebrow">Account</span><h1>Settings</h1><p>Manage profile, OTP preference, sessions, and linked Google status.</p></div></section>
      <section className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submit} className="page-panel">
          <h2 className="panel-title">Profile</h2>
          <div className="grid gap-4">
            <input className="form-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <input className="form-field" value={user?.email || ''} disabled />
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={emailOtpLoginEnabled} onChange={(e) => setEmailOtpLoginEnabled(e.target.checked)} /> Enable email OTP login</label>
            <div className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">Google linked: {user?.authProvider.includes('Google') ? 'Yes' : 'No'}</div>
            <button className="btn-primary">Save Profile</button>
          </div>
        </form>
        <div className="page-panel">
          <h2 className="panel-title">Active Sessions</h2>
          <div className="grid gap-2">
            {(sessions || []).map((session) => <div key={session.id} className="rounded-xl bg-slate-50 p-3 text-sm font-bold"><div>{session.ipAddress || 'Unknown IP'}</div><div className="mt-1 text-xs text-slate-500">{new Date(session.createdAt).toLocaleString()}</div></div>)}
            {(!sessions || sessions.length === 0) && <p className="text-sm font-bold text-slate-500">No active sessions listed.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
