import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi, setAccessToken } from '../api/client';
import type { TokenResponse, User } from '../types/api';

const tokenKey = 'personalVault.mobile.accessToken';
const userKey = 'personalVault.mobile.user';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isBooting: boolean;
  signIn: (response: TokenResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    async function hydrate() {
      const [savedToken, savedUser] = await Promise.all([
        SecureStore.getItemAsync(tokenKey),
        SecureStore.getItemAsync(userKey)
      ]);

      if (savedToken) {
        setAccessToken(savedToken);
        setToken(savedToken);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser) as User);
      }

      setIsBooting(false);
    }

    hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBooting,
      signIn: async (response) => {
        setAccessToken(response.accessToken);
        setToken(response.accessToken);
        setUser(response.user);
        await Promise.all([
          SecureStore.setItemAsync(tokenKey, response.accessToken),
          SecureStore.setItemAsync(userKey, JSON.stringify(response.user))
        ]);
      },
      signOut: async () => {
        try {
          await authApi.logoutAll();
        } catch {
          // Local sign-out should still work if the API is offline.
        }

        setAccessToken(null);
        setToken(null);
        setUser(null);
        await Promise.all([SecureStore.deleteItemAsync(tokenKey), SecureStore.deleteItemAsync(userKey)]);
      },
      refreshMe: async () => {
        const nextUser = await authApi.me();
        setUser(nextUser);
        await SecureStore.setItemAsync(userKey, JSON.stringify(nextUser));
      }
    }),
    [isBooting, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
