import { create } from 'zustand';
import { api, authApi, storageKeys, User } from './api';

type AppState = {
  user: User | null;
  pendingLoginEmail: string;
  sidebarCollapsed: boolean;
  requestLoginOtp: (email: string, password: string) => Promise<void>;
  loginWithSecretWord: (email: string, password: string, secretWord: string) => Promise<void>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  setSession: (accessToken: string, refreshToken: string, user: User) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  toggleSidebar: () => void;
};

const readStoredUser = () => {
  const rawUser = localStorage.getItem(storageKeys.user);
  if (!rawUser || rawUser === 'undefined' || rawUser === 'null') return null;
  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(storageKeys.accessToken);
    localStorage.removeItem(storageKeys.refreshToken);
    localStorage.removeItem(storageKeys.user);
    return null;
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  user: readStoredUser(),
  pendingLoginEmail: sessionStorage.getItem('personalVault.pendingLoginEmail') || '',
  sidebarCollapsed: false,
  requestLoginOtp: async (email, password) => {
    await authApi.login(email, password);
    sessionStorage.setItem('personalVault.pendingLoginEmail', email);
    set({ pendingLoginEmail: email });
  },
  loginWithSecretWord: async (email, password, secretWord) => {
    const response = await authApi.loginWithSecretWord(email, password, secretWord);
    get().setSession(response.accessToken, response.refreshToken, response.user);
  },
  verifyLoginOtp: async (email, otp) => {
    const response = await authApi.verifyLoginOtp(email, otp);
    get().setSession(response.accessToken, response.refreshToken, response.user);
    sessionStorage.removeItem('personalVault.pendingLoginEmail');
  },
  setSession: (accessToken, refreshToken, user) => {
    localStorage.setItem(storageKeys.accessToken, accessToken);
    localStorage.setItem(storageKeys.refreshToken, refreshToken);
    localStorage.setItem(storageKeys.user, JSON.stringify(user));
    set({ user });
  },
  refreshMe: async () => {
    const user = await authApi.me();
    localStorage.setItem(storageKeys.user, JSON.stringify(user));
    set({ user });
  },
  logout: async () => {
    const refreshToken = localStorage.getItem(storageKeys.refreshToken);
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem(storageKeys.accessToken);
      localStorage.removeItem(storageKeys.refreshToken);
      localStorage.removeItem(storageKeys.user);
      set({ user: null });
    }
  },
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed })
}));
