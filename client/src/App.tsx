import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TableSkeleton } from './components/LoadingSkeleton';

const AuthenticatedRoutes = lazy(() => import('./AuthenticatedRoutes').then((module) => ({ default: module.AuthenticatedRoutes })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then((module) => ({ default: module.VerifyEmail })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((module) => ({ default: module.ResetPassword })));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback').then((module) => ({ default: module.GoogleCallback })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, left: 0 }), [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6">
      <TableSkeleton rows={5} />
    </main>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login/otp" element={<Login mode="otp" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/google-callback" element={<GoogleCallback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AuthenticatedRoutes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
