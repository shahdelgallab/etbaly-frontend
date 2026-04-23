import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './views/components/Navbar';
import Footer from './views/components/Footer';
import CartSidebar from './views/components/CartSidebar';
import ThemeToggle from './views/components/ThemeToggle';
import CustomCursor from './views/components/CustomCursor';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setUser, setHydrating } from './store/slices/authSlice';
import { tokenStorage } from './services/api';
import { userService } from './services/userService';
import { initLenis, destroyLenis } from './lib/lenis';

// ─── Eager-loaded (above the fold) ───────────────────────────────────────────
import LandingPage from './views/pages/LandingPage';

// ─── Lazy-loaded (code-split per route) ──────────────────────────────────────
const SignInPage    = lazy(() => import('./views/pages/SignInPage'));
const SignUpPage    = lazy(() => import('./views/pages/SignUpPage'));
const VerifyOtpPage = lazy(() => import('./views/pages/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() => import('./views/pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./views/pages/ResetPasswordPage'));
const ProductsPage  = lazy(() => import('./views/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./views/pages/ProductDetailPage'));
const ChatPage      = lazy(() => import('./views/pages/ChatPage'));
const UploadPage    = lazy(() => import('./views/pages/UploadPage'));
const CheckoutPage  = lazy(() => import('./views/pages/CheckoutPage'));
const ProfilePage   = lazy(() => import('./views/pages/ProfilePage'));
const AdminPage     = lazy(() => import('./views/pages/AdminPage'));

// ─── Route-level loading fallback ────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen pt-16 flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full">
      <div className="shimmer h-10 w-48 rounded-xl" />
      <div className="shimmer h-64 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="shimmer h-40 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = initLenis();
    return () => destroyLenis();
  }, []);

  // Re-hydrate user from token on every app load (Redux has no persistence)
  useEffect(() => {
    if (user) { dispatch(setHydrating(false)); return; }
    const token = tokenStorage.getAccess();
    if (!token) { dispatch(setHydrating(false)); return; }
    userService.getMe()
      .then(apiUser => dispatch(setUser(apiUser)))
      .catch(() => tokenStorage.clearTokens())
      .finally(() => dispatch(setHydrating(false)));
  }, [dispatch, user]);

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Custom cursor */}
      <CustomCursor />
      
      <Navbar />

      <main className="flex-1">
        {/*
          AnimatePresence needs the key to change on navigation so exit
          animations fire before the next page mounts.
        */}
        <AnimatePresence mode="wait" initial={false}>
          <Suspense fallback={<PageSkeleton />}>
            <Routes location={location} key={location.pathname}>

              {/* ── Public routes ── */}
              <Route path="/"        element={<LandingPage />} />
              <Route path="/signin"  element={<SignInPage />} />
              <Route path="/signup"  element={<SignUpPage />} />
              <Route path="/verify-otp"       element={<VerifyOtpPage />} />
              <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
              <Route path="/reset-password"   element={<ResetPasswordPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />

              {/* ── Protected routes ── */}
              <Route path="/chat" element={
                <ChatPage />
              } />
              <Route path="/upload" element={
                <UploadPage />
              } />
              <Route path="/checkout" element={
               <CheckoutPage />
              } />
              <Route path="/profile" element={
               <ProfilePage />
              } />
              <Route path="/admin" element={
               <AdminPage />
              } />

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      <Footer />

      {/* ── Global overlays (outside Routes, always mounted) ── */}
      <CartSidebar />
      <ThemeToggle floating />
    </div>
  );
}
