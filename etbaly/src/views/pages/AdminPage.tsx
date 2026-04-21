import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Users, ShoppingBag, TrendingUp, BarChart3, RefreshCw, Cpu, Plus, Pencil, Trash2, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchAllOrdersThunk, updateOrderStatusThunk } from '../../store/slices/ordersSlice';
import { adminFetchProductsThunk, adminDeleteProductThunk } from '../../store/slices/productsSlice';
import { userService } from '../../services/userService';
import { manufacturingService } from '../../services/manufacturingService';
import { aiService } from '../../services/aiService';
import PageWrapper from '../components/PageWrapper';
import ProductFormModal from '../components/ProductFormModal';
import type { ApiOrderStatus, ApiUser, ApiProduct } from '../../types/api';

const STATUS_COLORS: Record<ApiOrderStatus, string> = {
  Pending:    'bg-yellow-500/20 text-yellow-400',
  Processing: 'bg-blue-500/20   text-blue-400',
  Shipped:    'bg-purple-500/20 text-purple-400',
  Delivered:  'bg-green-500/20  text-green-400',
  Cancelled:  'bg-red-500/20    text-red-400',
};

const API_STATUSES: ApiOrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirm({ product, onConfirm, onCancel }: {
  product: ApiProduct; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass border border-red-500/30 rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={22} className="text-red-400" />
        </div>
        <h3 className="font-orbitron text-base font-semibold text-text mb-2">Delete Product?</h3>
        <p className="text-text-muted text-sm font-exo mb-5">
          "<span className="text-text">{product.name}</span>" will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 glass border border-border text-text-muted rounded-xl font-exo text-sm hover:text-text transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-orbitron text-sm hover:bg-red-600 transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lightning AI URL panel ───────────────────────────────────────────────────

function LightningUrlPanel() {
  const [url,     setUrl]     = useState('');
  const [current, setCurrent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    aiService.getLightningUrl()
      .then(u => { setCurrent(u); setUrl(u); })
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!url.trim()) return;
    setLoading(true); setMsg(null);
    try {
      const saved = await aiService.setLightningUrl(url.trim());
      setCurrent(saved);
      setMsg({ text: 'URL updated successfully.', ok: true });
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update URL.';
      setMsg({ text: m, ok: false });
    } finally { setLoading(false); }
  };

  const clearCache = async () => {
    setLoading(true); setMsg(null);
    try {
      await aiService.clearLightningUrlCache();
      setMsg({ text: 'Cache cleared.', ok: true });
    } catch { setMsg({ text: 'Failed to clear cache.', ok: false }); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass glow-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-accent-3" />
        <h2 className="font-orbitron text-sm font-semibold text-text">Lightning AI Service URL</h2>
      </div>
      {current && (
        <p className="text-xs font-exo text-text-muted mb-3 break-all">
          Current: <span className="text-primary-light">{current}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://lightning-ai-service.example.com"
          className="flex-1 px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary" />
        <button onClick={save} disabled={loading || !url.trim()}
          className="px-4 py-2.5 bg-primary text-white font-orbitron text-xs rounded-xl hover:shadow-glow transition-all disabled:opacity-40">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Save URL'}
        </button>
        <button onClick={clearCache} disabled={loading}
          className="px-4 py-2.5 glass border border-border text-text-muted font-exo text-xs rounded-xl hover:text-primary hover:border-primary transition-all disabled:opacity-40">
          Clear Cache
        </button>
      </div>
      {msg && (
        <p className={`mt-2 text-xs font-exo flex items-center gap-1.5 ${msg.ok ? 'text-success' : 'text-danger'}`}>
          {msg.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {msg.text}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const { hydrating } = useAppSelector(s => s.auth);
  const { items: orders, loading: ordersLoading } = useAppSelector(s => s.orders);
  const { items: products, loading: productsLoading } = useAppSelector(s => s.products);

  const [tab,          setTab]          = useState<'overview' | 'orders' | 'products' | 'users'>('overview');
  const [users,        setUsers]        = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [jobId,        setJobId]        = useState('');
  const [jobMsg,       setJobMsg]       = useState<string | null>(null);
  const [jobLoading,   setJobLoading]   = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [editProduct,  setEditProduct]  = useState<ApiProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiProduct | null>(null);

  useEffect(() => {
    dispatch(fetchAllOrdersThunk({}));
    dispatch(adminFetchProductsThunk({}));
  }, [dispatch]);

  useEffect(() => {
    if (tab !== 'users') return;
    setUsersLoading(true);
    userService.getAll()
      .then(res => setUsers(res.results))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [tab]);

  if (hydrating) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-text-muted">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="font-exo text-sm">Loading...</p>
        </div>
      </PageWrapper>
    );
  }

  const revenue = orders.reduce((s, o) => s + o.pricingSummary.total, 0);
  const stats = [
    { label: 'Total Orders', value: orders.length,   icon: <ShoppingBag size={20} />, color: 'text-blue-400'   },
    { label: 'Products',     value: products.length, icon: <Package size={20} />,     color: 'text-purple-400' },
    { label: 'Revenue',      value: `$${revenue.toFixed(0)}`, icon: <TrendingUp size={20} />, color: 'text-green-400' },
    { label: 'Customers',    value: users.length || '—', icon: <Users size={20} />,   color: 'text-orange-400' },
  ];

  const dispatchJob = async (action: 'start_slicing' | 'start_printing') => {
    if (!jobId.trim()) return;
    setJobLoading(true); setJobMsg(null);
    try {
      const res = await manufacturingService.execute({ jobId: jobId.trim(), action });
      setJobMsg(res.message ?? 'Dispatched successfully.');
      setJobId('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Dispatch failed.';
      setJobMsg(`Error: ${msg}`);
    } finally { setJobLoading(false); }
  };

  const openCreate = () => { setEditProduct(null); setShowModal(true); };
  const openEdit   = (p: ApiProduct) => { setEditProduct(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditProduct(null); };
  const handleModalSuccess = () => { closeModal(); dispatch(adminFetchProductsThunk({})); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(adminDeleteProductThunk(deleteTarget._id));
    setDeleteTarget(null);
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 size={24} className="text-primary" />
          <h1 className="font-orbitron text-2xl font-bold text-text">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} className="glass glow-border rounded-2xl p-5">
              <div className={`mb-3 ${s.color}`}>{s.icon}</div>
              <p className="font-orbitron text-2xl font-bold text-text">{s.value}</p>
              <p className="text-xs text-text-muted font-exo mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass border border-border rounded-xl p-1 w-fit flex-wrap">
          {(['overview', 'orders', 'products', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-exo capitalize transition-all ${tab === t ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Lightning AI URL config */}
            <LightningUrlPanel />

            {/* Manufacturing dispatch */}
            <div className="glass glow-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cpu size={18} className="text-primary" />
                <h2 className="font-orbitron text-sm font-semibold text-text">Manufacturing Dispatch</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={jobId} onChange={e => setJobId(e.target.value)} placeholder="Job ID"
                  className="flex-1 px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary" />
                <button onClick={() => dispatchJob('start_slicing')} disabled={jobLoading || !jobId.trim()}
                  className="px-4 py-2.5 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-xl text-sm font-exo hover:bg-blue-500/30 transition-all disabled:opacity-40">
                  Start Slicing
                </button>
                <button onClick={() => dispatchJob('start_printing')} disabled={jobLoading || !jobId.trim()}
                  className="px-4 py-2.5 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl text-sm font-exo hover:bg-green-500/30 transition-all disabled:opacity-40">
                  Start Printing
                </button>
              </div>
              {jobMsg && <p className={`mt-3 text-xs font-exo ${jobMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{jobMsg}</p>}
            </div>
            <div className="glass glow-border rounded-2xl p-8 text-center text-text-muted font-exo">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
              <p>Analytics charts coming soon.</p>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="glass glow-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-orbitron text-text">Orders ({orders.length})</span>
              <button onClick={() => dispatch(fetchAllOrdersThunk({}))} disabled={ordersLoading}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary font-exo transition-colors">
                <RefreshCw size={12} className={ordersLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="p-12 text-center text-text-muted font-exo">{ordersLoading ? 'Loading...' : 'No orders yet.'}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-exo">
                  <thead className="border-b border-border">
                    <tr className="text-left text-text-muted text-xs">
                      {['Order #', 'User', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 text-primary font-orbitron text-xs">{o.orderNumber}</td>
                        <td className="px-4 py-3 text-text-muted">{o.userId.slice(0, 8)}…</td>
                        <td className="px-4 py-3 text-text">${o.pricingSummary.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                        </td>
                        <td className="px-4 py-3 text-text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <select defaultValue={o.status}
                            onChange={e => dispatch(updateOrderStatusThunk({ id: o._id, status: e.target.value as ApiOrderStatus }))}
                            className="glass border border-border rounded px-2 py-1 text-xs text-text font-exo focus:outline-none">
                            {API_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {tab === 'products' && (
          <div className="glass glow-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-orbitron text-text">Products ({products.length})</span>
              <div className="flex items-center gap-2">
                <button onClick={() => dispatch(adminFetchProductsThunk({}))} disabled={productsLoading}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary font-exo transition-colors">
                  <RefreshCw size={12} className={productsLoading ? 'animate-spin' : ''} /> Refresh
                </button>
                <button onClick={openCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white font-orbitron text-xs rounded-lg hover:shadow-glow transition-all">
                  <Plus size={13} /> Create
                </button>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="p-12 text-center text-text-muted font-exo">{productsLoading ? 'Loading...' : 'No products yet.'}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-exo">
                  <thead className="border-b border-border">
                    <tr className="text-left text-text-muted text-xs">
                      {['Image', 'Name', 'Price', 'Stock', 'Active', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                            : <div className="w-10 h-10 rounded-lg bg-primary/10 border border-border flex items-center justify-center text-primary/40 text-[10px] font-orbitron">3D</div>}
                        </td>
                        <td className="px-4 py-3 text-text font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-primary">${p.currentBasePrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-text-muted">{p.stockLevel}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(p)} aria-label="Edit"
                              className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary transition-all">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteTarget(p)} aria-label="Delete"
                              className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-red-400 hover:border-red-400/50 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="glass glow-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm font-orbitron text-text">Users ({users.length})</span>
            </div>
            {usersLoading ? (
              <div className="p-12 text-center text-text-muted font-exo">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-text-muted font-exo">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-exo">
                  <thead className="border-b border-border">
                    <tr className="text-left text-text-muted text-xs">
                      {['Name', 'Email', 'Role', 'Verified', 'Joined'].map(h => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 text-text">{u.profile?.firstName} {u.profile?.lastName}</td>
                        <td className="px-4 py-3 text-text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            u.role === 'admin' ? 'bg-red-500/20 text-red-400'
                            : u.role === 'operator' ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-border text-text-muted'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${u.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {u.isVerified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ProductFormModal editProduct={editProduct} onClose={closeModal} onSuccess={handleModalSuccess} />
      )}
      {deleteTarget && (
        <DeleteConfirm product={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </PageWrapper>
  );
}
