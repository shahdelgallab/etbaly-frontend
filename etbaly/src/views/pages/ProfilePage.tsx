import { useRef, useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Package, Lock, Trash2, Camera,
  CheckCircle2, AlertCircle, Eye, EyeOff,
  MapPin, Shield, LogOut,
  ChevronRight, Truck, Printer, Clock, X,
  Save, CreditCard, Banknote,
} from 'lucide-react';
import { useProfileViewModel } from '../../viewmodels/useProfileViewModel';
import type { ProfileTab, PasswordFormValues } from '../../viewmodels/useProfileViewModel';
import PageWrapper from '../components/PageWrapper';
import type { ApiOrder, ApiOrderStatus } from '../../types/api';

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ProfileErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; msg: string }> {
  state = { hasError: false, msg: '' };
  static getDerivedStateFromError(e: Error) { return { hasError: true, msg: e.message }; }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error('[ProfilePage]', e, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
          <AlertCircle size={40} className="text-red-400 opacity-60" />
          <p className="font-orbitron text-sm text-red-400">Something went wrong</p>
          <p className="text-xs font-exo opacity-60">{this.state.msg}</p>
          <button onClick={() => this.setState({ hasError: false, msg: '' })}
            className="text-xs text-primary hover:underline font-exo">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ApiOrderStatus, { label: string; cls: string; icon: ReactNode }> = {
  Pending:    { label: 'Pending',    cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <Clock size={11} />        },
  Processing: { label: 'Processing', cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30',   icon: <Printer size={11} />      },
  Shipped:    { label: 'Shipped',    cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: <Truck size={11} />        },
  Delivered:  { label: 'Delivered',  cls: 'bg-green-500/15  text-green-400  border-green-500/30',  icon: <CheckCircle2 size={11} /> },
  Cancelled:  { label: 'Cancelled',  cls: 'bg-red-500/15    text-red-400    border-red-500/30',    icon: <X size={11} />            },
};

function StatusBadge({ status }: { status: ApiOrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-exo font-medium border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

const inputCls = 'w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all';
const labelCls = 'block text-xs font-medium text-text-muted font-exo mb-1.5';

type VM = ReturnType<typeof useProfileViewModel>;

// ─── Avatar section ───────────────────────────────────────────────────────────

function AvatarSection({ vm }: { vm: VM }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-5">
      <div className="relative group">
        <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden bg-primary/10 flex items-center justify-center">
          {vm.avatarPreview
            ? <img src={vm.avatarPreview} alt={vm.fullName} className="w-full h-full object-cover" />
            : <span className="font-orbitron text-2xl font-bold text-primary">{vm.initials}</span>}
        </div>
        <button
          onClick={() => fileRef.current?.click()} aria-label="Change avatar"
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={18} className="text-white" />
        </button>
        <button onClick={() => fileRef.current?.click()} aria-label="Upload avatar"
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-glow-sm hover:scale-110 transition-transform">
          <Camera size={12} />
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={vm.onAvatarInput} className="hidden" aria-label="Avatar file input" />
      </div>
      <div>
        <h1 className="font-orbitron text-xl font-bold text-text">{vm.fullName || 'User'}</h1>
        <p className="text-text-muted text-sm font-exo">{vm.user?.email}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-exo border ${
            vm.user?.role === 'admin' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
            : vm.user?.role === 'operator' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            : 'bg-primary/15 text-primary border-primary/30'}`}>
            {vm.user?.role === 'admin' ? 'Admin' : vm.user?.role === 'operator' ? 'Operator' : 'Member'}
          </span>
          {vm.user?.isVerified && (
            <span className="flex items-center gap-1 text-[11px] text-green-400 font-exo">
              <CheckCircle2 size={11} /> Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ vm }: { vm: VM }) {
  const stats = [
    { label: 'Total Orders', value: vm.orderStats.total },
    { label: 'Delivered',    value: vm.orderStats.delivered },
    { label: 'Active',       value: vm.orderStats.active },
    { label: 'Total Spent',  value: `$${vm.orderStats.spent.toFixed(0)}` },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="glass border border-border rounded-xl p-3 text-center">
          <p className="font-orbitron text-lg font-bold text-primary">{s.value}</p>
          <p className="text-[11px] text-text-muted font-exo mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: { id: ProfileTab; label: string; icon: ReactNode }[] = [
  { id: 'profile',  label: 'Profile',  icon: <User size={15} />    },
  { id: 'orders',   label: 'Orders',   icon: <Package size={15} /> },
  { id: 'security', label: 'Security', icon: <Lock size={15} />    },
];

function TabBar({ active, onChange }: { active: ProfileTab; onChange: (t: ProfileTab) => void }) {
  return (
    <div className="flex gap-1 glass border border-border rounded-xl p-1 w-fit" role="tablist">
      {TABS.map(t => (
        <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}
          className={['relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-exo transition-all duration-200',
            active === t.id
              ? 'bg-primary text-white shadow-glow-sm'
              : 'text-text-muted hover:text-text hover:bg-primary/10'].join(' ')}>
          <span className="flex items-center gap-2">{t.icon} {t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Feedback banner ──────────────────────────────────────────────────────────

function FeedbackBanner({ success, error }: { success: string | null; error: string | null }) {
  const msg = success ?? error;
  if (!msg) return null;
  return (
    <div className={['flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-exo mb-5',
      success ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'].join(' ')}>
      {success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({ vm }: { vm: VM }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [bio,       setBio]       = useState('');

  const handleSave = () => {
    vm.saveProfile({ firstName, lastName, phone, bio })
      .then(() => { window.location.reload(); })
      .catch(() => {});
  };

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="glass border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-orbitron text-sm font-semibold text-text">Account Details</h2>
            <button
              onClick={() => {
                setFirstName(vm.user?.profile?.firstName ?? '');
                setLastName(vm.user?.profile?.lastName ?? '');
                setPhone(vm.user?.profile?.phoneNumber ?? '');
                setBio(vm.user?.profile?.bio ?? '');
                setEditing(true);
              }}
              className="text-xs text-text-muted hover:text-primary transition-colors font-exo px-3 py-1 glass border border-border rounded-lg"
            >
              Edit
            </button>
          </div>
          <div>
            <p className={labelCls}>First Name</p>
            <p className="text-sm text-text font-exo py-2.5 px-4 glass border border-border/50 rounded-xl">{vm.user?.profile?.firstName || '—'}</p>
          </div>
          <div>
            <p className={labelCls}>Last Name</p>
            <p className="text-sm text-text font-exo py-2.5 px-4 glass border border-border/50 rounded-xl">{vm.user?.profile?.lastName || '—'}</p>
          </div>
          <div>
            <p className={labelCls}>Email Address</p>
            <p className="text-sm text-text font-exo py-2.5 px-4 glass border border-border/50 rounded-xl opacity-70">{vm.user?.email || '—'}</p>
          </div>
          <div>
            <p className={labelCls}>Phone Number</p>
            <p className="text-sm text-text font-exo py-2.5 px-4 glass border border-border/50 rounded-xl">{vm.user?.profile?.phoneNumber || '—'}</p>
          </div>
          <div>
            <p className={labelCls}>Bio</p>
            <p className="text-sm text-text font-exo py-2.5 px-4 glass border border-border/50 rounded-xl min-h-[3rem]">{vm.user?.profile?.bio || '—'}</p>
          </div>
        </div>

        <div className="glass border border-border rounded-2xl p-6">
          <h2 className="font-orbitron text-sm font-semibold text-text flex items-center gap-2 mb-4">
            <MapPin size={14} className="text-primary" /> Saved Addresses
          </h2>
          {(vm.user?.savedAddresses ?? []).length > 0 ? (
            <div className="space-y-3">
              {(vm.user?.savedAddresses ?? []).map((addr, i) => (
                <div key={i} className="text-sm text-text-muted font-exo glass border border-border/50 rounded-xl p-3">
                  <p>{addr.street}</p>
                  <p>{addr.city}, {addr.country} {addr.zip}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted font-exo">No addresses saved yet.</p>
          )}
        </div>

        <button onClick={() => vm.deleteAccount()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-red-400 transition-colors font-exo">
          <LogOut size={14} /> Sign out of all devices
        </button>
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-lg">
      <div className="glass border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-orbitron text-sm font-semibold text-text">Edit Profile</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-text-muted hover:text-primary transition-colors font-exo px-3 py-1 glass border border-border rounded-lg"
          >
            Cancel
          </button>
        </div>
        <div>
          <label className={labelCls}>First Name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Last Name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email Address</label>
          <p className="text-sm text-text font-exo py-2.5 px-4 glass border border-border/50 rounded-xl opacity-70">{vm.user?.email || '—'}</p>
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={500} placeholder="Tell us about yourself…" className={`${inputCls} resize-none`} />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={vm.loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-orbitron text-sm rounded-xl hover:shadow-glow transition-all disabled:opacity-50">
            {vm.loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="flex items-center gap-2"><Save size={14} /> Save Changes</span>}
          </button>
          <button onClick={() => setEditing(false)}
            className="px-5 py-2.5 glass border border-border text-text-muted font-orbitron text-sm rounded-xl hover:text-primary hover:border-primary transition-all">
            Cancel
          </button>
        </div>
      </div>

      <div className="glass border border-border rounded-2xl p-6">
        <h2 className="font-orbitron text-sm font-semibold text-text flex items-center gap-2 mb-4">
          <MapPin size={14} className="text-primary" /> Saved Addresses
        </h2>
        {(vm.user?.savedAddresses ?? []).length > 0 ? (
          <div className="space-y-3">
            {(vm.user?.savedAddresses ?? []).map((addr, i) => (
              <div key={i} className="text-sm text-text-muted font-exo glass border border-border/50 rounded-xl p-3">
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.country} {addr.zip}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted font-exo">No addresses saved yet.</p>
        )}
      </div>

      <button onClick={() => vm.deleteAccount()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-red-400 transition-colors font-exo">
        <LogOut size={14} /> Sign out of all devices
      </button>
    </div>
  );
}

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: ApiOrder; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass border border-border rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-base font-semibold text-text">Order #{order.orderNumber}</h3>
          <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-primary transition-colors"><X size={18} /></button>
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <span className="text-xs text-text-muted font-exo">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="glass border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs font-orbitron text-text-muted tracking-wider mb-2">SHIPPING TO</p>
          <p className="text-sm text-text font-exo">{order.shippingAddressSnapshot.street}</p>
          <p className="text-xs text-text-muted font-exo">
            {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.country} {order.shippingAddressSnapshot.zip}
          </p>
        </div>
        <div className="glass border border-border rounded-xl p-4">
          <p className="text-xs font-orbitron text-text-muted tracking-wider mb-2">PAYMENT</p>
          <div className="flex items-center gap-2 text-sm font-exo text-text">
            {order.paymentInfo.method === 'Card'
              ? <span className="flex items-center gap-2"><CreditCard size={13} className="text-primary" /> Credit Card</span>
              : order.paymentInfo.method === 'COD'
              ? <span className="flex items-center gap-2"><Banknote size={13} className="text-primary" /> Cash on Delivery</span>
              : <span className="flex items-center gap-2"><Banknote size={13} className="text-primary" /> Wallet</span>}
            <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full border font-exo ${
              order.paymentInfo.status === 'Paid' ? 'bg-green-500/15 text-green-400 border-green-500/30'
              : order.paymentInfo.status === 'Failed' ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}>
              {order.paymentInfo.status}
            </span>
          </div>
        </div>
        <div className="space-y-1.5 text-sm font-exo">
          <div className="flex justify-between text-text-muted"><span>Subtotal</span><span>${order.pricingSummary.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-text-muted">
            <span>Shipping</span>
            <span>{order.pricingSummary.shippingCost === 0 ? <span className="text-green-400">Free</span> : `$${order.pricingSummary.shippingCost.toFixed(2)}`}</span>
          </div>
          {order.pricingSummary.taxAmount > 0 && (
            <div className="flex justify-between text-text-muted"><span>Tax</span><span>${order.pricingSummary.taxAmount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-semibold text-text pt-2 border-t border-border font-orbitron">
            <span>Total</span><span className="text-primary">${order.pricingSummary.total.toFixed(2)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

function OrdersTab({ vm }: { vm: VM }) {
  if (vm.ordersLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>;
  }
  if (vm.orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
        <Package size={52} className="opacity-20" />
        <p className="font-orbitron text-sm">No orders yet</p>
        <a href="/products" className="text-primary hover:underline text-sm font-exo">Browse collections</a>
      </div>
    );
  }
  return (
    <div>
      <div className="hidden md:block glass border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm font-exo">
          <thead className="border-b border-border bg-surface/50">
            <tr className="text-left text-text-muted text-xs">
              {['Order #', 'Date', 'Items', 'Status', 'Total', ''].map(h => (
                <th key={h} className="px-4 py-3 font-medium font-orbitron tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vm.orders.map(order => (
              <tr key={order._id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                <td className="px-4 py-3 text-primary font-orbitron text-xs">{order.orderNumber}</td>
                <td className="px-4 py-3 text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-text-muted">{order.items.length}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-text font-orbitron text-sm">${order.pricingSummary.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => vm.setSelectedOrder(order)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-exo">
                    View <ChevronRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {vm.orders.map(order => (
          <div key={order._id} className="glass border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-orbitron text-xs text-primary">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between text-sm font-exo">
              <span className="text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</span>
              <span className="font-orbitron text-primary">${order.pricingSummary.total.toFixed(2)}</span>
            </div>
            <button onClick={() => vm.setSelectedOrder(order)}
              className="text-xs text-primary hover:underline font-exo flex items-center gap-1">
              View details <ChevronRight size={11} />
            </button>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {vm.selectedOrder && (
          <OrderDetailModal order={vm.selectedOrder} onClose={() => vm.setSelectedOrder(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Security tab ─────────────────────────────────────────────────────────────

function SecurityTab({ vm }: { vm: VM }) {
  const [form, setForm] = useState<PasswordFormValues>({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  const handleSubmit = async () => {
    const ok = await vm.changePassword(form);
    if (ok) setForm({ current: '', next: '', confirm: '' });
  };

  const pwField = (key: keyof PasswordFormValues, label: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input type={showPw[key] ? 'text' : 'password'} value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder="••••••••" className={`${inputCls} pl-9 pr-10`} />
        <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
          aria-label={showPw[key] ? 'Hide' : 'Show'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
          {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  const passwordsMatch = form.next === form.confirm && form.confirm.length > 0;
  const canSubmit = form.current.length > 0 && form.next.length >= 6 && passwordsMatch;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="glass border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-orbitron text-sm font-semibold text-text flex items-center gap-2">
          <Shield size={14} className="text-primary" /> Change Password
        </h2>
        {pwField('current', 'Current Password')}
        {pwField('next', 'New Password')}
        {pwField('confirm', 'Confirm New Password')}
        {form.confirm.length > 0 && (
          <p className={`text-xs font-exo flex items-center gap-1.5 ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
            {passwordsMatch ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
          </p>
        )}
        <button onClick={handleSubmit} disabled={!canSubmit || vm.loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-orbitron text-sm rounded-xl hover:shadow-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {vm.loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <span className="flex items-center gap-2"><Shield size={14} /> Update Password</span>}
        </button>
      </div>
      <div className="glass border border-red-500/30 rounded-2xl p-6">
        <h2 className="font-orbitron text-sm font-semibold text-red-400 mb-1 flex items-center gap-2">
          <AlertCircle size={14} /> Danger Zone
        </h2>
        <p className="text-text-muted text-sm font-exo mb-4">Permanently delete your account and all data.</p>
        <button onClick={() => vm.setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-exo hover:bg-red-500/20 transition-all">
          <Trash2 size={14} /> Delete My Account
        </button>
      </div>
    </div>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({ vm }: { vm: VM }) {
  return (
    <AnimatePresence>
      {vm.showDeleteModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
            className="glass border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-400" />
            </div>
            <h3 className="font-orbitron text-lg font-bold text-text mb-2">Delete Account?</h3>
            <p className="text-text-muted text-sm font-exo mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => vm.setShowDeleteModal(false)}
                className="flex-1 py-2.5 glass border border-border text-text-muted rounded-xl font-exo text-sm hover:text-text transition-all">
                Cancel
              </button>
              <button onClick={vm.deleteAccount}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-orbitron text-sm hover:bg-red-600 transition-all">
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const vm = useProfileViewModel();
  const [tab, setTab] = useState<ProfileTab>('profile');

  return (
    <ProfileErrorBoundary>
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <div className="glass border border-border rounded-2xl p-6 space-y-5">
            <AvatarSection vm={vm} />
            <StatsBar vm={vm} />
          </div>

          <FeedbackBanner success={vm.success} error={vm.error} />
          <TabBar active={tab} onChange={setTab} />

          {/* No AnimatePresence here — it caused insertBefore crashes when ProfileTab state changed */}
          <div>
            {tab === 'profile'  && <ProfileErrorBoundary><ProfileTab  vm={vm} /></ProfileErrorBoundary>}
            {tab === 'orders'   && <ProfileErrorBoundary><OrdersTab   vm={vm} /></ProfileErrorBoundary>}
            {tab === 'security' && <ProfileErrorBoundary><SecurityTab vm={vm} /></ProfileErrorBoundary>}
          </div>
        </div>
        <DeleteModal vm={vm} />
      </PageWrapper>
    </ProfileErrorBoundary>
  );
}
