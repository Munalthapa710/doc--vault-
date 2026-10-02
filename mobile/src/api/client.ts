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

export function getApiErrorMessage(error: unknown, fallback = 'Request failed') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: unknown } | undefined;
    if (data?.message) return data.message;
    if (Array.isArray(data?.errors) && data.errors.length > 0) return data.errors.join('\n');
    if (typeof data?.errors === 'string') return data.errors;
    return error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && !error.response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      const networkFailed = error.code === 'ERR_NETWORK' || error.message === 'Network Error';

      if (timedOut || networkFailed) {
        const address = error.config?.baseURL || API_BASE_URL;
        const reason = timedOut ? 'The server did not respond in time.' : 'Cannot connect to the server.';
        // Preserve Axios metadata for callers while providing an actionable alert.
        error.message = `${reason} Server: ${address}. Check that the backend is running and reachable from your phone. For a local server, connect both devices to the same Wi-Fi and allow Local Network access in iPhone Settings.`;
      }
    }

    if (axios.isAxiosError(error) && error.response) {
      error.message = getApiErrorMessage(error, error.message);
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
