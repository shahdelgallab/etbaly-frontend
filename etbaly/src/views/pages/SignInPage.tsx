import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import { useAppSelector } from '../../store/hooks';
import PageWrapper from '../components/PageWrapper';
import AuthPanel from '../components/AuthPanel';
import { FormField, OAuthButton } from '../components/FormField';

// ─── Validation schema ────────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const redirectTo = (location.state as { from?: string })?.from ?? '/';
  const { user }   = useAppSelector(s => s.auth);

  // Already signed in → redirect
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const { login, googleLogin, loading, error } = useAuthViewModel();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitted },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });

  const onSubmit = (data: FormData) =>
    login({ email: data.email, password: data.password }, redirectTo);

  // Field is "valid" once touched/submitted with no error
  const ok = (field: keyof FormData) =>
    (touchedFields[field] || isSubmitted) && !errors[field];

  return (
    <PageWrapper className="flex items-center justify-center min-h-screen bg-circuit px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl grid lg:grid-cols-2 glass border border-border rounded-3xl overflow-hidden shadow-glow"
      >
        {/* ── Left decorative panel ── */}
        <AuthPanel />

        {/* ── Right form panel ── */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-exo mb-8 w-fit"
          >
            <ArrowLeft size={13} /> Back to home
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-orbitron text-2xl font-bold text-text mb-1.5">Welcome back</h1>
            <p className="text-text-muted text-sm font-exo">Sign in to your Etbaly account</p>
          </div>

          {/* Server error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', x: [0, -6, 6, -6, 6, 0] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo overflow-hidden"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              id="email"
              label="Email address"
              type="email"
              icon={<Mail size={15} />}
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              success={ok('email')}
              {...register('email')}
            />

            <div>
              <FormField
                id="password"
                label="Password"
                type="password"
                icon={<Lock size={15} />}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                success={ok('password')}
                {...register('password')}
              />
              <div className="flex justify-end mt-1.5">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-exo">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('remember')}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-text-muted font-exo">Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2"><LogIn size={16} /> Sign In</span>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-exo shrink-0">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            <OAuthButton provider="google" onClick={() => googleLogin(redirectTo)} />
            <OAuthButton provider="github" />
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-text-muted font-exo">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
