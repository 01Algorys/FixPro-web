'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Wrench, FileText, Calendar,
  CreditCard, Star, Star as StarFilled, MessageSquare,
  Bell, Grid3X3, MapPin, Settings, LogOut, TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { clearToken } from '@/lib/api';

const navItems = [
  { href: '/dashboard',               label: 'Tableau de bord',     icon: LayoutDashboard },
  { href: '/dashboard/utilisateurs',  label: 'Utilisateurs',         icon: Users },
  { href: '/dashboard/techniciens',   label: 'Techniciens',          icon: Wrench },
  { href: '/dashboard/demandes',      label: 'Demandes',             icon: FileText },
  { href: '/dashboard/reservations',  label: 'Réservations',         icon: Calendar },
  { href: '/dashboard/paiements',     label: 'Paiements',            icon: CreditCard },
  { href: '/dashboard/abonnements',   label: 'Abonnements',          icon: ShieldCheck },
  { href: '/dashboard/avis',          label: 'Avis & Évaluations',   icon: StarFilled },
  { href: '/dashboard/messages',      label: 'Messages',             icon: MessageSquare },
  { href: '/dashboard/notifications', label: 'Notifications',        icon: Bell, badge: true },
  { href: '/dashboard/categories',    label: 'Catégories',           icon: Grid3X3 },
  { href: '/dashboard/zones',         label: "Zones d'intervention", icon: MapPin },
  { href: '/dashboard/parametres',    label: 'Paramètres',           icon: Settings },
];

interface SidebarProps {
  pendingCount?: number;
  revenue?: number;
  revenueDelta?: number;
}

export default function Sidebar({ pendingCount = 0, revenue = 0, revenueDelta = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col overflow-hidden"
           style={{ background: 'linear-gradient(180deg, #1e5fd9 0%, #1642a0 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">FixPro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {badge && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Revenue card */}
      <div className="mx-3 mb-3 rounded-xl bg-white/10 p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-white/70" />
          <span className="text-white/70 text-xs">Revenus totaux</span>
        </div>
        <p className="text-white font-bold text-lg">
          {revenue.toLocaleString('fr-TN')} TND
        </p>
        {revenueDelta !== 0 && (
          <p className={`text-xs mt-0.5 ${revenueDelta > 0 ? 'text-green-300' : 'text-red-300'}`}>
            {revenueDelta > 0 ? '▲' : '▼'} {Math.abs(revenueDelta).toFixed(1)}% depuis le mois dernier
          </p>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-5 py-4 text-blue-100 hover:text-white hover:bg-white/10 transition-all text-sm font-medium border-t border-white/10"
      >
        <LogOut className="w-4 h-4" />
        <span>Déconnexion</span>
      </button>
    </aside>
  );
}
