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
  images?: string[];
  cancellationReason?: string | null;
  userInfo?: { id: number; name: string; avatar: string | null; phone?: string | null } | null;
  workerInfo?: { id: number; name: string; avatar: string | null; phone?: string | null } | null;
  serviceInfo?: { id: number; name: string; category: string } | null;
}

export interface ReservationStats {
  total: number;
  byStatus: Record<ReservationStatus, number>;
  /** Booked for today (not cancelled) */
  today: number;
  /** Scheduled from now on, pending or accepted */
  upcoming: number;
  emergencies: number;
  cities: string[];
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

export interface TrackingEntry {
  id: number;
  reservationId: number;
  status: string;
  note: string | null;
  location: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null;
  timestamp: string;
}

export interface TechnicianMission {
  id: number;
  date: string;
  time: string;
  duration: number;
  status: ReservationStatus;
  location: unknown;
  description: string;
  emergency: boolean;
  estimatedPrice: number | null;
  actualPrice: number | null;
  startTime: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: number; name: string; phone: string | null; avatar: string | null } | null;
  service: { id: number; name: string; category: string } | null;
  tracking: TrackingEntry[];
  notes: { id: number; author: number; content: string; internal: boolean; timestamp: string }[];
}

export interface TechnicianDetails {
  profile: Omit<User, 'worker'>;
  worker: Omit<WorkerProfile, 'services'> & {
    services: { id: number; name: string; category: string }[];
    latitude: number | null;
    longitude: number | null;
    availability: unknown;
    portfolio: unknown;
    certifications: unknown;
    businessInfo: unknown;
  };
  balance: { missions: number; feesGenerated: number; feeAdjustment: number; amountDue: number } | null;
  stats: { totalReservations: number; byStatus: Partial<Record<ReservationStatus, number>>; gpsPoints: number };
  reservations: TechnicianMission[];
  reservationsTruncated: boolean;
  reviews: (Review & { client: { id: number; name: string } | null })[];
  paymentLogs: PaymentLog[];
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
  duration?: number | null;
  requirements?: string[];
  isActive: boolean;
  isPopular: boolean;
  createdAt: string;
}

export type SubscriptionState = 'ACTIVE' | 'SOON' | 'EXPIRED' | 'NONE';
export type SubscriptionAction = 'EXTEND' | 'REDUCE' | 'SET_DATE' | 'SUSPEND' | 'REACTIVATE';

export interface TechnicianSubscription {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  accountStatus: AccountStatus;
  subscriptionEndsAt: string | null;
  state: SubscriptionState;
  daysLeft: number | null;
  lastChangeAt: string | null;
}

export interface SubscriptionStats {
  soonDays: number;
  total: number;
  active: number;
  soon: number;
  expired: number;
  none: number;
  suspended: number;
  collectedThisMonth: number;
  collectedTotal: number;
}

export interface SubscriptionLog {
  id: number;
  workerId: number;
  adminId: number;
  action: SubscriptionAction;
  months: number | null;
  amount: number | null;
  endsBefore: string | null;
  endsAfter: string | null;
  note: string | null;
  createdAt: string;
  workerInfo?: { id: number; name: string; avatar: string | null } | null;
  adminInfo?: { id: number; name: string; avatar: string | null } | null;
}

export interface Category {
  id: number;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  serviceCount: number;
  technicianCount: number;
}

export type CategoryInput = Partial<Pick<Category, 'name' | 'description' | 'icon' | 'color' | 'order' | 'isActive'>>;
export type ServiceInput = Partial<{
  name: string; description: string; category: string; basePrice: number | null; priceUnit: string;
  duration: number | null; requirements: string[]; isActive: boolean; isPopular: boolean;
}>;

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

// ─── Reports & analytics ────────────────────────────────────────────────────

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'month' | 'lastMonth' | '90d' | 'year' | 'custom';
export type ReportKind = 'summary' | 'interventions' | 'finance' | 'technicians' | 'reviews';

/** A value for the selected period, the previous period of the same length, and the % change (null when there is no base) */
export interface PeriodValue {
  value: number;
  prev: number;
  delta: number | null;
}

export interface Analytics {
  range: {
    period: AnalyticsPeriod;
    from: string;
    to: string;
    prevFrom: string;
    prevTo: string;
    granularity: 'day' | 'month';
    missionFee: number;
  };
  kpis: {
    requests: PeriodValue;
    completed: PeriodValue;
    revenue: PeriodValue & { fees: number; subscriptions: number; billableMissions: number };
    rating: { value: number | null; prev: number | null; delta: number | null; count: number };
  };
  timeline: { key: string; label: string; requests: number; completed: number }[];
  byStatus: Partial<Record<ReservationStatus, number>>;
  topServices: { key: string; name: string; icon: string | null; color: string | null; count: number; share: number }[];
  revenueByMonth: { key: string; label: string; fees: number; subscriptions: number; total: number }[];
  indicators: {
    activeTechnicians: number;
    newTechnicians: PeriodValue;
    clients: number;
    newClients: PeriodValue;
    completionRate: number | null;
    avgDurationMinutes: number | null;
  };
}
