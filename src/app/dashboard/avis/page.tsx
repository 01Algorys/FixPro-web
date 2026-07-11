'use client';

import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Review, Pagination } from '@/types';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AvisPage() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReviews({ page, limit: 10 });
      setReviews(res.data.reviews);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const start = (pagination.page - 1) * 10 + 1;
  const end   = Math.min(pagination.page * 10, pagination.total);

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Avis & Évaluations' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Avis & Évaluations</h1>
          <p className="text-gray-500 text-sm mt-1">Modérez les avis laissés par les clients</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['ID', 'Client', 'Technicien', 'Note', 'Commentaire', 'Vérifié', 'Signalé', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : reviews.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-12 text-sm">Aucun avis trouvé</td></tr>
                ) : reviews.map(r => (
                  <tr key={r.id} className={`hover:bg-gray-50/50 transition-colors ${r.reported ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">#{r.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.userInfo?.name ?? `#${r.userId}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.workerInfo?.name ?? `#${r.workerId}`}</td>
                    <td className="px-4 py-3"><Stars rating={r.rating} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{r.comment ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.isVerified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.reported && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Signalé</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
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
