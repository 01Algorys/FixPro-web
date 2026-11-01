'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AlertTriangle, X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { ShellContext } from '@/components/layout/shell';
import { adminApi } from '@/lib/api';
import type { Notification } from '@/types';

const ALERT_POLL_MS = 30_000;

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [toast, setToast] = useState<Notification | null>(null);
  const lastAlertId = useRef<number | null>(null);

  // Poll the admin's unread alerts; a new one pops a toast that stays until closed (plus a browser notification when allowed)
  const refreshAlerts = useCallback(() => {
    adminApi.getUnreadAlertCount()
      .then(res => {
        setAlertCount(res.data.count);
        const latest = res.data.latest;
        if (latest && latest.id !== lastAlertId.current) {
          const isNew = lastAlertId.current === null || latest.id > lastAlertId.current;
          lastAlertId.current = latest.id;
          if (isNew) {
            setToast(latest);
            if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(latest.title, { body: latest.message, tag: `fixpro-alert-${latest.id}` });
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('fixpro_admin_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);

    // Load sidebar badge asynchronously
    adminApi.getDashboardStats()
      .then(res => setPendingCount(res.data.pendingApprovals))
      .catch(() => {});

    refreshAlerts();
    const timer = setInterval(refreshAlerts, ALERT_POLL_MS);
    return () => clearInterval(timer);
  }, [router, refreshAlerts]);

  // Close the mobile drawer after navigating
  useEffect(() => setSidebarOpen(false), [pathname]);

  const shell = useMemo(
    () => ({ openSidebar: () => setSidebarOpen(true), alertCount, refreshAlerts }),
    [alertCount, refreshAlerts]
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ShellContext.Provider value={shell}>
      <div className={`${jakarta.className} min-h-screen bg-[#f5f7fb] text-[#0b1533]`}>
        <Sidebar pendingCount={pendingCount} notifCount={alertCount} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64 min-h-screen flex flex-col min-w-0">
          {children}
        </div>

        {toast && (
          <div role="alert" className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[10000] bg-white border border-red-200 shadow-2xl rounded-xl p-4 flex gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.message}</p>
              <div className="flex gap-3 mt-2">
                <Link href="/dashboard/avis?filter=LOW" onClick={() => setToast(null)} className="text-xs font-semibold text-red-600 hover:underline">
                  Voir les avis négatifs
                </Link>
                <Link href="/dashboard/notifications" onClick={() => setToast(null)} className="text-xs font-medium text-gray-500 hover:underline">
                  Toutes les alertes
                </Link>
              </div>
            </div>
            <button onClick={() => setToast(null)} className="p-1 h-fit text-gray-400 hover:text-gray-600" aria-label="Fermer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
}
