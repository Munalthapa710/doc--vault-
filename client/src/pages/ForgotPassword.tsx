import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await authApi.forgotPassword(email);
    toast.success('If the account exists, reset OTP has been sent');
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <span className="eyebrow">Password recovery</span><h1 className="mb-5 text-2xl font-black">Send reset OTP</h1>
        <input className="form-field mb-4" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="btn-primary w-full">Send OTP</button>
      </form>
    </main>
  );
}
