import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import { useAppSelector } from '../../store/hooks';
import { authService } from '../../services/authService';
import PageWrapper from '../components/PageWrapper';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);

  // Email passed from registration page via router state
  const emailFromState = (location.state as { email?: string })?.email ?? '';
  const [email] = useState(emailFromState);

  // Redirect if already verified
  useEffect(() => {
    if (user) navigate('/', { replace: true });
    if (!email) navigate('/signup', { replace: true });
  }, [user, email, navigate]);

  const { verifyOtp, loading, error } = useAuthViewModel();

  // 6-digit OTP input — one box per digit
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);

  const otp = digits.join('');

  const handleDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    verifyOtp({ email, otp });
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await authService.resendOtp(email);
      setResendMsg('A new OTP has been sent to your email.');
    } catch {
      setResendMsg('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center min-h-screen bg-circuit px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md glass border border-border rounded-3xl p-8 md:p-10"
      >
        <Link to="/signup" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-exo mb-8 w-fit">
          <ArrowLeft size={13} /> Back to sign up
        </Link>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-6">
          <Mail size={28} />
        </div>

        <div className="text-center mb-8">
          <h1 className="font-orbitron text-2xl font-bold text-text mb-2">Verify your email</h1>
          <p className="text-text-muted text-sm font-exo">
            We sent a 6-digit code to<br />
            <span className="text-primary font-medium">{email}</span>
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo overflow-hidden"
            >
              <AlertCircle size={16} className="shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resend message */}
        <AnimatePresence>
          {resendMsg && (
            <motion.div
              key="resend"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-center gap-2.5 p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-exo overflow-hidden"
            >
              <CheckCircle2 size={16} className="shrink-0" /> {resendMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP boxes */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                aria-label={`OTP digit ${i + 1}`}
                className={[
                  'w-12 h-14 text-center text-xl font-orbitron font-bold rounded-xl border transition-all',
                  'glass focus:outline-none focus:shadow-glow-sm',
                  d ? 'border-primary text-primary' : 'border-border text-text',
                  'focus:border-primary',
                ].join(' ')}
              />
            ))}
          </div>

          <motion.button
            type="submit"
            disabled={loading || otp.length !== 6}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Verify Account'
            }
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted font-exo mb-3">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-exo mx-auto disabled:opacity-50"
          >
            <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Sending…' : 'Resend OTP'}
          </button>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
