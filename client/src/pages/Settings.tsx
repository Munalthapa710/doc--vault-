import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi, settingsApi, storageKeys } from '../api';
import { AppearanceSettings } from '../components/AppearanceSettings';
import { useAppStore } from '../store';

export function Settings() {
  const { user, refreshMe } = useAppStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [emailOtpLoginEnabled, setEmailOtpLoginEnabled] = useState(user?.emailOtpLoginEnabled ?? true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const mustSetPassword = !!user?.mustChangePassword;
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
  const saveSecretWord = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const updated = await settingsApi.updateSecretWord(secretWord);
      localStorage.setItem(storageKeys.user, JSON.stringify(updated));
      await refreshMe();
      setSecretWord('');
      toast.success('Secret word updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update secret word');
    }
  };
  return (
    <div className="grid gap-5">
      <section className="page-header"><div><span className="eyebrow">Account</span><h1>{mustSetPassword ? 'Set Password' : 'Settings'}</h1><p>{mustSetPassword ? 'Create a local password before using the document vault.' : 'Manage profile, password, appearance, OTP preference, and linked Google status.'}</p></div></section>
      {mustSetPassword && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">For security, your Google account must create a local password before other vault features are available.</section>}
      <section className={mustSetPassword ? 'grid gap-5 lg:grid-cols-1' : 'grid gap-5 lg:grid-cols-2'}>
        {!mustSetPassword && (
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
        )}
        <form onSubmit={changePassword} className={mustSetPassword ? 'page-panel max-w-xl' : 'page-panel'}>
          <h2 className="panel-title">{user?.hasLocalPassword ? 'Change Password' : 'Set Password'}</h2>
          <div className="grid gap-2">
            <p className="mb-2 text-sm font-bold text-slate-500">Use at least 8 characters with uppercase, lowercase, number, and special character.</p>
            {user?.hasLocalPassword && <input className="form-field" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />}
            <input className="form-field" type="password" placeholder="New strong password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button className="btn-primary">Save Password</button>
          </div>
        </form>
        {!mustSetPassword && (
          <form onSubmit={saveSecretWord} className="page-panel">
            <h2 className="panel-title">{user?.hasSecretWord ? 'Edit Secret Word' : 'Set Secret Word'}</h2>
            <div className="grid gap-3">
              <p className="text-sm font-bold text-slate-500">Use this as an alternative to OTP after entering your email and password. It is stored securely and cannot be viewed later.</p>
              <input className="form-field" type="password" placeholder="Secret word" value={secretWord} onChange={(e) => setSecretWord(e.target.value)} minLength={4} required />
              <div className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600">Status: {user?.hasSecretWord ? 'Secret word set' : 'Not set'}</div>
              <button className="btn-primary">Save Secret Word</button>
            </div>
          </form>
        )}
      </section>
      {!mustSetPassword && <AppearanceSettings />}
    </div>
  );
}
