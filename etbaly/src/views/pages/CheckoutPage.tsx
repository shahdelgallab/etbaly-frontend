import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2, ArrowRight, ArrowLeft, Home,
  CreditCard, Truck, ClipboardList, MapPin,
  User, Lock, Package, ShoppingBag,
  Check, AlertCircle, Banknote, Shield, Printer,
} from 'lucide-react';
import { useCheckoutViewModel } from '../../viewmodels/useCheckoutViewModel';
import PageWrapper from '../components/PageWrapper';
import type { ShippingForm, PaymentForm } from '../../viewmodels/useCheckoutViewModel';

// ─── Zod schema (shipping only) ──────────────────────────────────────────────

const shippingSchema = z.object({
  fullName:   z.string().min(2,  'Full name is required'),
  street:     z.string().min(5,  'Street address is required'),
  city:       z.string().min(2,  'City is required'),
  state:      z.string().optional(),
  country:    z.string().min(2,  'Country is required'),
  postalCode: z.string().min(3,  'Postal code is required'),
});
// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = [
  'w-full px-4 py-2.5 glass border border-border rounded-xl',
  'text-sm text-text placeholder:text-text-muted font-exo',
  'focus:outline-none focus:border-primary focus:shadow-glow-sm transition-all',
].join(' ');

const labelCls = 'block text-xs font-medium text-text-muted font-exo mb-1.5';

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-400 font-exo flex items-center gap-1">
      <AlertCircle size={11} /> {msg}
    </p>
  );
}

// ─── Step progress bar ────────────────────────────────────────────────────────

const STEPS = [
  { key: 'shipping', label: 'Shipping', icon: <Truck size={14} />        },
  { key: 'payment',  label: 'Payment',  icon: <CreditCard size={14} />   },
  { key: 'review',   label: 'Review',   icon: <ClipboardList size={14} /> },
] as const;

function StepBar({ current }: { current: string }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center justify-center mb-10" role="list" aria-label="Checkout steps">
      {STEPS.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex items-center" role="listitem">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={active ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  done   ? 'bg-green-500/20 border border-green-500/50 text-green-400'  : '',
                  active ? 'bg-primary text-white shadow-glow'                           : '',
                  !done && !active ? 'glass border border-border text-text-muted'        : '',
                ].join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check size={16} /> : s.icon}
              </motion.div>
              <span className={[
                'text-xs font-exo hidden sm:block transition-colors',
                active ? 'text-primary font-medium' : done ? 'text-green-400' : 'text-text-muted',
              ].join(' ')}>
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="w-16 md:w-24 mx-2 mb-5">
                <div className="h-px bg-border relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: i < idx ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order summary sidebar ────────────────────────────────────────────────────

type VM = ReturnType<typeof useCheckoutViewModel>;

function OrderSummary({ vm }: { vm: VM }) {
  return (
    <div className="glass border border-border rounded-2xl p-5 space-y-4 sticky top-24">
      <h3 className="font-orbitron text-sm font-semibold text-text flex items-center gap-2">
        <ShoppingBag size={15} className="text-primary" /> Order Summary
      </h3>

      {/* Items */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {vm.items.map(item => (
          <div key={item.id} className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg bg-surface border border-border overflow-hidden flex-shrink-0">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/30 font-orbitron text-xs">3D</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text font-exo truncate">{item.product.name}</p>
              <p className="text-[11px] text-text-muted font-exo">{item.product.material} · qty {item.quantity}</p>
            </div>
            <span className="text-xs font-semibold text-primary font-orbitron shrink-0">
              ${(item.product.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-2 text-sm font-exo">
        <div className="flex justify-between text-text-muted">
          <span>Subtotal</span><span>${vm.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Shipping</span>
          <span>{vm.shippingCost === 0
            ? <span className="text-green-400 font-medium">Free</span>
            : `$${vm.shippingCost.toFixed(2)}`}
          </span>
        </div>
        {vm.shippingCost > 0 && (
          <p className="text-[11px] text-text-muted/70">Free shipping on orders over $100</p>
        )}
        <div className="flex justify-between font-semibold text-text pt-2 border-t border-border">
          <span>Total</span>
          <span className="text-primary font-orbitron">${vm.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex items-center gap-2 pt-1">
        <Shield size={12} className="text-green-400 shrink-0" />
        <span className="text-[11px] text-text-muted font-exo">Secure 256-bit SSL checkout</span>
      </div>
    </div>
  );
}

// ─── Step 1: Shipping ─────────────────────────────────────────────────────────

function ShippingStep({ onSubmit }: { onSubmit: (d: ShippingForm) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
    mode: 'onTouched',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={16} className="text-primary" />
        <h2 className="font-orbitron text-base font-semibold text-text">Shipping Address</h2>
      </div>

      {/* Full name */}
      <div>
        <label className={labelCls}>Full Name</label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input {...register('fullName')} placeholder="Jane Doe" autoComplete="name" className={`${inputCls} pl-9`} />
        </div>
        <FieldError msg={errors.fullName?.message} />
      </div>

      {/* Street */}
      <div>
        <label className={labelCls}>Street Address</label>
        <input {...register('street')} placeholder="123 Nile Street, Apt 4B" autoComplete="street-address" className={inputCls} />
        <FieldError msg={errors.street?.message} />
      </div>

      {/* City + Postal */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>City</label>
          <input {...register('city')} placeholder="Cairo" autoComplete="address-level2" className={inputCls} />
          <FieldError msg={errors.city?.message} />
        </div>
        <div>
          <label className={labelCls}>Postal Code</label>
          <input {...register('postalCode')} placeholder="11511" autoComplete="postal-code" className={inputCls} />
          <FieldError msg={errors.postalCode?.message} />
        </div>
      </div>

      {/* State (optional) + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>State / Province <span className="opacity-50">(optional)</span></label>
          <input {...register('state')} placeholder="Giza" autoComplete="address-level1" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Country</label>
          <input {...register('country')} placeholder="Egypt" autoComplete="country-name" className={inputCls} />
          <FieldError msg={errors.country?.message} />
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all mt-2"
      >
        Continue to Payment <ArrowRight size={16} />
      </motion.button>
    </form>
  );
}

// ─── Step 2: Payment ──────────────────────────────────────────────────────────

function PaymentStep({ onSubmit, onBack }: { onSubmit: (d: PaymentForm) => void; onBack: () => void }) {
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm<PaymentForm>({
    defaultValues: { method: 'card' },
  });
  const method = watch('method');

  const handleValidSubmit = (data: PaymentForm) => {
    if (data.method === 'card') {
      const digits = (data.cardNumber ?? '').replace(/\s/g, '');
      if (digits.length < 16) { setError('cardNumber', { message: 'Enter a valid 16-digit card number' }); return; }
      if (!/^\d{2}\/\d{2}$/.test(data.expiry ?? '')) { setError('expiry', { message: 'Use MM/YY format' }); return; }
      if ((data.cvv ?? '').length < 3) { setError('cvv', { message: 'CVV must be 3–4 digits' }); return; }
    }
    onSubmit(data);
  };

  // Format card number with spaces
  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  return (
    <form onSubmit={handleSubmit(handleValidSubmit)} noValidate className="space-y-5">
      <div className="flex items-center gap-2 mb-5">
        <CreditCard size={16} className="text-primary" />
        <h2 className="font-orbitron text-base font-semibold text-text">Payment Method</h2>
      </div>

      {/* Method toggle */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { value: 'card', label: 'Credit Card',      icon: <CreditCard size={16} /> },
          { value: 'cod',  label: 'Cash on Delivery',  icon: <Banknote size={16} />   },
        ] as const).map(opt => (
          <label
            key={opt.value}
            className={[
              'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-all font-exo text-sm',
              method === opt.value
                ? 'border-primary bg-primary/10 text-primary shadow-glow-sm'
                : 'border-border glass text-text-muted hover:border-primary/50 hover:text-text',
            ].join(' ')}
          >
            <input type="radio" value={opt.value} {...register('method')} className="sr-only" />
            {opt.icon} {opt.label}
          </label>
        ))}
      </div>

      {/* Card fields */}
      <AnimatePresence initial={false}>
        {method === 'card' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden space-y-4"
          >
            {/* Card number */}
            <div>
              <label className={labelCls}>Card Number</label>
              <div className="relative">
                <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register('cardNumber')}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  autoComplete="cc-number"
                  inputMode="numeric"
                  onChange={e => {
                    e.target.value = formatCard(e.target.value);
                    register('cardNumber').onChange(e);
                  }}
                  className={`${inputCls} pl-9 font-mono tracking-wider`}
                />
              </div>
              <FieldError msg={errors.cardNumber?.message} />
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Expiry Date</label>
                <input
                  {...register('expiry')}
                  placeholder="MM/YY"
                  maxLength={5}
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  className={`${inputCls} font-mono`}
                />
                <FieldError msg={errors.expiry?.message} />
              </div>
              <div>
                <label className={labelCls}>CVV</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    {...register('cvv')}
                    placeholder="•••"
                    maxLength={4}
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    type="password"
                    className={`${inputCls} pl-9 font-mono`}
                  />
                </div>
                <FieldError msg={errors.cvv?.message} />
              </div>
            </div>

            {/* Card security note */}
            <p className="text-[11px] text-text-muted font-exo flex items-center gap-1.5">
              <Shield size={11} className="text-green-400" />
              Your card details are encrypted and never stored.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COD note */}
      <AnimatePresence initial={false}>
        {method === 'cod' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4 glass border border-border rounded-xl">
              <Banknote size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text font-exo">Pay when your order arrives</p>
                <p className="text-xs text-text-muted font-exo mt-0.5">
                  Have the exact amount ready. Our delivery partner will collect payment at your door.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 glass border border-border text-text-muted font-orbitron text-sm rounded-xl flex items-center justify-center gap-2 hover:text-primary hover:border-primary transition-all"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all"
        >
          Review Order <ArrowRight size={16} />
        </motion.button>
      </div>
    </form>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function ReviewStep({ vm, onBack }: { vm: VM; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList size={16} className="text-primary" />
        <h2 className="font-orbitron text-base font-semibold text-text">Review Your Order</h2>
      </div>

      {/* Shipping summary */}
      {vm.shipping && (
        <div className="glass border border-border rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-orbitron text-text-muted tracking-wider">SHIPPING TO</p>
            <button
              onClick={onBack}
              className="text-xs text-primary hover:underline font-exo"
            >
              Edit
            </button>
          </div>
          <p className="text-sm font-medium text-text font-exo">{vm.shipping.fullName}</p>
          <p className="text-xs text-text-muted font-exo">
            {vm.shipping.street}, {vm.shipping.city}
            {vm.shipping.state ? `, ${vm.shipping.state}` : ''} {vm.shipping.postalCode}
          </p>
          <p className="text-xs text-text-muted font-exo">{vm.shipping.country}</p>
        </div>
      )}

      {/* Payment summary */}
      {vm.payment && (
        <div className="glass border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-orbitron text-text-muted tracking-wider">PAYMENT</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-exo text-text">
            {vm.payment.method === 'card' ? (
              <>
                <CreditCard size={14} className="text-primary" />
                Card ending ···· {vm.payment.cardNumber?.replace(/\s/g, '').slice(-4) ?? '????'}
              </>
            ) : (
              <>
                <Banknote size={14} className="text-primary" />
                Cash on Delivery
              </>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        <p className="text-xs font-orbitron text-text-muted tracking-wider">ITEMS ({vm.items.length})</p>
        {vm.items.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            <div className="w-10 h-10 rounded-lg bg-surface border border-border overflow-hidden flex-shrink-0">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/30 font-orbitron text-[10px]">3D</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text font-exo truncate">{item.product.name}</p>
              <p className="text-xs text-text-muted font-exo">{item.product.material} · qty {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold text-primary font-orbitron">
              ${(item.product.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="glass border border-border rounded-xl p-4 space-y-2 text-sm font-exo">
        <div className="flex justify-between text-text-muted">
          <span>Subtotal</span><span>${vm.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Shipping</span>
          <span>{vm.shippingCost === 0
            ? <span className="text-green-400 font-medium">Free</span>
            : `$${vm.shippingCost.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-text pt-2 border-t border-border font-orbitron">
          <span>Total</span>
          <span className="text-primary">${vm.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {vm.error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-exo"
          >
            <AlertCircle size={15} /> {vm.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 glass border border-border text-text-muted font-orbitron text-sm rounded-xl flex items-center justify-center gap-2 hover:text-primary hover:border-primary transition-all"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={vm.placeOrder}
          disabled={vm.loading}
          className="flex-1 py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {vm.loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Place Order <Package size={16} /></>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ vm }: { vm: VM }) {
  return (
    <PageWrapper className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-center glass border border-border rounded-3xl p-12 max-w-md w-full"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={44} className="text-green-400" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="font-orbitron text-2xl font-bold text-text mb-2">Order Placed!</h2>
          <p className="text-text-muted font-exo text-sm mb-4">
            Your order has been confirmed and is being processed.
          </p>

          {/* Order ID */}
          <div className="inline-flex items-center gap-2 px-4 py-2 glass border border-primary/30 rounded-xl mb-6">
            <Printer size={14} className="text-primary" />
            <span className="font-orbitron text-primary text-sm font-bold">{vm.orderId}</span>
          </div>

          {/* What's next */}
          <div className="text-left space-y-2 mb-8 p-4 glass border border-border rounded-xl">
            <p className="text-xs font-orbitron text-text-muted tracking-wider mb-3">WHAT HAPPENS NEXT</p>
            {[
              { icon: <Check size={12} />, text: 'Order confirmation email sent'    },
              { icon: <Printer size={12} />, text: 'Your model enters the print queue' },
              { icon: <Truck size={12} />,   text: 'Shipped within 3–5 business days' },
            ].map(step => (
              <div key={step.text} className="flex items-center gap-2.5 text-xs text-text-muted font-exo">
                <span className="text-green-400 shrink-0">{step.icon}</span>
                {step.text}
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={vm.backToHome}
            className="flex items-center gap-2 mx-auto px-8 py-3 bg-primary text-white font-orbitron text-sm font-semibold rounded-xl hover:shadow-glow transition-all"
          >
            <Home size={16} /> Back to Home
          </motion.button>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const vm = useCheckoutViewModel();

  if (vm.step === 'success') return <SuccessScreen vm={vm} />;

  // Redirect to payment step if back is pressed from review
  const handleReviewBack = () => vm.setStep('payment' as Parameters<typeof vm.setStep>[0]);
  const handlePaymentBack = () => vm.setStep('shipping' as Parameters<typeof vm.setStep>[0]);

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-xs font-orbitron text-primary tracking-widest">SECURE CHECKOUT</span>
          <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-text mt-1">Complete Your Order</h1>
        </div>

        {/* Step bar */}
        <StepBar current={vm.step} />

        {/* Empty cart guard */}
        {vm.items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted"
          >
            <ShoppingBag size={52} className="opacity-20" />
            <p className="font-orbitron text-sm">Your cart is empty</p>
            <a href="/products" className="text-primary hover:underline text-sm font-exo">Browse collections</a>
          </motion.div>
        )}

        {vm.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Main form — takes 2 cols */}
            <div className="lg:col-span-2">
              <div className="glass border border-border rounded-2xl p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {vm.step === 'shipping' && (
                    <motion.div
                      key="shipping"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ShippingStep onSubmit={vm.submitShipping} />
                    </motion.div>
                  )}

                  {vm.step === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <PaymentStep onSubmit={vm.submitPayment} onBack={handlePaymentBack} />
                    </motion.div>
                  )}

                  {vm.step === 'review' && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ReviewStep vm={vm} onBack={handleReviewBack} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Order summary sidebar — 1 col */}
            <div className="lg:col-span-1">
              <OrderSummary vm={vm} />
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
