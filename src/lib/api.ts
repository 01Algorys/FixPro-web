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

  createTechnician: (body: { name: string; email: string; password: string; phone?: string; services: number[] }) =>
    request<{ success: boolean; message: string; data: import('@/types').User }>(
      '/admin/technicians',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  getTechnicianDetails: (id: number) =>
    request<{ success: boolean; data: import('@/types').TechnicianDetails }>(`/admin/technicians/${id}`),

  deleteUser: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  updateWorkerServices: (id: number, services: number[]) =>
    request<{ success: boolean; data: { id: number; userId: number; services: number[] } }>(
      `/admin/users/${id}/services`,
      { method: 'PATCH', body: JSON.stringify({ services }) }
    ),

  // Technician subscriptions (managed by hand)
  getSubscriptionStats: () =>
    request<{ success: boolean; data: import('@/types').SubscriptionStats }>('/admin/subscriptions/stats'),

  getSubscriptions: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { technicians: import('@/types').TechnicianSubscription[]; pagination: import('@/types').Pagination } }>(
      `/admin/subscriptions?${qs}`
    );
  },

  updateSubscription: (userId: number, body: { action: import('@/types').SubscriptionAction; months?: number; amount?: number; date?: string; note?: string }) =>
    request<{ success: boolean; message: string }>(
      `/admin/subscriptions/${userId}`, { method: 'PATCH', body: JSON.stringify(body) }
    ),

  getSubscriptionLogs: (params: Record<string, string | number> = {}, userId?: number) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { logs: import('@/types').SubscriptionLog[]; pagination: import('@/types').Pagination } }>(
      `/admin/subscriptions${userId ? `/${userId}` : ''}/logs?${qs}`
    );
  },

  // Technician mission-fee payments
  getPaymentStats: () =>
    request<{ success: boolean; data: import('@/types').PaymentStats }>('/admin/payments/stats'),

  getTechnicianPayments: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { technicians: import('@/types').TechnicianPayment[]; pagination: import('@/types').Pagination } }>(
      `/admin/payments?${qs}`
    );
  },

  updateTechnicianBalance: (userId: number, body: { action: import('@/types').PaymentAction; amount?: number; note?: string }) =>
    request<{ success: boolean; message: string; data: { log: import('@/types').PaymentLog } }>(
      `/admin/payments/${userId}`,
      { method: 'PATCH', body: JSON.stringify(body) }
    ),

  getPaymentLogs: (params: Record<string, string | number> = {}, userId?: number) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<{ success: boolean; data: { logs: import('@/types').PaymentLog[]; pagination: import('@/types').Pagination } }>(
      `/admin/payments${userId ? `/${userId}` : ''}/logs?${qs}`
    );
  },

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
    return request<{ success: boolean; data: { reviews: import('@/types').Review[]; counts: import('@/types').ReviewCounts; pagination: import('@/types').Pagination } }>(
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

  getUnreadAlertCount: () =>
    request<{ success: boolean; data: { count: number; latest: import('@/types').Notification | null } }>(
      '/admin/notifications/unread-count'
    ),

  markAlertsRead: (ids?: number[]) =>
    request<{ success: boolean; data: { updated: number } }>(
      '/admin/notifications/read',
      { method: 'PATCH', body: JSON.stringify(ids ? { ids } : {}) }
    ),

  getZones: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ success: boolean; data: { reservations: import('@/types').ZoneReservation[]; technicians: import('@/types').ZoneTechnician[] } }>(
      `/admin/zones?${qs}`
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
