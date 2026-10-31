'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, Users, Wrench, FileText, CalendarDays, CalendarCheck, CreditCard, ShieldCheck,
  Star, MessageSquareText, Bell, LayoutDashboard, MapPin, BarChart3, Settings, Crown, ArrowRight, X,
} from 'lucide-react';

type BadgeKey = 'pending' | 'messages' | 'notifications';

const navItems: { href: string; label: string; icon: React.ElementType; badge?: BadgeKey }[] = [
  { href: '/dashboard',               label: 'Tableau de bord',      icon: LayoutGrid },
  { href: '/dashboard/utilisateurs',  label: 'Utilisateurs',         icon: Users },
  { href: '/dashboard/techniciens',   label: 'Techniciens',          icon: Wrench, badge: 'pending' },
  { href: '/dashboard/demandes',      label: 'Demandes',             icon: FileText },
  { href: '/dashboard/reservations',  label: 'Réservations',         icon: CalendarDays },
  { href: '/dashboard/interventions', label: 'Interventions',        icon: CalendarCheck },
  { href: '/dashboard/paiements',     label: 'Paiements',            icon: CreditCard },
  { href: '/dashboard/abonnements',   label: 'Abonnements',          icon: ShieldCheck },
  { href: '/dashboard/avis',          label: 'Avis & Évaluations',   icon: Star },
  { href: '/dashboard/messages',      label: 'Messages',             icon: MessageSquareText, badge: 'messages' },
  { href: '/dashboard/notifications', label: 'Notifications',        icon: Bell, badge: 'notifications' },
  { href: '/dashboard/categories',    label: 'Catégories',           icon: LayoutDashboard },
  { href: '/dashboard/zones',         label: "Zones d'intervention", icon: MapPin },
  { href: '/dashboard/rapports',      label: 'Rapports & Analyses',  icon: BarChart3 },
  { href: '/dashboard/parametres',    label: 'Paramètres',           icon: Settings },
];

interface SidebarProps {
  pendingCount?: number;
  messageCount?: number;
  notifCount?: number;
  /** Drawer state below the lg breakpoint; the sidebar is always visible above it */
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ pendingCount = 0, messageCount = 0, notifCount = 0, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const badges: Record<BadgeKey, number> = { pending: pendingCount, messages: messageCount, notifications: notifCount };

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-[#0b1533]/50 backdrop-blur-[2px]" onClick={onClose} />}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 flex flex-col overflow-hidden transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, #0e2a6e 0%, #0b2160 55%, #0a1c52 100%)' }}
      >
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#1d6ff2]/25 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-start justify-between px-6 pt-6 pb-5">
          <Link href="/dashboard" onClick={onClose}>
            <Image src="/images/logo.png" alt="FixPro" width={320} height={110} priority className="h-12 w-auto brightness-0 invert" />
            <p className="mt-0.5 ms-[52px] text-[11px] text-blue-100/80">Simple · rapide · fiable</p>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 -me-2 text-blue-100 hover:text-white" aria-label="Fermer le menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-hide">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            const count = badge ? badges[badge] : 0;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14.5px] font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#1d6ff2] to-[#2f80ff] text-white shadow-[0_8px_20px_rgba(29,111,242,0.35)]'
                    : 'text-blue-50/90 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                <Icon className={`w-[19px] h-[19px] shrink-0 ${active ? '' : 'text-blue-100/80 group-hover:text-white'}`} strokeWidth={1.8} />
                <span className="truncate">{label}</span>
                {count > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#ef4444] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upsell */}
        <div className="relative mx-4 mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="flex items-center gap-2 text-[17px] font-extrabold text-white">
            <Crown className="w-6 h-6 text-[#fbbf24] fill-[#fbbf24]" /> FixPro <span className="text-[#5aa2ff]">Pro</span>
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-blue-100/80">
            Gérez et développez votre plateforme plus efficacement.
          </p>
          <Link
            href="/dashboard/abonnements"
            onClick={onClose}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1d6ff2] hover:bg-[#2f80ff] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors"
          >
            En savoir plus <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </aside>
    </>
  );
}
