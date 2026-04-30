import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useCartViewModel } from '../../viewmodels/useCartViewModel';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logoutThunk } from '../../store/slices/authSlice';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { to: '/',         label: 'HOME',        end: true  },
  { to: '/products', label: 'COLLECTIONS', end: false },
  { to: '/chat',     label: 'AI CHATBOT',  end: false },
  { to: '/upload',   label: 'UPLOAD',      end: false },
] as const;

// Auth-only nav links (shown only when logged in)
const AUTH_NAV_LINKS = [
  { to: '/history', label: 'MY PRINTS', end: false },
] as const;

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
}

function UserDropdown({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);

  const go = (path: string) => { navigate(path); onClose(); };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/signin');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border sharp-corners overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-border bg-surface-2">
        <p className="text-sm font-medium text-text truncate font-body">
          {user?.profile?.firstName} {user?.profile?.lastName}
        </p>
        <p className="text-xs text-text-muted truncate font-body">{user?.email}</p>
      </div>
      <div className="py-1">
        <button
          onClick={() => go('/profile')}
          className="cursor-hover w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-2 transition-colors text-left font-body"
        >
          <User size={15} /> My Profile
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => go('/admin')}
            className="cursor-hover w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-2 transition-colors text-left font-body"
          >
            <Settings size={15} /> Admin Dashboard
          </button>
        )}
        <button
          onClick={handleLogout}
          className="cursor-hover w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors text-left font-body"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { totalItems, openCart } = useCartViewModel();
  const { user }                 = useAppSelector(s => s.auth);
  const dispatch                 = useAppDispatch();
  const navigate                 = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleMobileLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/signin');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);
  const userInitials = getInitials(user?.profile?.firstName, user?.profile?.lastName);

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-bg/90 backdrop-blur-xl border-b border-border'
          : 'bg-transparent',
      ].join(' ')}
    >
      <nav
        className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8"
        aria-label="Main navigation"
      >
        {/* Logo — Bebas Neue, large */}
        <Link to="/" className="cursor-hover flex items-center shrink-0" aria-label="Etbaly home">
          <span className="text-3xl font-display text-text tracking-wide">ETBALY</span>
        </Link>

        {/* Desktop nav links — Inter, uppercase, small */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'cursor-hover relative text-xs font-body font-medium tracking-widest transition-colors duration-200',
                  isActive
                    ? 'text-text'
                    : 'text-text-muted hover:text-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          {user && AUTH_NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'cursor-hover relative text-xs font-body font-medium tracking-widest transition-colors duration-200',
                  isActive
                    ? 'text-text'
                    : 'text-text-muted hover:text-text',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Cart */}
          <button
            onClick={openCart}
            aria-label={`Cart, ${totalItems} items`}
            className="cursor-hover relative w-10 h-10 sharp-corners border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
          >
            <ShoppingCart size={18} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-primary text-bg text-[10px] font-bold no-corners flex items-center justify-center font-body"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Auth section */}
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative hidden md:block"
                ref={userMenuRef}
              >
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  className="cursor-hover w-10 h-10 sharp-corners border border-border hover:border-primary transition-all overflow-hidden"
                >
                  {user.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-2 flex items-center justify-center text-primary text-sm font-bold font-body">
                      {userInitials}
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {userMenuOpen && <UserDropdown onClose={() => setUserMenuOpen(false)} />}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="auth-btns"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden md:flex items-center gap-3"
              >
                <Link
                  to="/signin"
                  className="cursor-hover px-5 py-2 text-xs font-body font-medium tracking-wider text-text-muted hover:text-text transition-colors border border-border hover:border-text no-corners"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/signup"
                  className="cursor-hover px-5 py-2 text-xs font-body font-bold tracking-wider bg-primary text-bg no-corners hover:bg-primary-dark transition-colors"
                >
                  SIGN UP
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile hamburger */}
          <button
            className="cursor-hover md:hidden w-10 h-10 sharp-corners border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-primary transition-all"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={20} />
                </motion.span>
              ) : (
                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu size={20} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 top-20 bg-bg z-30 overflow-y-auto"
          >
            <div className="px-6 py-8 space-y-6">
              {/* Nav links */}
              <div className="space-y-2">
                {NAV_LINKS.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      [
                        'cursor-hover block px-4 py-3 text-2xl font-display transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-text-muted hover:text-text',
                      ].join(' ')
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {user && AUTH_NAV_LINKS.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      [
                        'cursor-hover block px-4 py-3 text-2xl font-display transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-text-muted hover:text-text',
                      ].join(' ')
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              {/* Mobile auth */}
              <div className="pt-6 border-t border-border space-y-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 mb-3">
                      <div className="w-12 h-12 sharp-corners border border-primary overflow-hidden shrink-0">
                        {user.profile?.avatarUrl ? (
                          <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-surface-2 flex items-center justify-center text-primary text-sm font-bold font-body">
                            {userInitials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate font-body">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="text-xs text-text-muted truncate font-body">{user.email}</p>
                      </div>
                    </div>
                    <NavLink to="/profile" onClick={closeMobile}
                      className="cursor-hover block px-4 py-3 text-sm font-body text-text-muted hover:text-text transition-colors">
                      Profile
                    </NavLink>
                    {user.role === 'admin' && (
                      <NavLink to="/admin" onClick={closeMobile}
                        className="cursor-hover block px-4 py-3 text-sm font-body text-text-muted hover:text-text transition-colors">
                        Admin Dashboard
                      </NavLink>
                    )}
                    <button onClick={handleMobileLogout}
                      className="cursor-hover w-full text-left px-4 py-3 text-sm font-body text-danger hover:bg-danger/10 transition-colors">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/signin" onClick={closeMobile}
                      className="cursor-hover block py-3 text-center text-sm font-body font-medium border border-border text-text-muted hover:text-text hover:border-text no-corners transition-all">
                      SIGN IN
                    </Link>
                    <Link to="/signup" onClick={closeMobile}
                      className="cursor-hover block py-3 text-center text-sm font-body font-bold bg-primary text-bg no-corners hover:bg-primary-dark transition-colors">
                      SIGN UP
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
