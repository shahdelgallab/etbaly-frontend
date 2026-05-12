import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Users, ShoppingBag, TrendingUp, BarChart3, RefreshCw, Cpu, Plus, Pencil, Trash2, AlertCircle, CheckCircle2, FlaskConical, Printer, Download, Eye, CheckCircle, XCircle, ChevronRight, Box } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchAllOrdersThunk, updateOrderStatusThunk } from '../../store/slices/ordersSlice';
import { adminFetchProductsThunk, adminDeleteProductThunk } from '../../store/slices/productsSlice';
import { userService } from '../../services/userService';
import { materialService } from '../../services/materialService';
import { aiService } from '../../services/aiService';
import { printingService, type PrintingJobStatus, type PrintingJobPopulated } from '../../services/printingService';
import { orderService } from '../../services/orderService';
import PageWrapper from '../components/PageWrapper';
import ProductFormModal from '../components/ProductFormModal';
import { AuthenticatedImage } from '../components/AuthenticatedImage';
import { getDirectImageUrl } from '../../utils/imageUtils';
import type { ApiOrderStatus, ApiUser, ApiProduct, ApiOrderItem, ApiOrderItemRef, ApiPrintingJobStatus } from '../../types/api';
import type { AdminMaterial, CreateMaterialPayload, MaterialType } from '../../models/Material';

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

// ─── Printing Review tab ──────────────────────────────────────────────────────

const PRINTING_STATUS_COLORS: Record<PrintingJobStatus, string> = {
  'Pending Review': 'bg-yellow-500/20 text-yellow-400',
  'Approved':       'bg-blue-500/20   text-blue-400',
  'Rejected':       'bg-red-500/20    text-red-400',
  'Queued':         'bg-purple-500/20 text-purple-400',
  'Processing':     'bg-orange-500/20 text-orange-400',
  'Completed':      'bg-green-500/20  text-green-400',
  'Failed':         'bg-red-500/20    text-red-400',
};

type StatusTabKey = 'all' | 'Pending Review' | 'Approved' | 'Queued' | 'Processing' | 'Completed' | 'Failed';

function PrintingReviewTab() {
  const [allJobs,        setAllJobs]        = useState<PrintingJobPopulated[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState<string | null>(null);
  const [msg,            setMsg]            = useState<{ text: string; ok: boolean } | null>(null);
  const [activeStatuses, setActiveStatuses] = useState<Set<StatusTabKey>>(new Set(['Pending Review']));
  const [selectedJob,    setSelectedJob]    = useState<PrintingJobPopulated | null>(null);

  const statusTabs: { key: StatusTabKey; label: string; count: number }[] = [
    { key: 'all',            label: 'All',            count: allJobs.length },
    { key: 'Pending Review', label: 'Pending Review', count: allJobs.filter(j => j.status === 'Pending Review').length },
    { key: 'Approved',       label: 'Approved',       count: allJobs.filter(j => j.status === 'Approved').length },
    { key: 'Queued',         label: 'Queued',         count: allJobs.filter(j => j.status === 'Queued').length },
    { key: 'Processing',     label: 'Processing',     count: allJobs.filter(j => j.status === 'Processing').length },
    { key: 'Completed',      label: 'Completed',      count: allJobs.filter(j => j.status === 'Completed').length },
    { key: 'Failed',         label: 'Failed',         count: allJobs.filter(j => j.status === 'Failed').length },
  ];

  const load = async () => {
    setLoading(true); setMsg(null);
    try {
      // Fetch jobs for all statuses
      const statuses: PrintingJobStatus[] = ['Pending Review', 'Approved', 'Rejected', 'Queued', 'Processing', 'Completed', 'Failed'];
      const allData = await Promise.all(statuses.map(s => printingService.getJobs(s)));
      const flatJobs = allData.flat();
      
      // Fetch full details for each job
      const fullJobs = await Promise.all(
        flatJobs.map(j => printingService.getStatus(j._id || j.jobId || ''))
      );
      setAllJobs(fullJobs);
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load printing jobs.';
      setMsg({ text: m, ok: false });
      setAllJobs([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = (key: StatusTabKey) => {
    const newSet = new Set(activeStatuses);
    if (key === 'all') {
      // Toggle all: if all is active, clear; otherwise select all
      if (newSet.has('all')) {
        newSet.clear();
        newSet.add('Pending Review'); // default to Pending Review
      } else {
        newSet.clear();
        newSet.add('all');
      }
    } else {
      // Toggle individual status
      if (newSet.has(key)) {
        newSet.delete(key);
        newSet.delete('all'); // deselect "all" if any individual is toggled off
      } else {
        newSet.add(key);
        newSet.delete('all'); // deselect "all" if any individual is toggled on
      }
      // If nothing selected, default to Pending Review
      if (newSet.size === 0) newSet.add('Pending Review');
    }
    setActiveStatuses(newSet);
  };

  // Filter jobs based on active statuses
  const filteredJobs = activeStatuses.has('all')
    ? allJobs
    : allJobs.filter(j => activeStatuses.has(j.status as StatusTabKey));

  const handleReview = async (jobId: string, action: 'approve' | 'reject') => {
    setActionLoading(jobId); setMsg(null);
    try {
      await printingService.review(jobId, action);
      setMsg({ text: `Job ${action === 'approve' ? 'approved' : 'rejected'} successfully.`, ok: true });
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed.';
      setMsg({ text: m, ok: false });
    } finally { setActionLoading(null); }
  };

  const handleQueue = async (jobId: string) => {
    setActionLoading(jobId); setMsg(null);
    try {
      await printingService.queue(jobId);
      setMsg({ text: 'Job queued successfully.', ok: true });
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Queue failed.';
      setMsg({ text: m, ok: false });
    } finally { setActionLoading(null); }
  };

  const handleStart = async (jobId: string) => {
    setActionLoading(jobId); setMsg(null);
    try {
      await printingService.start(jobId);
      setMsg({ text: 'Job started — download G-code and send to printer.', ok: true });
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Start failed.';
      setMsg({ text: m, ok: false });
    } finally { setActionLoading(null); }
  };

  const handleComplete = async (jobId: string) => {
    setActionLoading(jobId); setMsg(null);
    try {
      await printingService.complete(jobId);
      setMsg({ text: 'Job marked as completed.', ok: true });
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Complete failed.';
      setMsg({ text: m, ok: false });
    } finally { setActionLoading(null); }
  };

  const handleFail = async (jobId: string) => {
    if (!confirm('Mark this job as failed?')) return;
    setActionLoading(jobId); setMsg(null);
    try {
      await printingService.fail(jobId);
      setMsg({ text: 'Job marked as failed.', ok: true });
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Fail action failed.';
      setMsg({ text: m, ok: false });
    } finally { setActionLoading(null); }
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Printer size={18} className="text-primary" />
          <span className="text-sm font-orbitron text-text">Printing Jobs ({filteredJobs.length})</span>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary font-exo transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status tabs (multi-select) */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map(tab => {
          const isActive = activeStatuses.has(tab.key);
          return (
            <button key={tab.key} onClick={() => toggleStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-exo transition-all border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-glow'
                  : 'glass border-border text-text-muted hover:text-text hover:border-primary/50'
              }`}>
              {tab.label} <span className={`ml-1 ${isActive ? 'text-white/80' : 'text-text-muted'}`}>({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {msg && (
        <p className={`text-xs font-exo flex items-center gap-1.5 ${msg.ok ? 'text-success' : 'text-danger'}`}>
          {msg.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {msg.text}
        </p>
      )}

      {/* Table */}
      <div className="glass glow-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted font-exo text-sm">Loading…</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-text-muted font-exo text-sm">No jobs match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-exo">
              <thead className="border-b border-border">
                <tr className="text-left text-text-muted text-xs">
                  {['File', 'Material', 'Status', 'Order', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job._id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-text font-medium text-xs">{job.fileName || 'Unknown'}</span>
                        {job.slicingJobId?.weight && (
                          <span className="text-text-muted text-[10px]">{job.slicingJobId.weight.toFixed(1)}g</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {job.slicingJobId?.material ? (
                        <div className="flex flex-col">
                          <span className="text-primary text-xs font-orbitron">{job.slicingJobId.material}</span>
                          {job.slicingJobId.color && (
                            <span className="text-text-muted text-[10px]">{job.slicingJobId.color}</span>
                          )}
                        </div>
                      ) : <span className="text-text-muted text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${PRINTING_STATUS_COLORS[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {job.orderId ? (
                        <div className="flex flex-col">
                          <span className="text-text text-xs">{job.orderId._id.slice(0, 8)}…</span>
                          {job.slicingJobId?.calculatedPrice && (
                            <span className="text-primary text-[10px] font-orbitron">${job.slicingJobId.calculatedPrice.toFixed(2)}</span>
                          )}
                        </div>
                      ) : <span className="text-text-muted text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* View details — always */}
                        <button onClick={() => setSelectedJob(job)} aria-label="View details"
                          title="View details"
                          className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary transition-all">
                          <Eye size={13} />
                        </button>

                        {/* Download STL — labelled */}
                        {job.slicingJobId?.stlFileUrl && job.status !== 'Completed' && (
                          <button
                            onClick={() => downloadFile(job.slicingJobId!.stlFileUrl!, (job.fileName || 'model').replace(/\.[^.]+$/, '.stl'))}
                            aria-label="Download STL"
                            title="Download STL"
                            className="flex items-center gap-1 px-2 py-1 glass border border-blue-500/40 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all text-[10px] font-exo">
                            <Download size={11} /> STL
                          </button>
                        )}

                        {/* Download G-code — labelled, only once approved/queued/processing */}
                        {job.gcodeUrl && (job.status === 'Approved' || job.status === 'Queued' || job.status === 'Processing') && (
                          <button
                            onClick={() => downloadFile(job.gcodeUrl!, (job.fileName || 'model').replace(/\.[^.]+$/, '.gcode'))}
                            aria-label="Download G-code"
                            title="Download G-code"
                            className="flex items-center gap-1 px-2 py-1 glass border border-purple-500/40 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all text-[10px] font-exo">
                            <Download size={11} /> G-code
                          </button>
                        )}

                        {/* ── Workflow action buttons ── */}

                        {/* PENDING REVIEW → Approve or Reject */}
                        {job.status === 'Pending Review' && (
                          <>
                            <button onClick={() => handleReview(job._id, 'approve')}
                              disabled={actionLoading === job._id}
                              aria-label="Approve" title="Approve"
                              className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 hover:bg-green-500/30 transition-all text-[10px] font-exo disabled:opacity-40">
                              {actionLoading === job._id
                                ? <span className="w-3 h-3 border border-green-400/40 border-t-green-400 rounded-full animate-spin" />
                                : <CheckCircle size={11} />}
                              Approve
                            </button>
                            <button onClick={() => handleReview(job._id, 'reject')}
                              disabled={actionLoading === job._id}
                              aria-label="Reject" title="Reject"
                              className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all text-[10px] font-exo disabled:opacity-40">
                              {actionLoading === job._id
                                ? <span className="w-3 h-3 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                                : <XCircle size={11} />}
                              Reject
                            </button>
                          </>
                        )}

                        {/* APPROVED → Queue */}
                        {job.status === 'Approved' && (
                          <button onClick={() => handleQueue(job._id)}
                            disabled={actionLoading === job._id}
                            aria-label="Move to queue" title="Move to queue"
                            className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-[10px] font-exo disabled:opacity-40">
                            {actionLoading === job._id
                              ? <span className="w-3 h-3 border border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
                              : <Printer size={11} />}
                            Queue
                          </button>
                        )}

                        {/* QUEUED → Start printing */}
                        {job.status === 'Queued' && (
                          <button onClick={() => handleStart(job._id)}
                            disabled={actionLoading === job._id}
                            aria-label="Start printing" title="Start printing"
                            className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-all text-[10px] font-exo disabled:opacity-40">
                            {actionLoading === job._id
                              ? <span className="w-3 h-3 border border-orange-400/40 border-t-orange-400 rounded-full animate-spin" />
                              : <Cpu size={11} />}
                            Start
                          </button>
                        )}

                        {/* PROCESSING → Complete or Fail */}
                        {job.status === 'Processing' && (
                          <>
                            <button onClick={() => handleComplete(job._id)}
                              disabled={actionLoading === job._id}
                              aria-label="Mark complete" title="Mark complete"
                              className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 hover:bg-green-500/30 transition-all text-[10px] font-exo disabled:opacity-40">
                              {actionLoading === job._id
                                ? <span className="w-3 h-3 border border-green-400/40 border-t-green-400 rounded-full animate-spin" />
                                : <CheckCircle2 size={11} />}
                              Complete
                            </button>
                            <button onClick={() => handleFail(job._id)}
                              disabled={actionLoading === job._id}
                              aria-label="Mark failed" title="Mark failed"
                              className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all text-[10px] font-exo disabled:opacity-40">
                              {actionLoading === job._id
                                ? <span className="w-3 h-3 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                                : <XCircle size={11} />}
                              Fail
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job details modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setSelectedJob(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="glass border border-primary/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-base font-semibold text-text">Job Details</h3>
              <button onClick={() => setSelectedJob(null)}
                className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-text transition-all">
                <XCircle size={16} />
              </button>
            </div>

            <div className="space-y-4 text-sm font-exo">
              {/* Status */}
              <div>
                <span className="text-text-muted text-xs">Status:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${PRINTING_STATUS_COLORS[selectedJob.status]}`}>
                  {selectedJob.status}
                </span>
              </div>

              {/* File info */}
              <div>
                <span className="text-text-muted text-xs">File:</span>
                <span className="ml-2 text-text">{selectedJob.fileName || 'Unknown'}</span>
              </div>

              {/* Slicing details */}
              {selectedJob.slicingJobId && (
                <div className="glass border border-border/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-orbitron text-primary tracking-wider">SLICING DETAILS</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedJob.slicingJobId.material && (
                      <div><span className="text-text-muted">Material:</span> <span className="text-text ml-1">{selectedJob.slicingJobId.material}</span></div>
                    )}
                    {selectedJob.slicingJobId.color && (
                      <div><span className="text-text-muted">Color:</span> <span className="text-text ml-1">{selectedJob.slicingJobId.color}</span></div>
                    )}
                    {selectedJob.slicingJobId.weight && (
                      <div><span className="text-text-muted">Weight:</span> <span className="text-text ml-1">{selectedJob.slicingJobId.weight.toFixed(1)}g</span></div>
                    )}
                    {selectedJob.slicingJobId.printTime && (
                      <div><span className="text-text-muted">Print Time:</span> <span className="text-text ml-1">{selectedJob.slicingJobId.printTime} min</span></div>
                    )}
                    {selectedJob.slicingJobId.dimensions && (
                      <div className="col-span-2">
                        <span className="text-text-muted">Dimensions:</span>
                        <span className="text-text ml-1">
                          {selectedJob.slicingJobId.dimensions.width} × {selectedJob.slicingJobId.dimensions.height} × {selectedJob.slicingJobId.dimensions.depth} mm
                        </span>
                      </div>
                    )}
                    {selectedJob.slicingJobId.calculatedPrice && (
                      <div><span className="text-text-muted">Price:</span> <span className="text-primary ml-1 font-orbitron">${selectedJob.slicingJobId.calculatedPrice.toFixed(2)}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Order info */}
              {selectedJob.orderId && (
                <div className="glass border border-border/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-orbitron text-primary tracking-wider">ORDER INFO</p>
                  <div className="space-y-1 text-xs">
                    <div><span className="text-text-muted">Order ID:</span> <span className="text-text ml-1">{selectedJob.orderId._id}</span></div>
                    <div><span className="text-text-muted">Status:</span> <span className="text-text ml-1">{selectedJob.orderId.status}</span></div>
                    {selectedJob.orderId.shippingAddressSnapshot && (
                      <div>
                        <span className="text-text-muted">Shipping:</span>
                        <span className="text-text ml-1">
                          {selectedJob.orderId.shippingAddressSnapshot.city}, {selectedJob.orderId.shippingAddressSnapshot.country}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-text-muted">Created:</span> <span className="text-text ml-1">{new Date(selectedJob.createdAt).toLocaleString()}</span></div>
                {selectedJob.startedAt && (
                  <div><span className="text-text-muted">Started:</span> <span className="text-text ml-1">{new Date(selectedJob.startedAt).toLocaleString()}</span></div>
                )}
                {selectedJob.finishedAt && (
                  <div><span className="text-text-muted">Finished:</span> <span className="text-text ml-1">{new Date(selectedJob.finishedAt).toLocaleString()}</span></div>
                )}
              </div>

              {/* Download buttons */}
              <div className="flex gap-2 pt-2">
                {selectedJob.slicingJobId?.stlFileUrl && (
                  <button onClick={() => downloadFile(selectedJob.slicingJobId!.stlFileUrl!, selectedJob.fileName || 'model.stl')}
                    className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-xl text-xs font-exo hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2">
                    <Download size={13} /> Download STL
                  </button>
                )}
                {selectedJob.gcodeUrl && (
                  <button onClick={() => downloadFile(selectedJob.gcodeUrl!, (selectedJob.fileName || 'model').replace(/\.\w+$/, '.gcode'))}
                    className="flex-1 px-4 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-xl text-xs font-exo hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2">
                    <Download size={13} /> Download G-code
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Materials tab ────────────────────────────────────────────────────────────

const MATERIAL_TYPES: MaterialType[] = ['PLA', 'ABS', 'PETG', 'TPU', 'Resin'];

function MaterialsTab() {
  const [materials,  setMaterials]  = useState<AdminMaterial[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [editTarget, setEditTarget] = useState<AdminMaterial | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [msg,        setMsg]        = useState<{ text: string; ok: boolean } | null>(null);

  // Create form state
  const [form, setForm] = useState<CreateMaterialPayload>({
    name: '', type: 'PLA', currentPricePerGram: 0, color: '', isActive: true,
  });

  const load = () => {
    setLoading(true);
    materialService.adminGetAll()
      .then(setMaterials)
      .catch(() => setMsg({ text: 'Failed to load materials.', ok: false }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true); setMsg(null);
    try {
      await materialService.adminCreate(form);
      setMsg({ text: 'Material created.', ok: true });
      setShowCreate(false);
      setForm({ name: '', type: 'PLA', currentPricePerGram: 0, color: '', isActive: true });
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed.';
      setMsg({ text: m, ok: false });
    } finally { setSaving(false); }
  };

  const handleUpdate = async (id: string, patch: Partial<AdminMaterial>) => {
    setSaving(true); setMsg(null);
    try {
      await materialService.adminUpdate(id, {
        name:                patch.name,
        currentPricePerGram: patch.pricePerGram,
        color:               patch.color,
        isActive:            patch.isActive,
      });
      setMsg({ text: 'Material updated.', ok: true });
      setEditTarget(null);
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed.';
      setMsg({ text: m, ok: false });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this material?')) return;
    setSaving(true); setMsg(null);
    try {
      await materialService.adminDelete(id);
      setMsg({ text: 'Material deleted.', ok: true });
      load();
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed.';
      setMsg({ text: m, ok: false });
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3 py-2 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary transition-all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-orbitron text-text">Materials ({materials.length})</span>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary font-exo transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white font-orbitron text-xs rounded-lg hover:shadow-glow transition-all">
            <Plus size={13} /> {showCreate ? 'Cancel' : 'Add Material'}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <p className={`text-xs font-exo flex items-center gap-1.5 ${msg.ok ? 'text-success' : 'text-danger'}`}>
          {msg.ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {msg.text}
        </p>
      )}

      {/* Create form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass border border-primary/30 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-orbitron text-primary tracking-wider">NEW MATERIAL</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted font-exo mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. PLA Filament" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-exo mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MaterialType }))}
                className={inputCls}>
                {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted font-exo mb-1">Price per gram ($) *</label>
              <input type="number" min="0" step="0.001" value={form.currentPricePerGram}
                onChange={e => setForm(f => ({ ...f, currentPricePerGram: parseFloat(e.target.value) || 0 }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-exo mb-1">Color</label>
              <input value={form.color ?? ''} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="e.g. White, Black" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="mat-active" checked={form.isActive ?? true}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-primary" />
            <label htmlFor="mat-active" className="text-xs text-text-muted font-exo">Active (available for slicing)</label>
          </div>
          <button onClick={handleCreate} disabled={saving || !form.name.trim()}
            className="px-5 py-2 bg-primary text-white font-orbitron text-xs rounded-xl hover:shadow-glow transition-all disabled:opacity-40 flex items-center gap-2">
            {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={13} />}
            Create
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className="glass glow-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted font-exo text-sm">Loading…</div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center text-text-muted font-exo text-sm">No materials yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-exo">
              <thead className="border-b border-border">
                <tr className="text-left text-text-muted text-xs">
                  {['Type', 'Name', 'Price/g', 'Color', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    {editTarget?.id === m.id ? (
                      // Inline edit row
                      <>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-orbitron">{m.type}</span>
                        </td>
                        <td className="px-4 py-2">
                          <input value={editTarget.name}
                            onChange={e => setEditTarget(t => t ? { ...t, name: e.target.value } : t)}
                            className="w-full px-2 py-1 glass border border-border rounded text-xs text-text font-exo focus:outline-none focus:border-primary" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" step="0.001" value={editTarget.pricePerGram}
                            onChange={e => setEditTarget(t => t ? { ...t, pricePerGram: parseFloat(e.target.value) || 0 } : t)}
                            className="w-24 px-2 py-1 glass border border-border rounded text-xs text-text font-exo focus:outline-none focus:border-primary" />
                        </td>
                        <td className="px-4 py-2">
                          <input value={editTarget.color ?? ''}
                            onChange={e => setEditTarget(t => t ? { ...t, color: e.target.value } : t)}
                            className="w-24 px-2 py-1 glass border border-border rounded text-xs text-text font-exo focus:outline-none focus:border-primary" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="checkbox" checked={editTarget.isActive}
                            onChange={e => setEditTarget(t => t ? { ...t, isActive: e.target.checked } : t)}
                            className="w-4 h-4 accent-primary" />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleUpdate(m.id, editTarget)} disabled={saving}
                              className="px-2 py-1 bg-primary text-white rounded text-xs font-exo hover:shadow-glow transition-all disabled:opacity-40">
                              Save
                            </button>
                            <button onClick={() => setEditTarget(null)}
                              className="px-2 py-1 glass border border-border text-text-muted rounded text-xs font-exo hover:text-text transition-all">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Read row
                      <>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-orbitron">{m.type}</span>
                        </td>
                        <td className="px-4 py-3 text-text">{m.name}</td>
                        <td className="px-4 py-3 text-primary font-orbitron text-xs">${m.pricePerGram.toFixed(3)}</td>
                        <td className="px-4 py-3">
                          {m.color ? (
                            <span className="flex items-center gap-1.5 text-text-muted text-xs">
                              <span className="w-3 h-3 rounded-full border border-border inline-block"
                                style={{ backgroundColor: m.color.toLowerCase() }} />
                              {m.color}
                            </span>
                          ) : <span className="text-text-muted text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${m.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {m.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditTarget(m)} aria-label="Edit"
                              className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary transition-all">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(m.id)} disabled={saving} aria-label="Delete"
                              className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-red-400 hover:border-red-400/50 transition-all disabled:opacity-40">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

const ITEM_STATUS_COLORS: Record<string, string> = {
  Queued:   'bg-purple-500/20 text-purple-400',
  Printing: 'bg-orange-500/20 text-orange-400',
  Ready:    'bg-green-500/20  text-green-400',
};

const PRINTING_JOB_COLORS: Record<string, string> = {
  'Pending Review': 'bg-yellow-500/20 text-yellow-400',
  'Approved':       'bg-blue-500/20   text-blue-400',
  'Rejected':       'bg-red-500/20    text-red-400',
  'Queued':         'bg-purple-500/20 text-purple-400',
  'Processing':     'bg-orange-500/20 text-orange-400',
  'Completed':      'bg-green-500/20  text-green-400',
  'Failed':         'bg-red-500/20    text-red-400',
};

function OrderItemsModal({ orderId, orderNumber, onClose }: {
  orderId: string; orderNumber: string; onClose: () => void;
}) {
  const [items,   setItems]   = useState<ApiOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    orderService.adminGetById(orderId)
      .then(o => setItems(o.items))
      .catch(e => setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load items.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const getItemName = (item: ApiOrderItem): string => {
    if (typeof item.itemRefId === 'object' && item.itemRefId !== null) {
      return (item.itemRefId as ApiOrderItemRef).name;
    }
    return `${item.itemType} ${String(item.itemRefId).slice(0, 8)}…`;
  };

  const getItemImage = (item: ApiOrderItem): string | undefined => {
    if (typeof item.itemRefId === 'object' && item.itemRefId !== null) {
      const ref = item.itemRefId as ApiOrderItemRef;
      const raw = ref.images?.[0] ?? ref.thumbnailUrl;
      if (!raw) return undefined;
      return getDirectImageUrl(raw, import.meta.env.VITE_API_URL ?? '');
    }
    return undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="glass border border-primary/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Box size={16} className="text-primary" />
            <h3 className="font-orbitron text-sm font-semibold text-text">
              Order <span className="text-primary">{orderNumber}</span> — Items
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="p-1.5 glass border border-border rounded-lg text-text-muted hover:text-text transition-all">
            <XCircle size={15} />
          </button>
        </div>

        {loading && (
          <div className="py-10 text-center text-text-muted font-exo text-sm">Loading items…</div>
        )}
        {error && (
          <p className="text-xs text-danger font-exo flex items-center gap-1.5">
            <AlertCircle size={11} /> {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-10 text-center text-text-muted font-exo text-sm">No items found.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item._id} className="glass border border-border/60 rounded-xl p-4 space-y-3">
                {/* Item header */}
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-primary/5 flex items-center justify-center">
                    {getItemImage(item)
                      ? <AuthenticatedImage src={getItemImage(item)!} alt={getItemName(item)} className="w-full h-full object-cover" />
                      : <Package size={18} className="text-primary/40" />}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm font-medium truncate">{getItemName(item)}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-text-muted text-[10px] font-exo">
                        {item.itemType} · qty {item.quantity}
                      </span>
                      <span className="text-primary text-[10px] font-orbitron">${item.price.toFixed(2)}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${ITEM_STATUS_COLORS[item.status] ?? 'bg-border text-text-muted'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Printing properties */}
                {item.printingProperties && (
                  <div className="flex gap-3 flex-wrap text-[10px] font-exo text-text-muted">
                    {item.printingProperties.material && (
                      <span className="px-2 py-0.5 glass border border-border rounded-full">
                        {item.printingProperties.material}
                      </span>
                    )}
                    {item.printingProperties.color && (
                      <span className="px-2 py-0.5 glass border border-border rounded-full">
                        {item.printingProperties.color}
                      </span>
                    )}
                    {item.printingProperties.preset && (
                      <span className="px-2 py-0.5 glass border border-border rounded-full capitalize">
                        {item.printingProperties.preset}
                      </span>
                    )}
                    {item.printingProperties.scale && item.printingProperties.scale !== 100 && (
                      <span className="px-2 py-0.5 glass border border-border rounded-full">
                        {item.printingProperties.scale}% scale
                      </span>
                    )}
                  </div>
                )}

                {/* Printing jobs per unit */}
                {item.printingJobs && item.printingJobs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-orbitron text-text-muted tracking-wider mb-1.5">
                      PRINTING JOBS ({item.printingJobs.length} unit{item.printingJobs.length > 1 ? 's' : ''})
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(item.printingJobs as ApiPrintingJobStatus[]).map((js, i) => (
                        <span key={i}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-exo ${PRINTING_JOB_COLORS[js] ?? 'bg-border text-text-muted'}`}>
                          Unit {i + 1}: {js}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function OrdersTab({ orders, ordersLoading, onRefresh, onStatusChange }: {
  orders: import('../../types/api').ApiOrder[];
  ordersLoading: boolean;
  onRefresh: () => void;
  onStatusChange: (id: string, status: ApiOrderStatus) => void;
}) {
  const [expandedOrder,  setExpandedOrder]  = useState<{ id: string; number: string } | null>(null);
  const [statusFilter,   setStatusFilter]   = useState<ApiOrderStatus | 'all'>('all');

  const statusTabs: { key: ApiOrderStatus | 'all'; label: string }[] = [
    { key: 'all',        label: 'All'        },
    { key: 'Pending',    label: 'Pending'    },
    { key: 'Processing', label: 'Processing' },
    { key: 'Shipped',    label: 'Shipped'    },
    { key: 'Delivered',  label: 'Delivered'  },
    { key: 'Cancelled',  label: 'Cancelled'  },
  ];

  const filtered = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <>
      <div className="space-y-4">
        {/* Status filter tabs (single-select) */}
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map(t => {
            const count = t.key === 'all' ? orders.length : orders.filter(o => o.status === t.key).length;
            const active = statusFilter === t.key;
            return (
              <button key={t.key} onClick={() => setStatusFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-exo transition-all border ${
                  active
                    ? 'bg-primary text-white border-primary shadow-glow'
                    : 'glass border-border text-text-muted hover:text-text hover:border-primary/50'
                }`}>
                {t.label}
                <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-text-muted'}`}>({count})</span>
              </button>
            );
          })}
        </div>

        <div className="glass glow-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-orbitron text-text">
              {statusFilter === 'all' ? 'All Orders' : statusFilter} ({filtered.length})
            </span>
            <button onClick={onRefresh} disabled={ordersLoading}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary font-exo transition-colors">
              <RefreshCw size={12} className={ordersLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-text-muted font-exo">
              {ordersLoading ? 'Loading...' : 'No orders found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-exo">
                <thead className="border-b border-border">
                  <tr className="text-left text-text-muted text-xs">
                    {['Order #', 'User', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o._id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      {/* Order # */}
                      <td className="px-4 py-3 text-primary font-orbitron text-xs">{o.orderNumber}</td>

                      {/* User */}
                      <td className="px-4 py-3 text-text-muted text-xs">{o.userId.slice(0, 8)}…</td>

                      {/* Total */}
                      <td className="px-4 py-3 text-text font-orbitron text-xs">
                        ${o.pricingSummary.total.toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-muted text-[10px]">{o.paymentInfo.method}</span>
                          <span className={`text-[10px] ${
                            o.paymentInfo.status === 'Paid'   ? 'text-green-400' :
                            o.paymentInfo.status === 'Failed' ? 'text-red-400'   : 'text-yellow-400'
                          }`}>{o.paymentInfo.status}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[o.status]}`}>
                          {o.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions: view items + status change */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* View items button */}
                          <button
                            onClick={() => setExpandedOrder({ id: o._id, number: o.orderNumber })}
                            aria-label="View items" title="View order items"
                            className="flex items-center gap-1 px-2 py-1 glass border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary transition-all text-[10px] font-exo">
                            <Eye size={11} />
                            Items ({o.items.length})
                          </button>

                          {/* Status change select */}
                          <select defaultValue={o.status}
                            onChange={e => onStatusChange(o._id, e.target.value as ApiOrderStatus)}
                            className="glass border border-border rounded px-2 py-1 text-xs text-text font-exo focus:outline-none focus:border-primary">
                            {API_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Items modal */}
      <AnimatePresence>
        {expandedOrder && (
          <OrderItemsModal
            orderId={expandedOrder.id}
            orderNumber={expandedOrder.number}
            onClose={() => setExpandedOrder(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const { hydrating } = useAppSelector(s => s.auth);
  const { items: orders, loading: ordersLoading } = useAppSelector(s => s.orders);
  const { adminItems: products, loading: productsLoading } = useAppSelector(s => s.products);

  const [tab, setTab] = useState<'orders' | 'products' | 'users' | 'materials' | 'printing'>('orders');
  const [users,        setUsers]        = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass border border-border rounded-xl p-1 w-fit flex-wrap">
          {(['orders', 'products', 'users', 'materials', 'printing'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-exo capitalize transition-all ${tab === t ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}>
              {t === 'materials' ? <span className="flex items-center gap-1.5"><FlaskConical size={13} />Materials</span>
               : t === 'printing' ? <span className="flex items-center gap-1.5"><Printer size={13} />Printing</span>
               : t}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === 'orders' && (
          <OrdersTab
            orders={orders}
            ordersLoading={ordersLoading}
            onRefresh={() => dispatch(fetchAllOrdersThunk({}))}
            onStatusChange={(id, status) => dispatch(updateOrderStatusThunk({ id, status }))}
          />
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
                      {['Image', 'Name', 'Material', 'Price', 'Active', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3">
                          {p.images?.[0]
                            ? <AuthenticatedImage
                                src={getDirectImageUrl(p.images[0], import.meta.env.VITE_API_URL ?? '')}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-border"
                              />
                            : <div className="w-10 h-10 rounded-lg bg-primary/10 border border-border flex items-center justify-center text-primary/40 text-[10px] font-orbitron">3D</div>}
                        </td>
                        <td className="px-4 py-3 text-text font-medium">{p.name}</td>
                        <td className="px-4 py-3">
                          {p.printingProperties?.material
                            ? <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-orbitron">{p.printingProperties.material}</span>
                            : <span className="text-text-muted text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-primary font-orbitron text-xs">
                          {p.slicingResult?.calculatedPrice != null
                            ? `$${Number(p.slicingResult.calculatedPrice).toFixed(2)}`
                            : p.currentBasePrice != null
                            ? `$${Number(p.currentBasePrice).toFixed(2)}`
                            : '—'}
                        </td>
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

        {/* Materials */}
        {tab === 'materials' && <MaterialsTab />}

        {/* Printing Review */}
        {tab === 'printing' && <PrintingReviewTab />}
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
