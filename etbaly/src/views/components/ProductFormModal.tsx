import { useState, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, ChevronRight, Upload, Image, Cpu, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { designService } from '../../services/designService';
import { productService } from '../../services/productService';
import { slicingService } from '../../services/slicingService';
import type { ApiProduct } from '../../types/api';
import type { ApiMaterialType } from '../../types/api';

interface Props {
  editProduct: ApiProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls = 'w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all bg-transparent';
const labelCls = 'block text-xs font-medium text-text-muted font-exo mb-1.5';
const MATERIALS: ApiMaterialType[] = ['PLA', 'ABS', 'Resin', 'TPU', 'PETG'];
const PRESETS = ['normal', 'heavy', 'draft'] as const;
const COLORS   = ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gray', 'Silver', 'Transparent', 'Brown', 'Cyan'];

// Step labels differ between create (5 steps) and edit (1 step)
const CREATE_STEPS = ['Upload File', 'Create Design', 'Slice', 'Upload Image', 'Details'];

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      {CREATE_STEPS.slice(0, total).map((label, i) => (
        <div key={label} className="flex items-center gap-1 shrink-0">
          <div className={[
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-exo transition-all whitespace-nowrap',
            i < current  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
            : i === current ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
            : 'glass border border-border text-text-muted',
          ].join(' ')}>
            {i < current ? <CheckCircle2 size={11} /> : <span className="font-orbitron text-[10px]">{i + 1}</span>}
            {label}
          </div>
          {i < total - 1 && <ChevronRight size={11} className="text-border shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-exo">
      <AlertCircle size={13} className="shrink-0 mt-0.5" /> {msg}
    </div>
  );
}

function Btn({ loading, disabled, onClick, children, variant = 'primary' }: {
  loading?: boolean; disabled?: boolean; onClick?: () => void;
  children: React.ReactNode; variant?: 'primary' | 'ghost';
}) {
  const base = 'flex items-center justify-center gap-2 px-5 py-2.5 font-orbitron text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const cls  = variant === 'primary'
    ? `${base} bg-primary text-white hover:shadow-glow`
    : `${base} glass border border-border text-text-muted hover:text-primary hover:border-primary`;
  return (
    <button className={cls} disabled={disabled || loading} onClick={onClick}>
      {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
    </button>
  );
}

// ─── Step 1: Upload STL/OBJ ───────────────────────────────────────────────────

function Step1({ onDone }: { onDone: (fileUrl: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileUrl,  setFileUrl]  = useState('');
  const [error,    setError]    = useState('');

  const pick = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj'].includes(ext ?? '')) { setError('Only .stl and .obj files are accepted.'); return; }
    if (f.size > 200 * 1024 * 1024) { setError('File must be under 200 MB.'); return; }
    setError(''); setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true); setError(''); setProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', file.name);
      // Do NOT set Content-Type manually — let the browser set it with the correct multipart boundary
      const res = await api.post('/designs/upload', form, {
        timeout: 0,
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      setFileUrl(res.data.data.fileUrl);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !fileUrl && !loading && ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !fileUrl && !loading) pick(f); }}
        className={[
          'border-2 border-dashed rounded-xl p-8 text-center transition-all',
          fileUrl ? 'border-green-500/40 bg-green-500/5 cursor-default'
          : loading ? 'border-primary/40 bg-primary/5 cursor-default'
          : 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
        ].join(' ')}
      >
        {fileUrl ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 size={32} className="text-green-400" />
            <p className="text-sm font-exo text-green-400 font-medium">{file?.name}</p>
            <p className="text-xs font-exo text-text-muted break-all">{fileUrl.slice(0, 60)}…</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <Upload size={28} className="text-primary" />
            <p className="text-sm font-exo text-primary">{file.name}</p>
            <p className="text-xs font-exo text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={28} className="text-text-muted" />
            <p className="text-sm font-exo text-text-muted">Drag & drop or click to select</p>
            <p className="text-xs font-exo text-text-muted/60">.stl, .obj — max 200 MB</p>
          </div>
        )}
        <input ref={ref} type="file" accept=".stl,.obj" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      </div>

      <ErrBox msg={error} />

      {loading && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-exo text-text-muted">
            <span>Uploading to Google Drive…</span>
            <span className="text-primary font-medium">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] font-exo text-text-muted">Large files may take a moment — please wait.</p>
        </div>
      )}

      {!fileUrl && <Btn loading={loading} disabled={!file} onClick={upload}>Upload File</Btn>}
      {fileUrl  && <Btn onClick={() => onDone(fileUrl)}>Next: Create Design →</Btn>}
    </div>
  );
}

// ─── Step 2: Create Design record ────────────────────────────────────────────

function Step2({ fileUrl, onBack, onDone }: { fileUrl: string; onBack: () => void; onDone: (designId: string) => void }) {
  const [name,      setName]      = useState('');
  const [materials, setMaterials] = useState<ApiMaterialType[]>(['PLA']);
  const [printable, setPrintable] = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [designId,  setDesignId]  = useState('');
  const [error,     setError]     = useState('');

  const toggleMat = (m: ApiMaterialType) =>
    setMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const create = async () => {
    if (!name.trim()) { setError('Design name is required.'); return; }
    if (materials.length === 0) { setError('Select at least one material.'); return; }
    setLoading(true); setError('');
    try {
      const design = await designService.adminCreate({
        name: name.trim(), fileUrl, isPrintable: printable,
        metadata: { supportedMaterials: materials },
      });
      setDesignId(design._id);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create design.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 glass border border-border/50 rounded-xl">
        <p className="text-xs font-exo text-text-muted">File URL</p>
        <p className="text-xs font-exo text-primary break-all mt-0.5">{fileUrl.slice(0, 80)}…</p>
      </div>

      {designId ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 size={36} className="text-green-400" />
          <p className="text-sm font-exo text-green-400 font-medium">Design created!</p>
          <p className="text-xs font-exo text-text-muted">ID: {designId}</p>
        </div>
      ) : (
        <>
          <div>
            <label className={labelCls}>Design Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Custom Bracket" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Supported Materials * (select at least one)</label>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map(m => (
                <button key={m} type="button" onClick={() => toggleMat(m)}
                  className={['px-3 py-1.5 rounded-lg text-xs font-exo border transition-all',
                    materials.includes(m) ? 'bg-primary/20 border-primary/50 text-primary' : 'glass border-border text-text-muted hover:border-primary/40'].join(' ')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setPrintable(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${printable ? 'bg-primary' : 'bg-border'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${printable ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-exo text-text-muted">Is Printable</span>
          </label>
        </>
      )}

      <ErrBox msg={error} />
      <div className="flex gap-2">
        <Btn variant="ghost" onClick={onBack} disabled={loading}>← Back</Btn>
        {designId
          ? <Btn onClick={() => onDone(designId)}>Next: Slice →</Btn>
          : <Btn loading={loading} disabled={!name.trim() || materials.length === 0} onClick={create}>Create Design</Btn>}
      </div>
    </div>
  );
}

// ─── Step 3: Run Slicing ──────────────────────────────────────────────────────

function Step3({ designId, onBack, onDone }: { designId: string; onBack: () => void; onDone: (slicingJobId: string) => void }) {
  const [material,     setMaterial]     = useState<ApiMaterialType>('PLA');
  const [color,        setColor]        = useState('White');
  const [preset,       setPreset]       = useState<'normal' | 'heavy' | 'draft'>('normal');
  const [scale,        setScale]        = useState(100);
  const [loading,      setLoading]      = useState(false);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [slicingJobId, setSlicingJobId] = useState('');
  const [error,        setError]        = useState('');

  const runSlicing = async () => {
    setLoading(true); setError(''); setStatusMsg('Dispatching slicing job…');
    try {
      const resp = await slicingService.executeSlicing({
        designId, material, color, preset, scale,
      });
      setStatusMsg('Slicing in progress — this may take a few minutes…');
      const completed = await slicingService.pollJobStatus(
        resp.jobId,
        job => setStatusMsg(`Slicing: ${job.status}…`),
        120, 5000,
      );
      setSlicingJobId(completed.jobId);
      setStatusMsg('');
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Slicing failed.');
      setStatusMsg('');
    } finally { setLoading(false); }
  };

  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="space-y-4">
      <div className="p-3 glass border border-border/50 rounded-xl">
        <p className="text-xs font-exo text-text-muted">Design ID</p>
        <p className="text-xs font-exo text-primary break-all mt-0.5">{designId}</p>
      </div>

      {slicingJobId ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 size={36} className="text-green-400" />
          <p className="text-sm font-exo text-green-400 font-medium">Slicing completed!</p>
          <p className="text-xs font-exo text-text-muted">Job ID: {slicingJobId}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Material *</label>
              <select value={material} onChange={e => setMaterial(e.target.value as ApiMaterialType)} className={selectCls}>
                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Color *</label>
              <select value={color} onChange={e => setColor(e.target.value)} className={selectCls}>
                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Preset</label>
              <select value={preset} onChange={e => setPreset(e.target.value as typeof preset)} className={selectCls}>
                {PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Scale (%)</label>
              <input type="number" min={1} max={1000} value={scale}
                onChange={e => setScale(Number(e.target.value) || 100)} className={inputCls} />
            </div>
          </div>

          {loading && statusMsg && (
            <div className="flex items-center gap-2 text-xs font-exo text-primary">
              <Loader2 size={13} className="animate-spin shrink-0" />
              {statusMsg}
            </div>
          )}
        </>
      )}

      <ErrBox msg={error} />
      <div className="flex gap-2">
        <Btn variant="ghost" onClick={onBack} disabled={loading}>← Back</Btn>
        {slicingJobId
          ? <Btn onClick={() => onDone(slicingJobId)}>Next: Upload Image →</Btn>
          : <Btn loading={loading} onClick={runSlicing}>
              <Cpu size={14} /> Run Slicing
            </Btn>}
      </div>
    </div>
  );
}

// ─── Step 4: Upload product image ─────────────────────────────────────────────

function Step4({ onBack, onDone }: { onBack: () => void; onDone: (imageUrl: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error,    setError]    = useState('');

  const pick = (f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (f.size > 10 * 1024 * 1024)   { setError('Image must be under 10 MB.'); return; }
    setError(''); setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const url = await productService.uploadImage(file);
      setImageUrl(url);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !imageUrl && ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !imageUrl) pick(f); }}
        className={['border-2 border-dashed rounded-xl p-6 text-center transition-all',
          imageUrl ? 'border-green-500/40 bg-green-500/5 cursor-default'
          : 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'].join(' ')}
      >
        {imageUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain mx-auto" />
            <CheckCircle2 size={20} className="text-green-400" />
            <p className="text-xs font-exo text-green-400">Image uploaded successfully</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-2">
            <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain mx-auto" />
            <p className="text-xs font-exo text-text-muted">{file?.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Image size={28} className="text-text-muted" />
            <p className="text-sm font-exo text-text-muted">Drag & drop or click to select</p>
            <p className="text-xs font-exo text-text-muted/60">JPEG, PNG, WebP — max 10 MB</p>
          </div>
        )}
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      </div>

      <ErrBox msg={error} />
      <div className="flex gap-2">
        <Btn variant="ghost" onClick={onBack} disabled={loading}>← Back</Btn>
        {imageUrl
          ? <Btn onClick={() => onDone(imageUrl)}>Next: Product Details →</Btn>
          : <Btn loading={loading} disabled={!file} onClick={upload}>Upload Image</Btn>}
      </div>
    </div>
  );
}

// ─── Step 5: Product details ──────────────────────────────────────────────────

function Step5({ editProduct, designId, slicingJobId, imageUrl, onBack, onSuccess }: {
  editProduct: ApiProduct | null;
  designId:    string;
  slicingJobId: string;
  imageUrl:    string;
  onBack:      () => void;
  onSuccess:   () => void;
}) {
  const [name,        setName]        = useState(editProduct?.name ?? '');
  const [description, setDescription] = useState(editProduct?.description ?? '');
  const [isActive,    setIsActive]    = useState(editProduct?.isActive ?? true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Product name is required.'); return; }
    setError(''); setLoading(true);
    try {
      if (editProduct) {
        await productService.update(editProduct._id, {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
        });
      } else {
        await productService.create({
          name:          name.trim(),
          description:   description.trim() || undefined,
          linkedDesignId: designId,
          slicingJobId,
          images:        imageUrl ? [imageUrl] : [],
          isActive,
        });
      }
      onSuccess();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save product.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {!editProduct && (
        <div className="grid grid-cols-1 gap-2 text-[10px] font-exo">
          <div className="p-2.5 glass border border-border/50 rounded-xl flex gap-2">
            <span className="text-text-muted shrink-0">Design:</span>
            <span className="text-primary break-all">{designId}</span>
          </div>
          <div className="p-2.5 glass border border-border/50 rounded-xl flex gap-2">
            <span className="text-text-muted shrink-0">Slicing Job:</span>
            <span className="text-primary break-all">{slicingJobId}</span>
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Product Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Geometric Vase" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={3} placeholder="Optional description…" className={`${inputCls} resize-none`} />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div onClick={() => setIsActive(v => !v)}
          className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-primary' : 'bg-border'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm font-exo text-text-muted">Active (visible to customers)</span>
      </label>

      <ErrBox msg={error} />
      <div className="flex gap-2">
        {!editProduct && <Btn variant="ghost" onClick={onBack} disabled={loading}>← Back</Btn>}
        <Btn loading={loading} onClick={submit}>
          {editProduct ? 'Save Changes' : 'Create Product'}
        </Btn>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function ProductFormModal({ editProduct, onClose, onSuccess }: Props) {
  const [step,         setStep]         = useState(editProduct ? 4 : 0);
  const [fileUrl,      setFileUrl]      = useState('');
  const [designId,     setDesignId]     = useState('');
  const [slicingJobId, setSlicingJobId] = useState('');
  const [imageUrl,     setImageUrl]     = useState(editProduct?.images?.[0] ?? '');

  const isEdit  = editProduct !== null;
  const total   = isEdit ? 1 : 5;
  const current = isEdit ? 0 : step;
  const title   = isEdit ? `Edit: ${editProduct.name}` : 'Create Product';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
      <div className="glass border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-orbitron text-base font-semibold text-text">{title}</h2>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-full glass border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!isEdit && <StepBar current={current} total={total} />}

          {step === 0 && <Step1 onDone={url => { setFileUrl(url); setStep(1); }} />}
          {step === 1 && <Step2 fileUrl={fileUrl} onBack={() => setStep(0)} onDone={id => { setDesignId(id); setStep(2); }} />}
          {step === 2 && <Step3 designId={designId} onBack={() => setStep(1)} onDone={id => { setSlicingJobId(id); setStep(3); }} />}
          {step === 3 && <Step4 onBack={() => setStep(2)} onDone={url => { setImageUrl(url); setStep(4); }} />}
          {step === 4 && (
            <Step5
              editProduct={editProduct}
              designId={designId}
              slicingJobId={slicingJobId}
              imageUrl={imageUrl}
              onBack={() => setStep(3)}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
