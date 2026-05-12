import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

// ─── Base input ───────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, success, hint, id, className = '', ...props }, ref) => {
    const [showPw, setShowPw] = useState(false);
    const isPassword = props.type === 'password';
    const inputType = isPassword ? (showPw ? 'text' : 'password') : props.type;

    const borderClass = error
      ? 'border-red-500/60 focus:border-red-500'
      : success
      ? 'border-green-500/60 focus:border-green-500'
      : 'border-border focus:border-primary focus:shadow-glow-sm';

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-medium text-text-muted font-exo">
          {label}
        </label>

        <div className="relative">
          {/* Left icon */}
          {icon && (
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : success ? 'text-green-400' : 'text-text-muted'}`}>
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            {...props}
            type={inputType}
            className={[
              'w-full py-2.5 glass border rounded-lg text-sm text-text',
              'placeholder:text-text-muted focus:outline-none transition-all font-exo',
              icon ? 'pl-9' : 'pl-4',
              isPassword ? 'pr-10' : 'pr-4',
              borderClass,
              className,
            ].join(' ')}
          />

          {/* Right: password toggle OR validation icon */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="text-text-muted hover:text-primary transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            ) : error ? (
              <AlertCircle size={15} className="text-red-400" />
            ) : success ? (
              <CheckCircle2 size={15} className="text-green-400" />
            ) : null}
          </span>
        </div>

        {/* Error / hint */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-red-400 font-exo flex items-center gap-1"
            >
              <AlertCircle size={11} /> {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-text-muted font-exo"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// ─── Password strength bar ────────────────────────────────────────────────────

interface StrengthProps { password: string; }

function calcStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_META = [
  { label: 'Too short',  bar: 'bg-red-500',    text: 'text-red-400'    },
  { label: 'Weak',       bar: 'bg-orange-500',  text: 'text-orange-400' },
  { label: 'Fair',       bar: 'bg-yellow-500',  text: 'text-yellow-400' },
  { label: 'Good',       bar: 'bg-blue-500',    text: 'text-blue-400'   },
  { label: 'Strong',     bar: 'bg-green-500',   text: 'text-green-400'  },
];

export function PasswordStrengthBar({ password }: StrengthProps) {
  if (!password) return null;
  const strength = calcStrength(password);
  const meta = STRENGTH_META[strength];

  return (
    <div className="space-y-1 mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? meta.bar : 'bg-border'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ originX: 0 }}
          />
        ))}
      </div>
      <p className={`text-xs font-exo ${meta.text}`}>{meta.label}</p>
    </div>
  );
}

// ─── OAuth button ─────────────────────────────────────────────────────────────

interface OAuthButtonProps {
  provider: 'google' | 'github';
  onClick?: () => void;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

export function OAuthButton({ provider, onClick }: OAuthButtonProps) {
  const label = provider === 'google' ? 'Continue with Google' : 'Continue with GitHub';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={label}
      className="w-full flex items-center justify-center gap-2.5 py-2.5 glass border border-border rounded-xl text-sm text-text-muted hover:text-text hover:border-primary transition-all font-exo"
    >
      {provider === 'google' ? <GoogleIcon /> : <GithubIcon />}
      {label}
    </motion.button>
  );
}
