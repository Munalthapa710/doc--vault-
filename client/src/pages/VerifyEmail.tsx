import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';

export function VerifyEmail() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await authApi.verifyEmailOtp(email, otp);
      toast.success('Email verified');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <span className="eyebrow">Email verification</span><h1 className="mb-5 text-2xl font-black">Enter verification OTP</h1>
        <input className="form-field mb-4" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="form-field mb-4" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        <button className="btn-primary w-full">Verify Email</button>
      </form>
    </main>
  );
}
