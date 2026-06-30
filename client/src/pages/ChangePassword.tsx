import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useAppStore } from '../store';

export function ChangePassword() {
  const { user, refreshMe } = useAppStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const submit = async (event: FormEvent) => {
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
      <section className="page-header"><div><span className="eyebrow">Security</span><h1>{user?.hasLocalPassword ? 'Change Password' : 'Set Password'}</h1><p>Use at least 8 characters with uppercase, lowercase, number, and special character.</p></div></section>
      <form onSubmit={submit} className="page-panel max-w-xl">
        <div className="grid gap-4">
          {user?.hasLocalPassword && <input className="form-field" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />}
          <input className="form-field" type="password" placeholder="New strong password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <button className="btn-primary">Save Password</button>
        </div>
      </form>
    </div>
  );
}
