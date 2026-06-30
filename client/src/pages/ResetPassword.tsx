import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';

export function ResetPassword() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await authApi.resetPassword(email, otp, newPassword);
      toast.success('Password reset successful');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to reset password');
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <span className="eyebrow">Password reset</span><h1 className="mb-5 text-2xl font-black">Set a new password</h1>
        <div className="grid gap-4">
          <input className="form-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="form-field" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <input className="form-field" type="password" placeholder="New strong password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <button className="btn-primary w-full">Reset Password</button>
        </div>
      </form>
    </main>
  );
}
