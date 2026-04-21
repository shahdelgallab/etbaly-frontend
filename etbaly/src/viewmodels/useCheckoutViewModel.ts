import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
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

  const { items, clearCart } = useCartStore();
  const { user }             = useAppSelector(s => s.auth);
  const dispatch             = useAppDispatch();
  const navigate             = useNavigate();

  const subtotal     = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shippingCost = subtotal > 100 ? 0 : 9.99;
  const total        = subtotal + shippingCost;

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
      // Step 1: save the shipping address to the user's profile to get its _id
      const newAddress = {
        street:  shipping.street,
        city:    shipping.city,
        country: shipping.country,
        zip:     shipping.postalCode,
      };

      // Check if this address is already saved (match by street+city+zip)
      const existing = user?.savedAddresses?.find(
        a => a.street === newAddress.street && a.city === newAddress.city && a.zip === newAddress.zip
      );

      let addressId: string;

      if (existing?._id) {
        addressId = existing._id;
      } else {
        const currentAddresses = user?.savedAddresses ?? [];
        const updatedUser = await userService.updateMe({
          savedAddresses: [...currentAddresses, newAddress],
        });
        dispatch(setUser(updatedUser));
        const saved = updatedUser.savedAddresses?.slice(-1)[0];
        if (!saved?._id) throw new Error('Address was not saved with an ID.');
        addressId = saved._id;
      }

      // Step 2: checkout with the address ID
      const paymentMethod = payment.method === 'cod' ? 'COD' : 'Card';
      const placedOrder = await cartService.checkout({ shippingAddressId: addressId, paymentMethod });

      setOrder(placedOrder);
      clearCart();
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
    // expose both for backward compat — orderId used in success screen
    orderId: order?.orderNumber ?? null,
    order,
    loading,
    error,
    items,
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
