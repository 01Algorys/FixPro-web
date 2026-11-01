import {
  DropIcon, BoltIcon, SnowIcon, LockIcon, RollerIcon, WasherIcon, BroomIcon, LeafIcon, type Icon,
} from '@/components/home/icons';
import type { AccountStatus, ReservationStatus } from '@/types';

// ─── Service categories ─────────────────────────────────────────────────────
// The backend enum only has PLUMBING / ELECTRICAL / HVAC / LOCKSMITH today; the other four
// match the categories advertised on the landing page and light up once the enum grows.
// Colours are a validated categorical palette, in fixed order.
export const CATEGORIES: { key: string; label: string; icon: Icon; color: string }[] = [
  { key: 'PLUMBING',   label: 'Plomberie',      icon: DropIcon,   color: '#1d6ff2' },
  { key: 'ELECTRICAL', label: 'Électricité',    icon: BoltIcon,   color: '#d18f00' },
  { key: 'HVAC',       label: 'Climatisation',  icon: SnowIcon,   color: '#0891b2' },
  { key: 'LOCKSMITH',  label: 'Serrurerie',     icon: LockIcon,   color: '#a855f7' },
  { key: 'PAINTING',   label: 'Peinture',       icon: RollerIcon, color: '#e11d48' },
  { key: 'APPLIANCES', label: 'Électroménager', icon: WasherIcon, color: '#0d9488' },
  { key: 'CLEANING',   label: 'Nettoyage',      icon: BroomIcon,  color: '#6d28d9' },
  { key: 'GARDENING',  label: 'Jardinage',      icon: LeafIcon,   color: '#16a34a' },
];

export const categoryMeta = (key: string | undefined) => CATEGORIES.find(c => c.key === key);

// ─── Status chips ───────────────────────────────────────────────────────────

export type Tone = 'amber' | 'green' | 'blue' | 'indigo' | 'red' | 'gray';

export const TONES: Record<Tone, string> = {
  amber:  'bg-[#fff4e5] text-[#c2410c]',
  green:  'bg-[#e7f7ee] text-[#15803d]',
  blue:   'bg-[#e8f0fe] text-[#1d5fd6]',
  indigo: 'bg-[#eef0ff] text-[#4338ca]',
  red:    'bg-[#fdecec] text-[#dc2626]',
  gray:   'bg-[#f1f3f7] text-[#4b5672]',
};

export const RESERVATION_STATUS: Record<ReservationStatus | 'EXPIRED', { label: string; tone: Tone }> = {
  PENDING:     { label: 'En attente', tone: 'amber' },
  ACCEPTED:    { label: 'Acceptée',   tone: 'green' },
  IN_PROGRESS: { label: 'En cours',   tone: 'blue' },
  COMPLETED:   { label: 'Terminée',   tone: 'indigo' },
  REJECTED:    { label: 'Refusée',    tone: 'red' },
  CANCELLED:   { label: 'Annulée',    tone: 'red' },
  EXPIRED:     { label: 'Expirée',    tone: 'gray' },
};

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; tone: Tone }> = {
  PENDING_APPROVAL: { label: 'En attente', tone: 'amber' },
  APPROVED:         { label: 'Approuvé',   tone: 'green' },
  REJECTED:         { label: 'Refusé',     tone: 'red' },
  SUSPENDED:        { label: 'Suspendu',   tone: 'gray' },
  BANNED:           { label: 'Banni',      tone: 'red' },
};

// ─── Locations ──────────────────────────────────────────────────────────────

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Approximate centres, used when a reservation only has a city name
const CITY_COORDS: Record<string, [number, number]> = {
  tunis: [36.8065, 10.1815], ariana: [36.8665, 10.1647], 'la marsa': [36.8782, 10.3247],
  'ben arous': [36.7531, 10.2189], manouba: [36.8101, 10.0956], carthage: [36.8528, 10.3233],
  'la goulette': [36.8183, 10.305], 'le bardo': [36.8092, 10.1408], bardo: [36.8092, 10.1408],
  'lac de tunis': [36.832, 10.235], 'les berges du lac': [36.838, 10.243], sousse: [35.8256, 10.6084],
  sfax: [34.7406, 10.7603], nabeul: [36.4561, 10.7376], hammamet: [36.4, 10.6167],
  bizerte: [37.2744, 9.8739], monastir: [35.7643, 10.8113], mahdia: [35.5047, 11.0622],
  kairouan: [35.6781, 10.0963], gabes: [33.8815, 10.0982], djerba: [33.8076, 10.8451],
  'houmt souk': [33.8756, 10.8575], gafsa: [34.425, 8.7842], kasserine: [35.1676, 8.8365],
  beja: [36.7256, 9.1817], jendouba: [36.5011, 8.7802], 'le kef': [36.1742, 8.7049],
  kef: [36.1742, 8.7049], siliana: [36.0849, 9.3708], zaghouan: [36.4029, 10.1429],
  medenine: [33.3549, 10.5055], tataouine: [32.9297, 10.4518], tozeur: [33.9197, 8.1335],
  kebili: [33.7044, 8.969], 'sidi bouzid': [35.0382, 9.4849],
};

const title = (s: string) => s.split(' ').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');

type Loc = Record<string, unknown> | null | undefined;
const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);

/** Pulls a display city and, when possible, coordinates out of a free-form location JSON. */
export function parseLocation(raw: unknown): { city: string | null; lat: number | null; lng: number | null } {
  const loc = (raw && typeof raw === 'object' ? raw : null) as Loc;
  if (!loc) return { city: null, lat: null, lng: null };
  const coords = (loc.coordinates ?? loc.coords ?? {}) as Record<string, unknown>;

  let lat = num(loc.latitude ?? loc.lat ?? coords.latitude ?? coords.lat);
  let lng = num(loc.longitude ?? loc.lng ?? loc.lon ?? coords.longitude ?? coords.lng ?? coords.lon);

  let city: string | null = null;
  for (const key of ['city', 'ville', 'governorate', 'state']) {
    const v = loc[key];
    if (typeof v === 'string' && v.trim()) {
      city = v.trim();
      break;
    }
  }
  if (!city && typeof loc.address === 'string') {
    const parts = loc.address.split(',').map(p => p.trim()).filter(Boolean);
    city = parts.find(p => CITY_COORDS[norm(p)]) ?? null;
  }

  if ((isNaN(lat) || isNaN(lng)) && city && CITY_COORDS[norm(city)]) {
    [lat, lng] = CITY_COORDS[norm(city)];
  }

  return {
    city: city ? title(city) : null,
    lat: isNaN(lat) ? null : lat,
    lng: isNaN(lng) ? null : lng,
  };
}

// ─── Dates ──────────────────────────────────────────────────────────────────

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export const longDate = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

/** "14:30" today, "Hier" yesterday, otherwise a short date. */
export function relativeTime(iso: string) {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  if (d >= today) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d >= addDays(today, -1)) return 'Hier';
  return shortDate(iso);
}

export type Period = 'today' | '7d' | '30d' | 'month' | 'all';

export const PERIODS: { key: Period; label: string; short: string }[] = [
  { key: 'today', label: "Aujourd'hui",        short: "Aujourd'hui" },
  { key: '7d',    label: '7 derniers jours',   short: '7 jours' },
  { key: '30d',   label: '30 derniers jours',  short: '30 jours' },
  { key: 'month', label: 'Ce mois',            short: 'Ce mois' },
  { key: 'all',   label: 'Depuis le début',    short: 'Tout' },
];

/** Start of the period (inclusive), or null for "all". */
export function periodStart(p: Period, now = new Date()): Date | null {
  const today = startOfDay(now);
  if (p === 'today') return today;
  if (p === '7d') return addDays(today, -6);
  if (p === '30d') return addDays(today, -29);
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

/** Percentage change, matching the backend's /admin/users/stats convention. */
export function delta(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}
