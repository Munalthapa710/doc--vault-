import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';

export function Login({ mode = 'password' }: { mode?: 'password' | 'otp' }) {
  const navigate = useNavigate();
  const { requestLoginOtp, verifyLoginOtp, pendingLoginEmail } = useAppStore();
  const [email, setEmail] = useState(pendingLoginEmail);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'otp') {
        await verifyLoginOtp(email, otp);
        toast.success('Signed in securely');
        navigate('/', { replace: true });
      } else {
        await requestLoginOtp(email, password);
        toast.success('OTP sent to your email');
        navigate('/login/otp');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to continue');
    } finally {
      setLoading(false);
    }
  };

  const startGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error('Google client id is not configured');
      return;
    }
    const nonce = crypto.randomUUID();
    sessionStorage.setItem('personalVault.googleNonce', nonce);
    const redirectUri = `${window.location.origin}/auth/google-callback`;
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'id_token');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('nonce', nonce);
    window.location.assign(url.toString());
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-600 text-white"><ShieldCheck /></span>
          <div><span className="eyebrow">Personal Vault</span><h1 className="text-2xl font-black">{mode === 'otp' ? 'Verify login OTP' : 'Secure sign in'}</h1></div>
        </div>
        <div className="grid gap-4">
          <input className="form-field" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode === 'otp' ? (
            <input className="form-field" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          ) : (
            <input className="form-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}
          <button className="btn-primary w-full" disabled={loading}><LockKeyhole size={18} />{loading ? 'Please wait...' : mode === 'otp' ? 'Verify OTP' : 'Send OTP'}</button>
          {mode !== 'otp' && <button className="btn-secondary w-full" type="button" onClick={startGoogleLogin}>Continue with Google</button>}
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold text-cyan-700">
          <Link to="/register">Create account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </main>
  );
}
