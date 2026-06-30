import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useAppStore } from '../store';

export function GoogleCallback() {
  const navigate = useNavigate();
  const setSession = useAppStore((state) => state.setSession);

  useEffect(() => {
    const run = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const query = new URLSearchParams(window.location.search);
        const idToken = hash.get('id_token') || query.get('id_token') || query.get('credential');
        if (!idToken) throw new Error('Google did not return an ID token.');
        const response = await authApi.googleLogin(idToken);
        setSession(response.accessToken, response.refreshToken, response.user);
        toast.success('Signed in with Google');
        navigate(response.user.mustChangePassword ? '/settings/password' : '/', { replace: true });
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || 'Google login failed');
        navigate('/login', { replace: true });
      }
    };
    run();
  }, [navigate, setSession]);

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-sm font-bold text-slate-600">Completing Google sign in...</main>;
}
