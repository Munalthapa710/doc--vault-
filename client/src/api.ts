import axios from 'axios';

const resolveApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const trimmedUrl = rawUrl.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`;
};

export const storageKeys = {
  accessToken: 'personalVault.accessToken',
  refreshToken: 'personalVault.refreshToken',
  user: 'personalVault.user'
};

export const api = axios.create({ baseURL: resolveApiBaseUrl() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(storageKeys.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem(storageKeys.refreshToken);
    if (error.response?.status === 401 && refreshToken && !original?._retry && original.url !== '/auth/refresh-token') {
      original._retry = true;
      try {
        const response = await api.post('/auth/refresh-token', { refreshToken });
        const data = response.data.data;
        localStorage.setItem(storageKeys.accessToken, data.accessToken);
        localStorage.setItem(storageKeys.refreshToken, data.refreshToken);
        localStorage.setItem(storageKeys.user, JSON.stringify(data.user));
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError) && [400, 401, 403].includes(refreshError.response?.status || 0)) {
          localStorage.removeItem(storageKeys.accessToken);
          localStorage.removeItem(storageKeys.refreshToken);
          localStorage.removeItem(storageKeys.user);
          if (!window.location.pathname.startsWith('/login')) window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export type User = {
  id: string;
  fullName: string;
  email: string;
  authProvider: string;
  isEmailVerified: boolean;
  mustChangePassword: boolean;
  hasLocalPassword: boolean;
  hasSecretWord: boolean;
  emailOtpLoginEnabled: boolean;
  lastLoginAt?: string;
};

export type DocumentItem = {
  id: string;
  displayName: string;
  originalFileName: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  tags: string[];
  isFavorite: boolean;
  isDeleted: boolean;
  uploadedAt: string;
  updatedAt: string;
  lastDownloadedAt?: string;
  canPreview: boolean;
};

export type ListResponse<T> = {
  rows: T[];
  total: number;
  page: number;
  pages: number;
};

export type DashboardSummary = {
  totalDocuments: number;
  totalStorageUsed: number;
  documentsByType: Record<string, number>;
  recentUploads: DocumentItem[];
  favoriteDocuments: DocumentItem[];
  lastDownloadedDocuments: DocumentItem[];
  lastLoginAt?: string;
};

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

export const authApi = {
  register: (payload: { fullName: string; email: string; password: string }) => api.post('/auth/register', payload),
  verifyEmailOtp: (email: string, otp: string) => api.post('/auth/verify-email-otp', { email, otp, purpose: 'EmailVerification' }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  loginWithSecretWord: async (email: string, password: string, secretWord: string) => unwrap<{ accessToken: string; refreshToken: string; user: User }>(await api.post('/auth/login-secret-word', { email, password, secretWord })),
  verifyLoginOtp: async (email: string, otp: string) => unwrap<{ accessToken: string; refreshToken: string; user: User }>(await api.post('/auth/verify-login-otp', { email, otp, purpose: 'Login' })),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otp: string, newPassword: string) => api.post('/auth/reset-password', { email, otp, newPassword }),
  googleLogin: async (idToken: string) => unwrap<{ accessToken: string; refreshToken: string; user: User }>(await api.post('/auth/google-login', { idToken })),
  changePassword: (currentPassword: string | undefined, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }),
  me: async () => unwrap<User>(await api.get('/auth/me')),
  logoutAll: () => api.post('/auth/logout-all')
};

export const documentApi = {
  list: async (params: Record<string, unknown>) => unwrap<ListResponse<DocumentItem>>(await api.get('/documents', { params })),
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap<DocumentItem>(await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  get: async (id: string) => unwrap<DocumentItem>(await api.get(`/documents/${id}`)),
  update: async (id: string, payload: { displayName: string; tags: string[] }) => unwrap<DocumentItem>(await api.put(`/documents/${id}`, payload)),
  favorite: async (id: string) => unwrap<DocumentItem>(await api.patch(`/documents/${id}/favorite`)),
  delete: (id: string) => api.delete(`/documents/${id}`),
  restore: (id: string) => api.post(`/documents/${id}/restore`),
  permanentDelete: (id: string) => api.delete(`/documents/${id}/permanent`),
  previewUrl: (id: string) => `${resolveApiBaseUrl()}/documents/${id}/preview`,
  downloadUrl: (id: string) => `${resolveApiBaseUrl()}/documents/${id}/download`
};

export const dashboardApi = {
  summary: async () => unwrap<DashboardSummary>(await api.get('/dashboard/summary'))
};

export const settingsApi = {
  profile: async () => unwrap<User>(await api.get('/settings/profile')),
  updateProfile: async (payload: { fullName: string; emailOtpLoginEnabled?: boolean }) => unwrap<User>(await api.put('/settings/profile', payload)),
  updateSecretWord: async (secretWord: string) => unwrap<User>(await api.post('/settings/secret-word', { secretWord })),
  security: async () => unwrap<User>(await api.get('/settings/security')),
  sessions: async () => unwrap<Array<{ id: string; createdAt: string; expiresAt: string; ipAddress: string; userAgent: string }>>(await api.get('/settings/sessions'))
};
