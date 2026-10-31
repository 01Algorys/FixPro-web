'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, Search, ChevronDown, Menu, LogOut, Settings } from 'lucide-react';
import { clearToken } from '@/lib/api';
import { useShell } from '@/components/layout/shell';

interface AdminUser {
  name: string;
  role: string;
  avatar: string | null;
}

interface TopBarProps {
  /** Kept for existing pages; the redesigned bar shows the page title in the page itself */
  breadcrumb?: { label: string; href?: string }[];
  notifCount?: number;
}

export default function TopBar({ notifCount = 0 }: TopBarProps) {
  const router = useRouter();
  const { openSidebar } = useShell();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fixpro_admin_user');
      if (stored) setAdmin(JSON.parse(stored));
    } catch {}
  }, []);

  // ⌘K / Ctrl+K focuses the search field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <header className="h-[72px] bg-white/90 backdrop-blur border-b border-[#edf1f7] flex items-center px-4 sm:px-6 lg:px-8 gap-3 sm:gap-5 sticky top-0 z-30">
      <button onClick={openSidebar} className="lg:hidden p-2 -ml-2 text-[#4b5672] hover:text-[#0b1533] rounded-lg" aria-label="Ouvrir le menu">
        <Menu className="w-6 h-6" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-[540px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8a94ad]" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Rechercher un utilisateur, un technicien, une demande…"
          className="w-full pl-11 pr-14 py-2.5 text-[14px] bg-white border border-[#e3e8f1] rounded-xl placeholder:text-[#8a94ad] focus:outline-none focus:ring-4 focus:ring-[#1d6ff2]/10 focus:border-[#1d6ff2]/50 transition"
        />
        <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 rounded-md border border-[#e3e8f1] bg-[#f6f8fc] px-1.5 py-0.5 text-[11px] font-medium text-[#6b7590]">
          ⌘ K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <Link href="/dashboard/notifications" className="relative p-2.5 text-[#33405a] hover:bg-[#f3f6fb] rounded-xl transition-colors" aria-label="Notifications">
          <Bell className="w-[22px] h-[22px]" strokeWidth={1.8} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ef4444] ring-2 ring-white text-white text-[10px] font-bold flex items-center justify-center">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>

        {/* Language (the admin is French-only for now) */}
        <span className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] font-medium text-[#0b1533]" title="Français">
          <span className="w-5 h-5 rounded-full overflow-hidden flex ring-1 ring-black/5">
            <span className="flex-1 bg-[#1d4ed8]" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-[#ef4444]" />
          </span>
          Français
        </span>

        {/* Admin menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            className="flex items-center gap-3 ps-1 pe-2 py-1 rounded-xl hover:bg-[#f3f6fb] transition-colors"
          >
            {admin?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={admin.avatar} alt={admin.name} className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1d6ff2] to-[#0f4fd1] flex items-center justify-center text-white text-[17px] font-bold">
                {admin?.name?.[0]?.toUpperCase() ?? 'A'}
              </span>
            )}
            <span className="text-left hidden sm:block">
              <span className="block text-[14px] font-bold text-[#0b1533] leading-tight">{admin?.name ?? 'Admin FixPro'}</span>
              <span className="block text-[12px] text-[#6b7590] mt-0.5">Super Admin</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-[#8a94ad] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-[0_14px_40px_rgba(15,40,90,0.16)] border border-[#edf1f7] p-1.5">
              <Link href="/dashboard/parametres" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] text-[#33405a] hover:bg-[#f3f6fb]">
                <Settings className="w-4 h-4" /> Paramètres
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] text-[#dc2626] hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
