export type Role = 'USER' | 'WORKER' | 'ADMIN';
export type AccountStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type ReservationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkerProfile {
  id: number;
  isActive: boolean;
  isVerified: boolean;
  jobsCompleted: number;
  averageRating: number;
  totalReviews: number;
  hourlyRate: number | null;
  totalEarnings?: number;
  bio?: string;
  skills?: string[];
  services?: number[];
  experience?: number;
  serviceArea?: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  accountStatus: AccountStatus;
  isVerified: boolean;
  location: { address?: string; city?: string; state?: string; zipCode?: string } | null;
  createdAt: string;
  updatedAt?: string;
  worker?: WorkerProfile | null;
}

export interface Reservation {
  id: number;
  userId: number;
  workerId: number;
  serviceId: number;
  date: string;
  time: string;
  duration: number;
  status: ReservationStatus;
  location: unknown;
  description: string;
  emergency: boolean;
  estimatedPrice: number | null;
  actualPrice: number | null;
  createdAt: string;
  userInfo?: { id: number; name: string; avatar: string | null } | null;
  workerInfo?: { id: number; name: string; avatar: string | null } | null;
}

export interface Review {
  id: number;
  userId: number;
  workerId: number;
  reservationId: number;
  rating: number;
  comment: string | null;
  wouldHireAgain: boolean;
  isVerified: boolean;
  reported: boolean;
  helpful: number;
  createdAt: string;
  userInfo?: { id: number; name: string; avatar: string | null } | null;
  workerInfo?: { id: number; name: string; avatar: string | null } | null;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  basePrice: number | null;
  priceUnit: string;
  isActive: boolean;
  isPopular: boolean;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  total:        { count: number; delta: number };
  particuliers: { count: number; delta: number };
  techniciens:  { count: number; delta: number };
  newThisMonth: { count: number; delta: number };
  actifs:       { count: number; delta: number };
}

export interface DashboardStats {
  totalUsers: number;
  totalWorkers: number;
  pendingApprovals: number;
  totalReservations: number;
  completedReservations: number;
  newUsersThisMonth: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: number;
  name: string;
  role: Role;
  email: string;
  avatar: string | null;
}
