export type ApiResponse<T> = {
  code: number;
  message: string;
  data?: T;
  errors: string[];
};

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

export type TokenResponse = {
  accessToken: string;
  user: User;
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
  storageByType: Record<string, number>;
  recentUploads: DocumentItem[];
  favoriteDocuments: DocumentItem[];
  lastDownloadedDocuments: DocumentItem[];
  largestDocuments: DocumentItem[];
  lastLoginAt?: string;
};
