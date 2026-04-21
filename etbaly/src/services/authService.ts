import api from './api';
import type { ApiSuccess, AuthData, RegisterData } from '../types/api';

export interface RegisterPayload {
  firstName:    string;
  lastName:     string;
  email:        string;
  password:     string;
  phoneNumber?: string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp:   string;
}

export interface ResetPasswordPayload {
  email:       string;
  otp:         string;
  newPassword: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<ApiSuccess<RegisterData>>('/auth/register', payload).then(r => r.data),

  verifyOtp: (payload: VerifyOtpPayload) =>
    api.post<ApiSuccess<AuthData>>('/auth/verify-otp', payload).then(r => r.data),

  resendOtp: (email: string) =>
    api.post<ApiSuccess<null>>('/auth/resend-otp', { email }).then(r => r.data),

  login: (payload: LoginPayload) =>
    api.post<ApiSuccess<AuthData>>('/auth/login', payload).then(r => r.data),

  googleAuth: (idToken: string) =>
    api.post<ApiSuccess<AuthData>>('/auth/google', { idToken }).then(r => r.data),

  forgotPassword: (email: string) =>
    api.post<ApiSuccess<null>>('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<ApiSuccess<null>>('/auth/reset-password', payload).then(r => r.data),

  refreshToken: (refreshToken: string) =>
    api.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh-token', { refreshToken }
    ).then(r => r.data),

  logout: (refreshToken?: string) =>
    api.post<ApiSuccess<null>>('/auth/logout', { refreshToken }).then(r => r.data),
};
