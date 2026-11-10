import type { AccessLevel, AdminMe, AdminSection } from '@/types';

// Which permission each dashboard page needs. The backend enforces the same
// sections on its endpoints; hiding things here is only for comfort.
// null = open to every admin (own alerts, own account).
const PAGE_SECTIONS: { href: string; section: AdminSection | null }[] = [
  { href: '/dashboard/utilisateurs',  section: 'users' },
  { href: '/dashboard/techniciens',   section: 'technicians' },
  { href: '/dashboard/demandes',      section: 'reservations' },
  { href: '/dashboard/reservations',  section: 'reservations' },
  { href: '/dashboard/interventions', section: 'reservations' },
  { href: '/dashboard/paiements',     section: 'payments' },
  { href: '/dashboard/abonnements',   section: 'subscriptions' },
  { href: '/dashboard/avis',          section: 'reviews' },
  { href: '/dashboard/messages',      section: 'messages' },
  { href: '/dashboard/notifications', section: null },
  { href: '/dashboard/categories',    section: 'categories' },
  { href: '/dashboard/zones',         section: 'zones' },
  { href: '/dashboard/rapports',      section: 'reports' },
  { href: '/dashboard/parametres',    section: null },
  { href: '/dashboard',               section: 'dashboard' },
];

export function sectionForPath(pathname: string): AdminSection | null {
  const match = PAGE_SECTIONS.find(p => pathname === p.href || pathname.startsWith(`${p.href}/`));
  return match ? match.section : null;
}

const RANK: Record<AccessLevel, number> = { view: 1, edit: 2 };

/** me = null means the access couldn't be loaded (e.g. an older backend): show everything, the API decides */
export function canAccess(me: AdminMe | null, section: AdminSection | null, level: AccessLevel = 'view'): boolean {
  if (!section || !me || me.full) return true;
  const granted = me.permissions?.[section];
  return !!granted && RANK[granted] >= RANK[level];
}

export function canOpen(me: AdminMe | null, href: string): boolean {
  return canAccess(me, sectionForPath(href));
}

/** Where a limited admin lands when the overview isn't theirs */
export function firstAllowedPage(me: AdminMe | null): string {
  const page = PAGE_SECTIONS.find(p => p.section && canAccess(me, p.section));
  return page?.href ?? '/dashboard/parametres';
}

export const LEVEL_LABEL: Record<AccessLevel, string> = { view: 'Lecture', edit: 'Modification' };
