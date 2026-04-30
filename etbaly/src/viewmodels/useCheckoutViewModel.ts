import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartViewModel } from './useCartViewModel';
import { cartService } from '../services/cartService';
import { userService } from '../services/userService';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import type { ApiOrder } from '../types/api';

export type CheckoutStep = 'shipping' | 'payment' | 'review' | 'success';
export type PaymentMethod = 'card' | 'cod';

export interface ShippingForm {
  fullName:   string;
  street:     string;
  city:       string;
  state?:     string;
  country:    string;
  postalCode: string;
}

export interface PaymentForm {
  cardNumber: string;
  expiry:     string;
  cvv:        string;
  method:     PaymentMethod;
}

export function useCheckoutViewModel() {
  const [step, setStep]         = useState<CheckoutStep>('shipping');
  const [shipping, setShipping] = useState<ShippingForm | null>(null);
  const [payment, setPayment]   = useState<PaymentForm | null>(null);
  const [order, setOrder]       = useState<ApiOrder | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const cart     = useCartViewModel();
  const { user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const subtotal     = cart.subtotal;
  const shippingCost = cart.shipping;
  const total        = cart.total;

  const submitShipping = (data: ShippingForm) => {
    setShipping(data);
    setStep('payment');
  };

  const submitPayment = (data: PaymentForm) => {
    setPayment(data);
    setStep('review');
  };

  const placeOrder = async () => {
    if (!shipping || !payment) return;
    setLoading(true);
    setError(null);

    try {
      const newAddress = {
        street:  shipping.street,
        city:    shipping.city,
        country: shipping.country,
        zip:     shipping.postalCode,
      };

      // Save address to profile if not already saved
      const existing = user?.savedAddresses?.find(
        a => a.street === newAddress.street && a.city === newAddress.city && a.zip === newAddress.zip
      );

      if (!existing?._id) {
        const currentAddresses = user?.savedAddresses ?? [];
        const updatedUser = await userService.updateMe({
          savedAddresses: [...currentAddresses, newAddress],
        });
        dispatch(setUser(updatedUser));
      }

      const paymentMethod = payment.method === 'cod' ? 'COD' : 'Card';
      const placedOrder = await cartService.checkout({
        shippingAddress: newAddress,
        paymentMethod,
      });

      setOrder(placedOrder);
      cart.clearCart();
      setStep('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message
        ?? (err as { message?: string })?.message
        ?? 'Failed to place order. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const backToHome = () => navigate('/');

  return {
    step,
    shipping,
    payment,
    orderId:      order?.orderNumber ?? null,
    order,
    loading,
    error,
    items:        cart.items,
    subtotal,
    shippingCost,
    total,
    submitShipping,
    submitPayment,
    placeOrder,
    backToHome,
    setStep,
  };
}
