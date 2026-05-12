import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, LayoutGrid, List, ArrowUpDown, Check, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useProductsViewModel } from '../../viewmodels/useProductsViewModel';
import type { SortOption } from '../../viewmodels/useProductsViewModel';
import ProductCard from '../components/ProductCard';
import PageWrapper from '../components/PageWrapper';
import type { CollectionType, MaterialType } from '../../models/Product';

const COLLECTIONS: CollectionType[] = ['Home Decor', 'Mechanical Parts', 'Art & Sculptures', 'Jewelry', 'Architecture'];
const MATERIALS: MaterialType[] = ['PLA', 'ABS', 'PETG', 'Resin', 'TPU', 'Nylon'];
const MATERIAL_DOTS: Record<string, string> = { PLA: 'bg-green-400', ABS: 'bg-orange-400', PETG: 'bg-blue-400', Resin: 'bg-purple-400', TPU: 'bg-yellow-400', Nylon: 'bg-pink-400' };
const SORTS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' }, { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' }, { value: 'price-asc', label: 'Price: Low → High' }, { value: 'price-desc', label: 'Price: High → Low' },
];

type VM = ReturnType<typeof useProductsViewModel>;

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 pb-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between mb-3 group" aria-expanded={open}>
        <span className="font-orbitron text-xs font-semibold text-text-muted tracking-widest group-hover:text-text transition-colors">{title}</span>
        {open ? <ChevronUp size={13} className="text-text-muted" /> : <ChevronDown size={13} className="text-text-muted" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Checkbox({ checked, onChange, label, dot }: { checked: boolean; onChange: () => void; label: string; dot?: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div onClick={onChange} role="checkbox" aria-checked={checked} tabIndex={0} onKeyDown={e => e.key === ' ' && onChange()}
        className={['w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer', checked ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/60'].join(' ')}>
        {checked && <Check size={10} className="text-white" />}
      </div>
      <div className="flex items-center gap-1.5">
        {dot && <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />}
        <span className={`text-sm font-exo transition-colors ${checked ? 'text-text' : 'text-text-muted group-hover:text-text'}`}>{label}</span>
      </div>
    </label>
  );
}

function FilterSidebar({ vm, onClose }: { vm: VM; onClose?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron text-sm font-semibold text-text">Filters</h3>
        <div className="flex items-center gap-2">
          {vm.activeFilterCount > 0 && <button onClick={vm.resetFilters} className="text-xs text-primary hover:underline font-exo">Clear all</button>}
          {onClose && <button onClick={onClose} aria-label="Close filters" className="text-text-muted hover:text-primary transition-colors"><X size={16} /></button>}
        </div>
      </div>
      <FilterSection title="COLLECTIONS">
        <div className="space-y-2">{COLLECTIONS.map(c => <Checkbox key={c} checked={vm.filters.collections.includes(c)} onChange={() => vm.toggleCollection(c)} label={c} />)}</div>
      </FilterSection>
      <FilterSection title="MATERIAL">
        <div className="space-y-2">{MATERIALS.map(m => <Checkbox key={m} checked={vm.filters.materials.includes(m)} onChange={() => vm.toggleMaterial(m)} label={m} dot={MATERIAL_DOTS[m]} />)}</div>
      </FilterSection>
      <FilterSection title="PRICE RANGE">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-exo text-text-muted">
            <span>$0</span><span className="text-primary font-medium">${vm.filters.priceMax >= 9999 ? vm.maxPrice : vm.filters.priceMax}</span>
          </div>
          <input type="range" min={0} max={vm.maxPrice} step={5} value={vm.filters.priceMax >= 9999 ? vm.maxPrice : vm.filters.priceMax}
            onChange={e => vm.setPriceRange(0, Number(e.target.value))} className="w-full accent-primary cursor-pointer" aria-label="Maximum price filter" />
        </div>
      </FilterSection>
      <FilterSection title="AVAILABILITY" defaultOpen={false}>
        <Checkbox checked={vm.filters.inStockOnly} onChange={() => vm.setInStockOnly(!vm.filters.inStockOnly)} label="In stock only" />
      </FilterSection>
    </div>
  );
}

function SortDropdown({ vm }: { vm: VM }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORTS.find(s => s.value === vm.filters.sort);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} aria-label="Sort products" aria-expanded={open}
        className="flex items-center gap-2 px-3 py-2.5 glass border border-border rounded-xl text-sm text-text-muted hover:text-text hover:border-primary transition-all font-exo">
        <ArrowUpDown size={14} /><span className="hidden sm:inline">{current?.label}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-52 glass border border-border rounded-xl overflow-hidden z-20 shadow-glow">
            {SORTS.map(s => (
              <button key={s.value} onClick={() => { vm.setSort(s.value); setOpen(false); }}
                className={['w-full flex items-center justify-between px-4 py-2.5 text-sm font-exo transition-colors text-left', s.value === vm.filters.sort ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-primary/5'].join(' ')}>
                {s.label}{s.value === vm.filters.sort && <Check size={13} className="text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveFilterChips({ vm }: { vm: VM }) {
  const chips = [
    ...vm.filters.collections.map(c => ({ label: c, onRemove: () => vm.toggleCollection(c) })),
    ...vm.filters.materials.map(m => ({ label: m, onRemove: () => vm.toggleMaterial(m) })),
    ...(vm.filters.inStockOnly ? [{ label: 'In stock', onRemove: () => vm.setInStockOnly(false) }] : []),
    ...(vm.filters.priceMax < 9999 ? [{ label: `≤ $${vm.filters.priceMax}`, onRemove: () => vm.setPriceRange(0, 9999) }] : []),
  ];
  if (chips.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2 mb-5">
      {chips.map(chip => (
        <motion.span key={chip.label} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-exo rounded-full">
          {chip.label}<button onClick={chip.onRemove} aria-label={`Remove ${chip.label} filter`} className="hover:text-white transition-colors"><X size={11} /></button>
        </motion.span>
      ))}
      <button onClick={vm.resetFilters} className="text-xs text-text-muted hover:text-primary font-exo transition-colors self-center">Clear all</button>
    </motion.div>
  );
}

export default function ProductsPage() {
  const vm = useProductsViewModel();
  const [searchInput, setSearchInput] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const debounceRef = useRef<number>(0);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => vm.setSearch(searchInput), 300);
    return () => window.clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <span className="text-xs font-orbitron text-primary tracking-widest">CATALOGUE</span>
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-text mt-1 mb-1">Collections</h1>
          <p className="text-text-muted font-exo text-sm">{vm.loading ? 'Loading…' : `${vm.products.length} of ${vm.totalCount} models`}</p>
        </div>
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input type="search" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search models, tags, materials…" aria-label="Search products"
              className="w-full pl-9 pr-9 py-2.5 glass border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all font-exo" />
            {searchInput && <button onClick={() => { setSearchInput(''); vm.setSearch(''); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"><X size={14} /></button>}
          </div>
          <button onClick={() => setMobileFilters(true)} aria-label="Open filters"
            className="lg:hidden relative flex items-center gap-2 px-4 py-2.5 glass border border-border rounded-xl text-sm text-text-muted hover:text-primary hover:border-primary transition-all font-exo">
            <SlidersHorizontal size={15} /> Filters
            {vm.activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[10px] font-bold font-orbitron rounded-full flex items-center justify-center">{vm.activeFilterCount}</span>}
          </button>
          <SortDropdown vm={vm} />
          <div className="flex glass border border-border rounded-xl overflow-hidden">
            {(['grid', 'list'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} aria-label={`${mode} view`}
                className={['px-3 py-2.5 transition-colors', viewMode === mode ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text'].join(' ')}>
                {mode === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence><ActiveFilterChips vm={vm} /></AnimatePresence>
        <div className="flex gap-8 items-start">
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-20">
            <div className="glass border border-border rounded-2xl p-5"><FilterSidebar vm={vm} /></div>
          </aside>
          <AnimatePresence>
            {mobileFilters && (
              <>
                <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileFilters(false)} />
                <motion.aside key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 z-50 w-72 glass border-l border-border p-6 overflow-y-auto lg:hidden">
                  <FilterSidebar vm={vm} onClose={() => setMobileFilters(false)} />
                </motion.aside>
              </>
            )}
          </AnimatePresence>
          <div className="flex-1 min-w-0">
            {vm.loading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`shimmer rounded-2xl ${viewMode === 'grid' ? 'h-72' : 'h-28'}`} />)}
              </div>
            ) : vm.products.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
                <Package size={52} className="opacity-20" />
                <p className="font-orbitron text-sm">No products found</p>
                <p className="text-xs font-exo">Try adjusting your search or filters</p>
                <button onClick={() => { vm.resetFilters(); setSearchInput(''); }} className="mt-2 px-5 py-2 glass border border-border rounded-xl text-sm text-primary font-exo hover:border-primary transition-all">Clear all filters</button>
              </motion.div>
            ) : (
              <motion.div layout className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
                <AnimatePresence mode="popLayout">
                  {vm.products.map(p => <ProductCard key={p.id} product={p} view={viewMode} />)}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
