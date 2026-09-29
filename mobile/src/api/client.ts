import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import type { ApiResponse, DashboardSummary, DocumentItem, ListResponse, TokenResponse, User } from '../types/api';

const API_PORT = '5000';
const API_PATH = '/api';
const IOS_LAN_API_HOST = '192.168.1.71';
const explicitBaseUrl = process.env.EXPO_PUBLIC_API_URL;

function isLocalNetworkHost(host: string) {
  return (
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)
  );
}

function getExpoHost() {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  const host = scriptURL?.match(/^[a-z]+:\/\/([^/:]+)(?::\d+)?/i)?.[1];

  if (!host || host === 'localhost' || host === '127.0.0.1' || !isLocalNetworkHost(host)) {
    return undefined;
  }

  return host;
}

const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : IOS_LAN_API_HOST;
const defaultBaseUrl = `http://${getExpoHost() || fallbackHost}:${API_PORT}${API_PATH}`;

export const API_BASE_URL = (explicitBaseUrl || defaultBaseUrl).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.message === 'Network Error') {
      return Promise.reject(
        new Error(
          `Cannot reach the API at ${API_BASE_URL}. Make sure the backend is running, your iPhone is on the same Wi-Fi as this computer, and EXPO_PUBLIC_API_URL points to your computer IP.`
        )
      );
    }

    return Promise.reject(error);
  }
);

export function setAccessToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function unwrap<T>(response: { data: ApiResponse<T> }) {
  if (response.data.data === undefined) {
    throw new Error(response.data.message || 'No response data.');
  }

  return response.data.data;
}

export const authApi = {
  register: (payload: { fullName: string; email: string; password: string }) => api.post('/auth/register', payload),
  requestLoginOtp: (email: string, password: string) => api.post('/auth/login', { email, password }),
  verifyEmailOtp: (email: string, otp: string) => api.post('/auth/verify-email-otp', { email, otp, purpose: 'EmailVerification' }),
  verifyLoginOtp: async (email: string, otp: string) => unwrap<TokenResponse>(await api.post('/auth/verify-login-otp', { email, otp, purpose: 'Login' })),
  loginWithSecretWord: async (email: string, password: string, secretWord: string) =>
    unwrap<TokenResponse>(await api.post('/auth/login-secret-word', { email, password, secretWord })),
  me: async () => unwrap<User>(await api.get('/auth/me')),
  logoutAll: () => api.post('/auth/logout-all')
};

export const dashboardApi = {
  summary: async () => unwrap<DashboardSummary>(await api.get('/dashboard/summary'))
};

export const documentApi = {
  list: async (params: Record<string, unknown>) => unwrap<ListResponse<DocumentItem>>(await api.get('/documents', { params })),
  favorite: async (id: string) => unwrap<DocumentItem>(await api.patch(`/documents/${id}/favorite`)),
  delete: (id: string) => api.delete(`/documents/${id}`),
  upload: async (file: { uri: string; name: string; mimeType?: string }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream'
    } as unknown as Blob);

    return unwrap<DocumentItem>(
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  }
};

export const settingsApi = {
  profile: async () => unwrap<User>(await api.get('/settings/profile')),
  updateProfile: async (payload: { fullName: string; emailOtpLoginEnabled?: boolean }) =>
    unwrap<User>(await api.put('/settings/profile', payload)),
  updateSecretWord: async (secretWord: string) => unwrap<User>(await api.post('/settings/secret-word', { secretWord }))
};
