'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { useShell } from '@/components/layout/shell';
import { adminApi } from '@/lib/api';
import type { Notification, Pagination } from '@/types';
import { Bell, BellRing, ChevronLeft, ChevronRight, AlertTriangle, CheckCheck, Activity } from 'lucide-react';

type Scope = 'alerts' | 'activity';

const TYPE_LABEL: Record<string, string> = {
  LOW_RATING_REVIEW:     'Avis négatif',
  RESERVATION_CANCELLED: 'Réservation annulée',
  RESERVATION_EXPIRED:   'Réservation expirée',
  system:                'Système',
};

export default function NotificationsPage() {
  const { refreshAlerts } = useShell();
  const [scope, setScope]           = useState<Scope>('alerts');
  const [notifs, setNotifs]         = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [browserAlerts, setBrowserAlerts] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setBrowserAlerts('Notification' in window ? window.Notification.permission : 'unsupported');
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getNotifications({ page, limit: 20, scope });
      setNotifs(res.data.notifications);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, scope]);

  useEffect(() => { fetch(); }, [fetch]);

  const unreadIds = scope === 'alerts' ? notifs.filter(n => !n.isRead).map(n => n.id) : [];

  const markRead = async (ids?: number[]) => {
    try {
      await adminApi.markAlertsRead(ids);
      setNotifs(prev => prev.map(n => (!ids || ids.includes(n.id) ? { ...n, isRead: true } : n)));
      refreshAlerts();
    } catch {}
  };

  const enableBrowserAlerts = async () => {
    if (!('Notification' in window)) return;
    setBrowserAlerts(await window.Notification.requestPermission());
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Notifications' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm mt-1">
              {scope === 'alerts'
                ? 'Alertes qui vous sont adressées (avis de moins de 3 étoiles…)'
                : 'Activité de la plateforme, hors messages entre utilisateurs'}
            </p>
          </div>
          {browserAlerts === 'default' && (
            <button onClick={enableBrowserAlerts}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
              <BellRing className="w-4 h-4" /> Activer les alertes du navigateur
            </button>
          )}
          {browserAlerts === 'granted' && (
            <span className="flex items-center gap-1.5 text-xs text-green-700"><BellRing className="w-3.5 h-3.5" /> Alertes du navigateur activées</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([
            { key: 'alerts',   label: 'Alertes',  icon: AlertTriangle },
            { key: 'activity', label: 'Activité', icon: Activity },
          ] as { key: Scope; label: string; icon: React.ElementType }[]).map(t => (
            <button key={t.key} onClick={() => { setScope(t.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                scope === t.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
          {unreadIds.length > 0 && (
            <button onClick={() => markRead()}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-white rounded-lg hover:bg-gray-50">
              <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
            </button>
          )}
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
            <p className="text-gray-400 text-sm">{scope === 'alerts' ? 'Aucune alerte' : 'Aucune activité'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => {
              const lowReview = n.type === 'LOW_RATING_REVIEW';
              const unread = scope === 'alerts' && !n.isRead;
              return (
                <div key={n.id} className={`bg-white rounded-xl border px-5 py-4 flex items-start gap-4 ${
                  lowReview && unread ? 'border-red-200 bg-red-50/40' : unread ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'
                }`}>
                  {lowReview
                    ? <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${unread ? 'text-red-600' : 'text-gray-300'}`} />
                    : <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${unread ? 'bg-blue-500' : 'bg-gray-300'}`} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                        <div className="flex gap-3 mt-1.5">
                          {lowReview && (
                            <Link href="/dashboard/avis?filter=LOW" className="text-xs font-semibold text-red-600 hover:underline">
                              Voir les avis négatifs
                            </Link>
                          )}
                          {unread && (
                            <button onClick={() => markRead([n.id])} className="text-xs text-gray-500 hover:text-gray-800 hover:underline">
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${lowReview ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                            {TYPE_LABEL[n.type] ?? n.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
