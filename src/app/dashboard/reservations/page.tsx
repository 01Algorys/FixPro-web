'use client';

import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Reservation, Pagination } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'En attente',  cls: 'bg-yellow-100 text-yellow-700' },
  ACCEPTED:    { label: 'Acceptée',    cls: 'bg-blue-100 text-blue-700' },
  REJECTED:    { label: 'Refusée',     cls: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: 'En cours',    cls: 'bg-purple-100 text-purple-700' },
  COMPLETED:   { label: 'Terminée',    cls: 'bg-green-100 text-green-700' },
  CANCELLED:   { label: 'Annulée',     cls: 'bg-gray-100 text-gray-500' },
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination]     = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]           = useState(true);
  const [status, setStatus]             = useState('ALL');
  const [page, setPage]                 = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (status !== 'ALL') params.status = status;
      const res = await adminApi.getReservations(params);
      setReservations(res.data.reservations);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const start = (pagination.page - 1) * 10 + 1;
  const end   = Math.min(pagination.page * 10, pagination.total);

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Réservations' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
          <p className="text-gray-500 text-sm mt-1">Toutes les réservations de la plateforme</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="ALL">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={() => { setStatus('ALL'); setPage(1); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['ID', 'Client', 'Technicien', 'Date', 'Durée', 'Prix estimé', 'Prix réel', 'Statut', 'Créé le'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : reservations.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-gray-400 py-12 text-sm">Aucune réservation trouvée</td></tr>
                ) : reservations.map(r => {
                  const s = STATUS_LABELS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">#{r.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.userInfo?.name ?? `#${r.userId}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.workerInfo?.name ?? `#${r.workerId}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(r.date)} {r.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.duration} min</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.estimatedPrice ? `${r.estimatedPrice} TND` : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.actualPrice ? `${r.actualPrice} TND` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {pagination.total === 0 ? 'Aucun résultat' : `Affichage de ${start} à ${end} sur ${pagination.total}`}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg ${p === pagination.page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
