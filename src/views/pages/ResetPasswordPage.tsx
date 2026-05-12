import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import PageWrapper from '../components/PageWrapper';

export default function ResetPasswordPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const emailFromState = (location.state as { email?: string })?.email ?? '';

  const { resetPassword, loading } = useAuthViewModel();

  const [email,       setEmail]       = useState(emailFromState);
  const [otp,         setOtp]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [localError,  setLocalError]  = useState('');
  const [done,        setDone]        = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (otp.length !== 6 || !/^\d+$/.test(otp)) { setLocalError('OTP must be exactly 6 digits.'); return; }
    if (newPassword.length < 6)                  { setLocalError('Password must be at least 6 characters.'); return; }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(newPassword)) {
      setLocalError('Password must contain a letter, a number, and a special character.');
      return;
    }
    if (newPassword !== confirm) { setLocalError('Passwords do not match.'); return; }

    try {
      await resetPassword({ email: email.trim().toLowerCase(), otp, newPassword });
      setDone(true);
    } catch {
      // error shown via vm.error — but resetPassword doesn't expose it here, use local
      setLocalError('Invalid or expired OTP. Please try again.');
    }
  };

  const inputCls = 'w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all';
  const labelCls = 'block text-xs font-medium text-text-muted font-exo mb-1.5';

  if (done) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-screen bg-circuit px-4">
        <div className="text-center glass border border-border rounded-3xl p-10 max-w-sm w-full space-y-4">
          <CheckCircle2 size={48} className="text-green-400 mx-auto" />
          <h1 className="font-orbitron text-xl font-bold text-text">Password reset!</h1>
          <p className="text-text-muted text-sm font-exo">You can now sign in with your new password.</p>
          <button onClick={() => navigate('/signin')}
            className="px-6 py-2.5 bg-primary text-white font-orbitron text-sm rounded-xl hover:shadow-glow transition-all">
            Sign In
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="flex items-center justify-center min-h-screen bg-circuit px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md glass border border-border rounded-3xl p-8 md:p-10"
      >
        <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-exo mb-8 w-fit">
          <ArrowLeft size={13} /> Back
        </Link>

        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-6">
          <Lock size={28} />
        </div>

        <div className="text-center mb-8">
          <h1 className="font-orbitron text-2xl font-bold text-text mb-2">Reset password</h1>
          <p className="text-text-muted text-sm font-exo">Enter the code we sent and your new password.</p>
        </div>

        {localError && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo">
            <AlertCircle size={16} className="shrink-0" /> {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!emailFromState && (
            <div>
              <label className={labelCls}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>6-digit reset code</label>
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456" required
              className={`${inputCls} tracking-widest text-center font-orbitron`}
            />
          </div>

          <div>
            <label className={labelCls}>New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••" autoComplete="new-password" required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" autoComplete="new-password" required className={inputCls} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </PageWrapper>
  );
}
