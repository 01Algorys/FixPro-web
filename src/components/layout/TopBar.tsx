'use client';

import { Bell, Search, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminUser {
  name: string;
  role: string;
  avatar: string | null;
}

interface TopBarProps {
  breadcrumb: { label: string; href?: string }[];
  notifCount?: number;
}

export default function TopBar({ breadcrumb, notifCount = 0 }: TopBarProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fixpro_admin_user');
      if (stored) setAdmin(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm flex-1">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-400">›</span>}
            <span className={i === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Notification bell */}
      <button className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell className="w-5 h-5" />
        {notifCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      {/* Admin info */}
      <button className="flex items-center gap-2.5 pl-2 pr-1 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
        {admin?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={admin.avatar} alt={admin.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {admin?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
        )}
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 leading-none">{admin?.name ?? 'Admin FixPro'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Super Admin</p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
    </header>
  );
}
