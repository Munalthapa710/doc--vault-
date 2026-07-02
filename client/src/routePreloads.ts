const routeLoaders = {
  dashboard: () => import('./pages/Dashboard'),
  documentVault: () => import('./pages/DocumentVault'),
  documentUpload: () => import('./pages/DocumentUpload'),
  documentPreview: () => import('./pages/DocumentPreview'),
  settings: () => import('./pages/Settings')
};

const authRouteEntries = Object.values(routeLoaders);

const schedule = (callback: () => void) => {
  const requestIdle = window.requestIdleCallback;
  if (typeof requestIdle === 'function') {
    requestIdle(callback, { timeout: 2000 });
    return;
  }
  globalThis.setTimeout(callback, 250);
};

export const preloadAuthenticatedRoutes = () => {
  schedule(() => {
    authRouteEntries.forEach((load) => {
      void load();
    });
  });
};

export const preloadRouteForPath = (path: string) => {
  if (path === '/') {
    void routeLoaders.dashboard();
    return;
  }
  if (path === '/documents' || path === '/documents/deleted') {
    void routeLoaders.documentVault();
    return;
  }
  if (path === '/documents/upload') {
    void routeLoaders.documentUpload();
    return;
  }
  if (path.startsWith('/documents/')) {
    void routeLoaders.documentPreview();
    return;
  }
  if (path.startsWith('/settings')) {
    void routeLoaders.settings();
  }
};

export const loadDashboard = routeLoaders.dashboard;
export const loadDocumentVault = routeLoaders.documentVault;
export const loadDocumentUpload = routeLoaders.documentUpload;
export const loadDocumentPreview = routeLoaders.documentPreview;
export const loadSettings = routeLoaders.settings;
