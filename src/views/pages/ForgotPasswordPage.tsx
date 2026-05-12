import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import PageWrapper from '../components/PageWrapper';

export default function ForgotPasswordPage() {
  const { forgotPassword, loading } = useAuthViewModel();
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
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
        <Link to="/signin" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-exo mb-8 w-fit">
          <ArrowLeft size={13} /> Back to sign in
        </Link>

        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-6">
          <Mail size={28} />
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle2 size={40} className="text-green-400 mx-auto" />
            <h1 className="font-orbitron text-xl font-bold text-text">Check your email</h1>
            <p className="text-text-muted text-sm font-exo">
              If an account with <span className="text-primary">{email}</span> exists, we've sent a reset code.
            </p>
            <Link
              to="/reset-password"
              state={{ email }}
              className="inline-block mt-4 px-6 py-2.5 bg-primary text-white font-orbitron text-sm rounded-xl hover:shadow-glow transition-all"
            >
              Enter reset code
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="font-orbitron text-2xl font-bold text-text mb-2">Forgot password?</h1>
              <p className="text-text-muted text-sm font-exo">Enter your email and we'll send you a reset code.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted font-exo mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </PageWrapper>
  );
}
