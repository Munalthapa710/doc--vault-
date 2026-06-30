import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi, settingsApi } from '../api';
import { AppearanceSettings } from '../components/AppearanceSettings';
import { useAppStore } from '../store';

export function Settings() {
  const { user, refreshMe } = useAppStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [emailOtpLoginEnabled, setEmailOtpLoginEnabled] = useState(user?.emailOtpLoginEnabled ?? true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  useEffect(() => { setFullName(user?.fullName || ''); setEmailOtpLoginEnabled(user?.emailOtpLoginEnabled ?? true); }, [user]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await settingsApi.updateProfile({ fullName, emailOtpLoginEnabled });
    await refreshMe();
    toast.success('Profile updated');
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await authApi.changePassword(user?.hasLocalPassword ? currentPassword : undefined, newPassword);
      await refreshMe();
      setCurrentPassword('');
      setNewPassword('');
      toast.success(user?.hasLocalPassword ? 'Password changed' : 'Local password created');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update password');
    }
  };
  return (
    <div className="grid gap-5">
      <section className="page-header"><div><span className="eyebrow">Account</span><h1>Settings</h1><p>Manage profile, password, appearance, OTP preference, and linked Google status.</p></div></section>
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
        <form onSubmit={changePassword} className="page-panel">
          <h2 className="panel-title">{user?.hasLocalPassword ? 'Change Password' : 'Set Password'}</h2>
          <div className="grid gap-2">
            <p className="mb-2 text-sm font-bold text-slate-500">Use at least 8 characters with uppercase, lowercase, number, and special character.</p>
            {user?.hasLocalPassword && <input className="form-field" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />}
            <input className="form-field" type="password" placeholder="New strong password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button className="btn-primary">Save Password</button>
          </div>
        </form>
      </section>
      <AppearanceSettings />
    </div>
  );
}
