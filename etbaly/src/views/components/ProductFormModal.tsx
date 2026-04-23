import { useState, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, ChevronRight, Upload, Image } from 'lucide-react';
import { designService } from '../../services/designService';
import { productService } from '../../services/productService';
import type { ApiProduct } from '../../types/api';
import type { ApiMaterialType } from '../../types/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editProduct: ApiProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted font-exo focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all bg-transparent';
const labelCls = 'block text-xs font-medium text-text-muted font-exo mb-1.5';
const MATERIALS: ApiMaterialType[] = ['PLA', 'ABS', 'Resin', 'TPU', 'PETG'];

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ['Upload File', 'Create Design', 'Upload Image', 'Product Details'];

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      {STEP_LABELS.slice(0, total).map((label, i) => (
        <div key={label} className="flex items-center gap-1 shrink-0">
          <div className={[
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-exo transition-all whitespace-nowrap',
            i < current  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
            : i === current ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
            : 'glass border border-border text-text-muted',
          ].join(' ')}>
            {i < current
              ? <CheckCircle2 size={11} />
              : <span className="font-orbitron text-[10px]">{i + 1}</span>}
            {label}
          </div>
          {i < total - 1 && <ChevronRight size={11} className="text-border shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ─── Error box ────────────────────────────────────────────────────────────────

function ErrBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-exo">
      <AlertCircle size={13} className="shrink-0 mt-0.5" /> {msg}
    </div>
  );
}

// ─── Spinner button ───────────────────────────────────────────────────────────

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
      {loading
        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : children}
    </button>
  );
}

// ─── Step 1: Upload STL/OBJ ───────────────────────────────────────────────────

function Step1({ onDone }: { onDone: (fileUrl: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [file,    setFile]    = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [error,   setError]   = useState('');

  const pick = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj'].includes(ext ?? '')) { setError('Only .stl and .obj files are accepted.'); return; }
    if (f.size > 200 * 1024 * 1024) { setError('File must be under 200 MB.'); return; }
    setError(''); setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const url = await designService.adminUploadFile(file);
      setFileUrl(url);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !fileUrl && ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !fileUrl) pick(f); }}
        className={[
          'border-2 border-dashed rounded-xl p-8 text-center transition-all',
          fileUrl ? 'border-green-500/40 bg-green-500/5 cursor-default'
          : 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
        ].join(' ')}
      >
        {fileUrl ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 size={32} className="text-green-400" />
            <p className="text-sm font-exo text-green-400 font-medium">{file?.name}</p>
            <p className="text-xs font-exo text-text-muted break-all">{fileUrl}</p>
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

      {!fileUrl && (
        <Btn loading={loading} disabled={!file} onClick={upload}>
          Upload File
        </Btn>
      )}
      {fileUrl && (
        <Btn onClick={() => onDone(fileUrl)}>
          Next: Create Design →
        </Btn>
      )}
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
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-exo border transition-all',
                    materials.includes(m)
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'glass border-border text-text-muted hover:border-primary/40',
                  ].join(' ')}>
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
          ? <Btn onClick={() => onDone(designId)}>Next: Upload Image →</Btn>
          : <Btn loading={loading} disabled={!name.trim() || materials.length === 0} onClick={create}>Create Design</Btn>}
      </div>
    </div>
  );
}

// ─── Step 3: Upload product image ─────────────────────────────────────────────

function Step3({ onBack, onDone }: { onBack: () => void; onDone: (imageUrl: string) => void }) {
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
        className={[
          'border-2 border-dashed rounded-xl p-6 text-center transition-all',
          imageUrl ? 'border-green-500/40 bg-green-500/5 cursor-default'
          : 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
        ].join(' ')}
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

// ─── Step 4: Product details ──────────────────────────────────────────────────

function Step4({ editProduct, designId, imageUrl, onBack, onSuccess }: {
  editProduct: ApiProduct | null;
  designId: string;
  imageUrl: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [name,        setName]        = useState(editProduct?.name ?? '');
  const [description, setDescription] = useState(editProduct?.description ?? '');
  const [price,       setPrice]       = useState(String(editProduct?.currentBasePrice ?? ''));
  const [stock,       setStock]       = useState(String(editProduct?.stockLevel ?? '0'));
  const [isActive,    setIsActive]    = useState(editProduct?.isActive ?? true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Product name is required.'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { setError('Enter a valid price (min 0).'); return; }
    setError(''); setLoading(true);
    try {
      if (editProduct) {
        await productService.update(editProduct._id, {
          name: name.trim(),
          description: description.trim() || undefined,
          currentBasePrice: priceNum,
          stockLevel: parseInt(stock) || 0,
          isActive,
        });
      } else {
        await productService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          currentBasePrice: priceNum,
          linkedDesignId: designId,
          images: imageUrl ? [imageUrl] : [],
          isActive,
          stockLevel: parseInt(stock) || 0,
        });
      }
      onSuccess();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save product.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Read-only context — only in create mode */}
      {!editProduct && (
        <div className="grid grid-cols-1 gap-2">
          <div className="p-3 glass border border-border/50 rounded-xl">
            <p className="text-xs font-exo text-text-muted">Linked Design ID</p>
            <p className="text-xs font-exo text-primary font-medium mt-0.5 break-all">{designId}</p>
          </div>
          <div className="p-3 glass border border-border/50 rounded-xl">
            <p className="text-xs font-exo text-text-muted">Image URL</p>
            <p className="text-xs font-exo text-primary font-medium mt-0.5 break-all">{imageUrl || '(none)'}</p>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Price ($) *</label>
          <input type="number" min="0" step="0.01" value={price}
            onChange={e => setPrice(e.target.value)} placeholder="29.99" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Stock Level</label>
          <input type="number" min="0" step="1" value={stock}
            onChange={e => setStock(e.target.value)} placeholder="0" className={inputCls} />
        </div>
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
  // Edit mode: skip steps 1-3, go straight to step 3 (index 3)
  const [step,     setStep]     = useState(editProduct ? 3 : 0);
  const [fileUrl,  setFileUrl]  = useState('');
  const [designId, setDesignId] = useState('');
  const [imageUrl, setImageUrl] = useState(editProduct?.images?.[0] ?? '');

  const isEdit  = editProduct !== null;
  const total   = isEdit ? 1 : 4;   // step bar shows 4 steps in create, 1 in edit
  const current = isEdit ? 0 : step; // in edit mode always show step 0 of 1

  const title = isEdit ? `Edit: ${editProduct.name}` : 'Create Product';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
      <div className="glass border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-orbitron text-base font-semibold text-text">{title}</h2>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-full glass border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isEdit && <StepBar current={current} total={total} />}

          {step === 0 && (
            <Step1 onDone={url => { setFileUrl(url); setStep(1); }} />
          )}
          {step === 1 && (
            <Step2
              fileUrl={fileUrl}
              onBack={() => setStep(0)}
              onDone={id => { setDesignId(id); setStep(2); }}
            />
          )}
          {step === 2 && (
            <Step3
              onBack={() => setStep(1)}
              onDone={url => { setImageUrl(url); setStep(3); }}
            />
          )}
          {step === 3 && (
            <Step4
              editProduct={editProduct}
              designId={designId}
              imageUrl={imageUrl}
              onBack={() => setStep(2)}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
