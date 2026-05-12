import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutThunk, patchUser, setUser } from '../store/slices/authSlice';
import { fetchMyOrdersThunk } from '../store/slices/ordersSlice';
import { userService } from '../services/userService';
import type { ApiOrder } from '../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileTab = 'profile' | 'orders' | 'security';

export interface ProfileFormValues {
  firstName: string;
  lastName:  string;
  phone:     string;
  bio:       string;
}

export interface PasswordFormValues {
  current: string;
  next:    string;
  confirm: string;
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useProfileViewModel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { items: orders, loading: ordersLoading } = useAppSelector(s => s.orders);

  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarPreview, setAvatarPreview]     = useState<string | null>(
    user?.profile?.avatarUrl ?? null
  );
  const [selectedOrder, setSelectedOrder]     = useState<ApiOrder | null>(null);
  const avatarObjectUrl                       = useRef<string | null>(null);

  // Auto-clear feedback after 4 s
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(null); setError(null); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // Load orders on mount
  useEffect(() => {
    if (user) dispatch(fetchMyOrdersThunk());
  }, [dispatch, user]);

  // ── Avatar upload — uses multipart endpoint ──
  const onAvatarInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('Avatar must be under 5 MB.'); return; }

    // Optimistic local preview
    if (avatarObjectUrl.current) URL.revokeObjectURL(avatarObjectUrl.current);
    const localUrl = URL.createObjectURL(file);
    avatarObjectUrl.current = localUrl;
    setAvatarPreview(localUrl);

    setLoading(true);
    try {
      const remoteUrl = await userService.uploadAvatar(file);
      // Only patch the avatarUrl field — don't spread the whole profile
      dispatch(patchUser({ profile: { ...user!.profile, avatarUrl: remoteUrl } }));
      setAvatarPreview(remoteUrl);
      setSuccess('Avatar updated.');
    } catch {
      setError('Failed to upload avatar.');
      setAvatarPreview(user?.profile?.avatarUrl ?? null);
    } finally {
      setLoading(false);
    }
  }, [dispatch, user]);

  // ── Save profile fields ──
  const saveProfile = useCallback(async (data: ProfileFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await userService.updateMe({
        firstName:   data.firstName,
        lastName:    data.lastName,
        phoneNumber: data.phone || undefined,
        bio:         data.bio   || undefined,
      });
      // Use setUser (runs sanitizeUser) so profile is always a valid object
      dispatch(setUser(updated));
      setSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to update profile.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  // ── Change password ──
  const changePassword = useCallback(async (values: PasswordFormValues): Promise<boolean> => {
    if (values.next !== values.confirm) { setError('New passwords do not match.'); return false; }
    if (values.next.length < 6)         { setError('New password must be at least 6 characters.'); return false; }
    setLoading(true);
    setError(null);
    try {
      await userService.changePassword(values.current, values.next);
      setSuccess('Password changed. Please log in again on other devices.');
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to change password.';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Delete / logout ──
  const deleteAccount = useCallback(async () => {
    await dispatch(logoutThunk());
    navigate('/');
  }, [dispatch, navigate]);

  // ── Derived stats from ApiOrder ──
  const orderStats = {
    total:     orders.length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    active:    orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length,
    spent:     orders.reduce((s, o) => s + o.pricingSummary.total, 0),
  };

  // ── Convenience getters from ApiUser.profile ──
  const fullName = user ? `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim() : '';
  const initials = user
    ? `${user.profile?.firstName?.[0] ?? ''}${user.profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  return {
    user,
    fullName,
    initials,
    orders,
    ordersLoading,
    loading,
    error,
    success,
    showDeleteModal,
    avatarPreview,
    selectedOrder,
    orderStats,
    setShowDeleteModal,
    setSelectedOrder,
    onAvatarInput,
    saveProfile,
    changePassword,
    deleteAccount,
  };
}
