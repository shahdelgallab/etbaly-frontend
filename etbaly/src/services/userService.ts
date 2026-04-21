import api from './api';
import type { ApiSuccess, ApiUser, UpdateMePayload, PaginatedData } from '../types/api';

interface UserData   { user: ApiUser }
interface AvatarData { avatarUrl: string }
interface UsersData  { results: number; users: ApiUser[] }

export const userService = {
  // GET /api/v1/users/me
  getMe: () =>
    api.get<ApiSuccess<UserData>>('/users/me').then(r => r.data.data.user),

  // PATCH /api/v1/users/me  — flat fields + optional savedAddresses
  updateMe: (data: UpdateMePayload) =>
    api.patch<ApiSuccess<UserData>>('/users/me', data).then(r => r.data.data.user),

  // PATCH /api/v1/users/me/password
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<ApiSuccess<null>>('/users/me/password', { currentPassword, newPassword })
      .then(r => r.data),

  // PATCH /api/v1/users/me/avatar  (multipart/form-data)
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.patch<ApiSuccess<AvatarData>>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data.avatarUrl);
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  // GET /api/v1/admin/users
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiSuccess<UsersData>>('/admin/users', { params }).then(r => ({
      results: r.data.data.users,
      total:   r.data.data.results,
      page:    1,
      limit:   50,
    } as PaginatedData<ApiUser>)),

  // PATCH /api/v1/admin/users/:id/role
  updateRole: (id: string, role: 'client' | 'admin' | 'operator') =>
    api.patch<ApiSuccess<UserData>>(`/admin/users/${id}/role`, { role })
      .then(r => r.data.data.user),

  // DELETE /api/v1/admin/users/:id
  deleteById: (id: string) =>
    api.delete<ApiSuccess<null>>(`/admin/users/${id}`).then(r => r.data),
};
