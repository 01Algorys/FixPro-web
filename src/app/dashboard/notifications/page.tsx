'use client';

import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Notification, Pagination } from '@/types';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';

export default function NotificationsPage() {
  const [notifs, setNotifs]         = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getNotifications({ page, limit: 20 });
      setNotifs(res.data.notifications);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Notifications' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} notifications dans le système</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => (
              <div key={n.id} className={`bg-white rounded-xl border px-5 py-4 flex items-start gap-4 ${!n.isRead ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                      <div className="mt-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{n.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 self-center">Page {page} / {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </>
  );
}
