// ─── Address ────────────────────────────────────────────────────────────────

export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

// ─── User Roles ──────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  address?: Address;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ─── Auth Payloads ───────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
