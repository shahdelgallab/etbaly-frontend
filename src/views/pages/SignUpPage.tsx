import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import { useAppSelector } from '../../store/hooks';
import PageWrapper from '../components/PageWrapper';
import AuthPanel from '../components/AuthPanel';
import { FormField, PasswordStrengthBar, OAuthButton } from '../components/FormField';

// ─── Validation schema — matches backend rules exactly ───────────────────────

const schema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName:  z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email:     z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password:  z
      .string()
      .min(6,   'Password must be at least 6 characters')
      .max(128, 'Password is too long')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
        'Must contain a letter, a number, and a special character'
      ),
    confirm: z.string().min(1, 'Please confirm your password'),
    terms:   z.literal(true, {
      error: () => ({ message: 'You must accept the terms to continue' }),
    }),
  })
  .refine(d => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

// ─── Password requirements checklist ─────────────────────────────────────────

const REQUIREMENTS = [
  { label: 'At least 6 characters',  test: (pw: string) => pw.length >= 6              },
  { label: 'One letter',             test: (pw: string) => /[a-zA-Z]/.test(pw)         },
  { label: 'One number',             test: (pw: string) => /[0-9]/.test(pw)            },
  { label: 'One special character',  test: (pw: string) => /[^a-zA-Z0-9]/.test(pw)    },
];

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;
  return (
    <motion.ul
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-1 overflow-hidden"
    >
      {REQUIREMENTS.map(r => {
        const met = r.test(password);
        return (
          <li key={r.label} className={`flex items-center gap-1.5 text-xs font-exo transition-colors ${met ? 'text-green-400' : 'text-text-muted'}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${met ? 'bg-green-400' : 'bg-border'}`} />
            {r.label}
          </li>
        );
      })}
    </motion.ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const navigate = useNavigate();
  // Use Redux auth state — not the old Zustand store
  const { user } = useAppSelector(s => s.auth);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const { register: registerUser, googleLogin, loading, error } = useAuthViewModel();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, isSubmitted },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });

  const password = watch('password', '');
  const ok = (field: keyof FormData) =>
    (touchedFields[field] || isSubmitted) && !errors[field];

  const onSubmit = (data: FormData) =>
    registerUser({
      firstName: data.firstName,
      lastName:  data.lastName,
      email:     data.email,
      password:  data.password,
    });

  return (
    <PageWrapper className="flex items-center justify-center min-h-screen bg-circuit px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl grid lg:grid-cols-2 glass border border-border rounded-3xl overflow-hidden shadow-glow"
      >
        <AuthPanel />

        <div className="p-8 md:p-10 flex flex-col justify-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-exo mb-8 w-fit">
            <ArrowLeft size={13} /> Back to home
          </Link>

          <div className="mb-7">
            <h1 className="font-orbitron text-2xl font-bold text-text mb-1.5">Create account</h1>
            <p className="text-text-muted text-sm font-exo">Join Etbaly and start printing your ideas</p>
          </div>

          {/* Server error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 space-y-1 overflow-hidden"
              >
                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p>{error}</p>
                    <p className="text-[11px] text-red-400/60 mt-1">
                      API: {import.meta.env.VITE_API_URL ?? 'not set'} — check browser Network tab for details
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* First + Last name side by side */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                id="firstName"
                label="First name"
                type="text"
                icon={<User size={15} />}
                placeholder="Jane"
                autoComplete="given-name"
                error={errors.firstName?.message}
                success={ok('firstName')}
                {...register('firstName')}
              />
              <FormField
                id="lastName"
                label="Last name"
                type="text"
                icon={<User size={15} />}
                placeholder="Doe"
                autoComplete="family-name"
                error={errors.lastName?.message}
                success={ok('lastName')}
                {...register('lastName')}
              />
            </div>

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
                autoComplete="new-password"
                error={errors.password?.message}
                success={ok('password')}
                {...register('password')}
              />
              <PasswordStrengthBar password={password} />
              <AnimatePresence>
                {password && <PasswordRequirements password={password} />}
              </AnimatePresence>
            </div>

            <FormField
              id="confirm"
              label="Confirm password"
              type="password"
              icon={<Lock size={15} />}
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirm?.message}
              success={ok('confirm')}
              {...register('confirm')}
            />

            <div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" {...register('terms')} className="w-4 h-4 rounded accent-primary mt-0.5 shrink-0" />
                <span className="text-sm text-text-muted font-exo leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </span>
              </label>
              <AnimatePresence>
                {errors.terms && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="mt-1 text-xs text-red-400 font-exo flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.terms.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="flex items-center gap-2"><UserPlus size={16} /> Create Account</span>
              }
            </motion.button>
          </form>

          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-exo shrink-0">or sign up with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OAuthButton provider="google" onClick={() => googleLogin()} />
            <OAuthButton provider="github" />
          </div>

          <p className="mt-6 text-center text-sm text-text-muted font-exo">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
