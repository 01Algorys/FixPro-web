'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jakarta } from '../fonts';
import { AlertTriangle, Lock, X } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { ShellContext } from '@/components/layout/shell';
import { adminApi } from '@/lib/api';
import { canAccess, firstAllowedPage, sectionForPath } from '@/lib/access';
import type { AdminMe, Notification } from '@/types';

const ALERT_POLL_MS = 30_000;

// Shown instead of a page the admin's account can't open (the API refuses its data anyway)
function Restricted({ home }: { home: string }) {
  return (
    <>
      <TopBar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-sm text-center">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-[#eef2f8] flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#5b6680]" />
          </span>
          <h1 className="mt-4 text-[20px] font-extrabold">Accès restreint</h1>
          <p className="mt-1.5 text-[14px] text-[#5b6680]">
            Votre compte administrateur n&apos;a pas accès à cette section. Demandez à un administrateur principal de l&apos;ajouter à vos accès.
          </p>
          <Link href={home} className="mt-5 inline-flex rounded-xl bg-[#1d6ff2] hover:bg-[#2f80ff] px-4 py-2.5 text-[14px] font-semibold text-white">
            Retour
          </Link>
        </div>
      </main>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [toast, setToast] = useState<Notification | null>(null);
  const [me, setMe] = useState<AdminMe | null>(null);
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

    // Which sections this admin may open. If the API can't say (older backend),
    // show everything: the API still refuses what isn't allowed.
    let access: AdminMe | null = null;
    adminApi.getMe()
      .then(res => {
        access = res.data;
        setMe(res.data);
      })
      .catch(() => {})
      .finally(() => {
        setReady(true);
        // Sidebar badges, for the sections this admin can see
        if (canAccess(access, 'dashboard')) {
          adminApi.getDashboardStats()
            .then(res => setPendingCount(res.data.pendingApprovals + (res.data.documentsToReview ?? 0)))
            .catch(() => {});
        }
        if (canAccess(access, 'reservations')) {
          adminApi.getReservationStats()
            .then(res => setRequestCount(res.data.byStatus.PENDING))
            .catch(() => {});
        }
      });

    refreshAlerts();
    const timer = setInterval(refreshAlerts, ALERT_POLL_MS);
    return () => clearInterval(timer);
  }, [router, refreshAlerts]);

  const allowed = canAccess(me, sectionForPath(pathname));
  const home = firstAllowedPage(me);

  // A limited admin without the overview starts on their first section
  useEffect(() => {
    if (ready && !allowed && pathname === '/dashboard') router.replace(home);
  }, [ready, allowed, pathname, home, router]);

  // Close the mobile drawer after navigating
  useEffect(() => setSidebarOpen(false), [pathname]);

  const shell = useMemo(
    () => ({ openSidebar: () => setSidebarOpen(true), alertCount, refreshAlerts, me }),
    [alertCount, refreshAlerts, me]
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
        <Sidebar pendingCount={pendingCount} requestCount={requestCount} notifCount={alertCount} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64 min-h-screen flex flex-col min-w-0">
          {allowed ? children : pathname === '/dashboard' ? null : <Restricted home={home} />}
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
