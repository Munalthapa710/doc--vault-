import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success('Registration successful. Verify your email.');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <img className="login-logo" src="/vaultlogo.png" alt="Personal Vault" />
          <div><span className="eyebrow">Personal Vault</span><h1 className="text-2xl font-black">Create account</h1></div>
        </div>
        <div className="grid gap-4">
          <input className="form-field" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <input className="form-field" type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="form-field" type="password" placeholder="Strong password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </div>
        <p className="mt-5 text-sm font-bold text-slate-600">Already registered? <Link className="text-cyan-700" to="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
