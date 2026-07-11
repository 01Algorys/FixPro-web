const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fixpro_admin_token');
}

export function setToken(token: string) {
  localStorage.setItem('fixpro_admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('fixpro_admin_token');
  localStorage.removeItem('fixpro_admin_user');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expirée');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: { id: number; name: string; email: string; role: string; avatar: string | null } } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
};

// Admin — Users
export const adminApi = {
  getUserStats: () =>
    request<{ success: boolean; data: import('@/types').UserStats }>('/admin/users/stats'),

  getUsers: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { users: import('@/types').User[]; pagination: import('@/types').Pagination } }>(
      `/admin/users?${qs}`
    );
  },

  getUserById: (id: number) =>
    request<{ success: boolean; data: import('@/types').User }>(`/admin/users/${id}`),

  approveUser: (id: number) =>
    request<{ success: boolean; message: string; data: import('@/types').User }>(
      `/admin/users/${id}/approve`,
      { method: 'PATCH' }
    ),

  rejectUser: (id: number, reason?: string) =>
    request<{ success: boolean; message: string; data: import('@/types').User }>(
      `/admin/users/${id}/reject`,
      { method: 'PATCH', body: JSON.stringify({ reason }) }
    ),

  updateUserStatus: (id: number, accountStatus: string) =>
    request<{ success: boolean; data: import('@/types').User }>(
      `/admin/users/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ accountStatus }) }
    ),

  updateWorkerServices: (id: number, services: number[]) =>
    request<{ success: boolean; data: { id: number; userId: number; services: number[] } }>(
      `/admin/users/${id}/services`,
      { method: 'PATCH', body: JSON.stringify({ services }) }
    ),

  getDashboardStats: () =>
    request<{ success: boolean; data: import('@/types').DashboardStats }>('/admin/stats'),

  getReservations: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { reservations: import('@/types').Reservation[]; pagination: import('@/types').Pagination } }>(
      `/admin/reservations?${qs}`
    );
  },

  getReviews: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { reviews: import('@/types').Review[]; pagination: import('@/types').Pagination } }>(
      `/admin/reviews?${qs}`
    );
  },

  getNotifications: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { notifications: import('@/types').Notification[]; pagination: import('@/types').Pagination } }>(
      `/admin/notifications?${qs}`
    );
  },

  getServices: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { services: import('@/types').Service[]; pagination: import('@/types').Pagination } }>(
      `/admin/services?${qs}`
    );
  },
};
