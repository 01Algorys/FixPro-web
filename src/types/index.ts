export type Role = 'USER' | 'WORKER' | 'ADMIN';
export type AccountStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'BANNED';
export type ReservationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

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
  startTime?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
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
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface ReviewCounts {
  low: number;
  reported: number;
  lowThreshold: number;
}

export interface ZoneReservation {
  id: number;
  date: string;
  status: ReservationStatus;
  location: unknown;
  serviceId: number;
  category: string | null;
  emergency: boolean;
}

export interface ZoneTechnician {
  id: number;
  name: string;
  accountStatus: AccountStatus;
  lat: number;
  lng: number;
  serviceArea: unknown;
  averageRating: number;
  jobsCompleted: number;
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

export type PaymentAction = 'ADD' | 'REDUCE' | 'RESET';

export interface TechnicianPayment {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  accountStatus: AccountStatus;
  missions: number;
  feesGenerated: number;
  feeAdjustment: number;
  amountDue: number;
  lastPaymentAt: string | null;
}

export interface PaymentStats {
  feePerMission: number;
  totalTechnicians: number;
  techniciansWithDue: number;
  totalDue: number;
  totalMissions: number;
  totalFeesGenerated: number;
  collectedTotal: number;
  collectedThisMonth: number;
}

export interface PaymentLog {
  id: number;
  workerId: number;
  adminId: number;
  action: PaymentAction;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  workerInfo?: { id: number; name: string; avatar: string | null } | null;
  adminInfo?: { id: number; name: string; avatar: string | null } | null;
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
