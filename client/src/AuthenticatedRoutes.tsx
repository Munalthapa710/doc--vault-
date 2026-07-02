import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TableSkeleton } from './components/LoadingSkeleton';
import { loadDashboard, loadDocumentPreview, loadDocumentUpload, loadDocumentVault, loadSettings, preloadAuthenticatedRoutes } from './routePreloads';
import { useAppStore } from './store';

const Dashboard = lazy(() => loadDashboard().then((module) => ({ default: module.Dashboard })));
const DocumentVault = lazy(() => loadDocumentVault().then((module) => ({ default: module.DocumentVault })));
const DocumentUpload = lazy(() => loadDocumentUpload().then((module) => ({ default: module.DocumentUpload })));
const DocumentPreview = lazy(() => loadDocumentPreview().then((module) => ({ default: module.DocumentPreview })));
const Settings = lazy(() => loadSettings().then((module) => ({ default: module.Settings })));

function RouteFallback() {
  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6">
      <TableSkeleton rows={5} />
    </main>
  );
}

export function AuthenticatedRoutes() {
  const user = useAppStore((state) => state.user);
  const mustSetPassword = user?.mustChangePassword;

  useEffect(() => {
    preloadAuthenticatedRoutes();
  }, []);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          {mustSetPassword ? (
            <>
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/settings" replace />} />
            </>
          ) : (
            <>
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<DocumentVault />} />
          <Route path="documents/deleted" element={<DocumentVault />} />
          <Route path="documents/upload" element={<DocumentUpload />} />
          <Route path="documents/:id" element={<DocumentPreview />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/password" element={<Navigate to="/settings" replace />} />
            </>
          )}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
