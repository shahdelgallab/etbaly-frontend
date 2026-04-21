import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, User, Search, Upload, MessageSquare, Home, Grid3X3, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useCartViewModel } from '../../viewmodels/useCartViewModel';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logoutThunk } from '../../store/slices/authSlice';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { to: '/',         label: 'Home',        icon: <Home size={15} />,          end: true  },
  { to: '/products', label: 'Collections', icon: <Grid3X3 size={15} />,       end: false },
  { to: '/chat',     label: 'AI Chatbot',  icon: <MessageSquare size={15} />, end: false },
  { to: '/upload',   label: 'Upload',      icon: <Upload size={15} />,        end: false },
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
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-52 glass border border-border rounded-2xl overflow-hidden shadow-glow z-50"
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-text font-exo truncate">
          {user?.profile?.firstName} {user?.profile?.lastName}
        </p>
        <p className="text-xs text-text-muted font-exo truncate">{user?.email}</p>
      </div>
      <div className="py-1">
        <button
          onClick={() => go('/profile')}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-primary/5 transition-colors font-exo text-left"
        >
          <User size={15} /> My Profile
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => go('/admin')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-primary/5 transition-colors font-exo text-left"
          >
            <Settings size={15} /> Admin Dashboard
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors font-exo text-left"
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
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

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
        scrolled ? 'glass border-b border-border shadow-glow-sm' : 'bg-transparent',
      ].join(' ')}
    >
      <nav
        className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-2 text-primary shrink-0" aria-label="Etbaly home">
          <span className="font-orbitron text-xl font-black tracking-widest leading-none">ETBALY</span>
          <motion.div
            className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-lg',
                  'text-sm font-medium font-exo transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text hover:bg-primary/5',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {link.icon} {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20 -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Search */}
          <AnimatePresence initial={false}>
            {searchOpen ? (
              <motion.form
                key="open"
                initial={{ width: 36, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 36, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSearch}
                className="hidden md:flex items-center glass border border-border rounded-full overflow-hidden"
              >
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  aria-label="Search"
                  className="flex-1 bg-transparent px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none font-exo"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="px-2 text-text-muted hover:text-primary">
                  <X size={14} />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="hidden md:flex w-9 h-9 rounded-full glass border border-border items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
              >
                <Search size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Cart */}
          <button
            onClick={openCart}
            aria-label={`Cart, ${totalItems} items`}
            className="relative w-9 h-9 rounded-full glass border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
          >
            <ShoppingCart size={16} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold font-orbitron rounded-full flex items-center justify-center shadow-glow-sm"
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative hidden md:block"
                ref={userMenuRef}
              >
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full glass border border-border hover:border-primary transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary overflow-hidden">
                    {user.profile?.avatarUrl ? (
                      <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-orbitron text-xs font-bold">{userInitials}</span>
                    )}
                  </div>
                  <ChevronDown
                    size={12}
                    className={`text-text-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
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
                className="hidden md:flex items-center gap-2"
              >
                <Link
                  to="/signin"
                  className="px-4 py-1.5 text-sm font-medium font-exo glass border border-border text-text-muted rounded-full hover:text-primary hover:border-primary transition-all"
                >
                  Sign In
                </Link>
                <Link to="/signup">
                  <motion.span
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-block px-4 py-1.5 text-sm font-semibold font-orbitron bg-primary text-white rounded-full hover:shadow-glow transition-all cursor-pointer"
                  >
                    Sign Up
                  </motion.span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 rounded-full glass border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={18} />
                </motion.span>
              ) : (
                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden glass border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search models..."
                    aria-label="Search"
                    className="w-full pl-8 pr-3 py-2 glass border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary font-exo"
                  />
                </div>
              </form>

              {/* Nav links */}
              {NAV_LINKS.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-exo transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-text-muted hover:text-text hover:bg-primary/5',
                    ].join(' ')
                  }
                >
                  {link.icon} {link.label}
                </NavLink>
              ))}

              {/* Mobile auth */}
              <div className="pt-3 mt-2 border-t border-border space-y-1">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                      <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary overflow-hidden shrink-0">
                        {user.profile?.avatarUrl ? (
                          <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-orbitron text-xs font-bold">{userInitials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text font-exo truncate">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="text-xs text-text-muted font-exo truncate">{user.email}</p>
                      </div>
                    </div>
                    <NavLink
                      to="/profile"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-exo text-text-muted hover:text-text hover:bg-primary/5 transition-colors"
                    >
                      <User size={15} /> Profile
                    </NavLink>
                    {user.role === 'admin' && (
                      <NavLink
                        to="/admin"
                        onClick={closeMobile}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-exo text-text-muted hover:text-text hover:bg-primary/5 transition-colors"
                      >
                        <Settings size={15} /> Admin
                      </NavLink>
                    )}
                    <button
                      onClick={handleMobileLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-exo text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/signin"
                      onClick={closeMobile}
                      className="flex-1 py-2.5 text-center text-sm font-exo glass border border-border text-text-muted rounded-xl hover:text-primary hover:border-primary transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={closeMobile}
                      className="flex-1 py-2.5 text-center text-sm font-orbitron font-semibold bg-primary text-white rounded-xl hover:shadow-glow transition-all"
                    >
                      Sign Up
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
