import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TableSkeleton } from './components/LoadingSkeleton';
import { useAppStore } from './store';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const DocumentVault = lazy(() => import('./pages/DocumentVault').then((module) => ({ default: module.DocumentVault })));
const DocumentUpload = lazy(() => import('./pages/DocumentUpload').then((module) => ({ default: module.DocumentUpload })));
const DocumentPreview = lazy(() => import('./pages/DocumentPreview').then((module) => ({ default: module.DocumentPreview })));
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

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
