import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginThunk, registerThunk, verifyOtpThunk,
  logoutThunk, forgotPasswordThunk, resetPasswordThunk,
  googleLoginThunk,
  clearError, setUser,
} from '../store/slices/authSlice';
import { userService } from '../services/userService';
import { signInWithGoogle } from '../services/firebaseService';
import type { LoginPayload, RegisterPayload, VerifyOtpPayload, ResetPasswordPayload } from '../services/authService';
import type { UpdateMePayload } from '../types/api';

export function useAuthViewModel() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const { user, accessToken, loading, error, pendingEmail } =
    useAppSelector(s => s.auth);

  const login = async (payload: LoginPayload, redirectTo = '/') => {
    const result = await dispatch(loginThunk(payload));
    if (loginThunk.fulfilled.match(result)) navigate(redirectTo);
  };

  const register = async (payload: RegisterPayload, redirectTo = '/verify-otp') => {
    const result = await dispatch(registerThunk(payload));
    if (registerThunk.fulfilled.match(result)) {
      // Registration succeeded — navigate to OTP verification
      navigate(redirectTo, { state: { email: payload.email } });
    }
  };

  const verifyOtp = async (payload: VerifyOtpPayload, redirectTo = '/') => {
    const result = await dispatch(verifyOtpThunk(payload));
    if (verifyOtpThunk.fulfilled.match(result)) navigate(redirectTo);
  };

  const logout = async () => {
    await dispatch(logoutThunk());
    navigate('/signin');
  };

  const forgotPassword = async (email: string) => {
    await dispatch(forgotPasswordThunk(email));
  };

  const resetPassword = async (payload: ResetPasswordPayload, redirectTo = '/signin') => {
    const result = await dispatch(resetPasswordThunk(payload));
    if (resetPasswordThunk.fulfilled.match(result)) navigate(redirectTo);
  };

  const updateProfile = async (data: UpdateMePayload) => {
    try {
      const updated = await userService.updateMe(data);
      dispatch(setUser(updated));
    } catch {
      // error handled by caller
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await userService.changePassword(currentPassword, newPassword);
  };

  const googleLogin = async (redirectTo = '/') => {
    try {
      const idToken = await signInWithGoogle();
      const result = await dispatch(googleLoginThunk(idToken));
      if (googleLoginThunk.fulfilled.match(result)) navigate(redirectTo);
    } catch (err: unknown) {
      // User closed the popup — silently ignore
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;

      // Any other Firebase error (unauthorized domain, provider disabled, etc.) — surface it
      const message = (err as { message?: string })?.message ?? 'Google sign-in failed.';
      dispatch({ type: googleLoginThunk.rejected.type, payload: message });
    }
  };

  return {
    user,
    accessToken,
    loading,
    error,
    pendingEmail,
    login,
    register,
    verifyOtp,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    googleLogin,
    clearError: () => dispatch(clearError()),
  };
}
