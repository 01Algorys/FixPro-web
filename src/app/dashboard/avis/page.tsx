'use client';

import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Review, ReviewCounts, Pagination } from '@/types';
import { Star, ChevronLeft, ChevronRight, AlertTriangle, Flag, ArrowUp, ArrowDown } from 'lucide-react';

type Filter = 'ALL' | 'LOW' | 'REPORTED';

function Stars({ rating, bad }: { rating: number; bad?: boolean }) {
  const on = bad ? 'text-red-500 fill-red-500' : 'text-yellow-400 fill-yellow-400';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? on : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

export default function AvisPage() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [counts, setCounts]         = useState<ReviewCounts>({ low: 0, reported: 0, lowThreshold: 3 });
  const [filter, setFilter]         = useState<Filter | null>(null);
  const [sortBy, setSortBy]         = useState<'createdAt' | 'rating'>('createdAt');
  const [sortOrder, setSortOrder]   = useState<'asc' | 'desc'>('desc');

  // The alert toast links here with ?filter=LOW
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filter');
    setFilter(f === 'LOW' || f === 'REPORTED' ? f : 'ALL');
  }, []);

  const fetch = useCallback(async () => {
    if (!filter) return;
    setLoading(true);
    try {
      const res = await adminApi.getReviews({ page, limit: 10, filter, sortBy, sortOrder });
      setReviews(res.data.reviews);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch {}
    setLoading(false);
  }, [page, filter, sortBy, sortOrder]);

  useEffect(() => { fetch(); }, [fetch]);

  const isBad = (r: Review) => r.rating < counts.lowThreshold;

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setPage(1);
    window.history.replaceState(null, '', f === 'ALL' ? '/dashboard/avis' : `/dashboard/avis?filter=${f}`);
  };

  const toggleRatingSort = () => {
    if (sortBy !== 'rating') { setSortBy('rating'); setSortOrder('asc'); }
    else if (sortOrder === 'asc') setSortOrder('desc');
    else { setSortBy('createdAt'); setSortOrder('desc'); }
    setPage(1);
  };

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

        {counts.low > 0 && filter !== 'LOW' && (
          <button onClick={() => changeFilter('LOW')}
            className="w-full mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-left rounded-xl px-4 py-3 hover:bg-red-100/70 transition-colors">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm text-red-800 flex-1">
              <span className="font-semibold">{counts.low} avis négatif{counts.low > 1 ? 's' : ''}</span> (moins de {counts.lowThreshold} étoiles) à surveiller
            </span>
            <span className="text-xs font-semibold text-red-700">Voir →</span>
          </button>
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([
            { key: 'ALL',      label: 'Tous les avis', count: null },
            { key: 'LOW',      label: 'Avis négatifs', count: counts.low },
            { key: 'REPORTED', label: 'Signalés',      count: counts.reported },
          ] as { key: Filter; label: string; count: number | null }[]).map(t => (
            <button key={t.key} onClick={() => changeFilter(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filter === t.key
                  ? t.key === 'LOW' ? 'bg-red-600 text-white border-red-600' : 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {t.key === 'LOW' && <AlertTriangle className="w-3.5 h-3.5" />}
              {t.key === 'REPORTED' && <Flag className="w-3.5 h-3.5" />}
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 rounded-full ${filter === t.key ? 'bg-white/25' : t.key === 'LOW' && t.count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['ID', 'Client', 'Technicien', 'Note', 'Commentaire', 'Vérifié', 'Signalé', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                      {h === 'Note' ? (
                        <button onClick={toggleRatingSort} className={`inline-flex items-center gap-1 hover:text-gray-800 ${sortBy === 'rating' ? 'text-gray-800' : ''}`}>
                          Note {sortBy === 'rating' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </button>
                      ) : h}
                    </th>
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
                  <tr key={r.id} className={`transition-colors ${
                    isBad(r)
                      ? 'bg-red-50 hover:bg-red-100/60 shadow-[inset_4px_0_0_0_#dc2626]'
                      : r.reported ? 'bg-red-50/30 hover:bg-gray-50/50' : 'hover:bg-gray-50/50'
                  }`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">#{r.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.userInfo?.name ?? `#${r.userId}`}</td>
                    <td className={`px-4 py-3 text-sm ${isBad(r) ? 'font-semibold text-red-800' : 'text-gray-700'}`}>{r.workerInfo?.name ?? `#${r.workerId}`}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Stars rating={r.rating} bad={isBad(r)} />
                        {isBad(r) && (
                          <span className="inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-600 text-white">
                            <AlertTriangle className="w-3 h-3" /> Avis négatif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm max-w-xs ${isBad(r) ? 'text-red-900 font-medium whitespace-normal' : 'text-gray-600 truncate'}`}>
                      {r.comment || '—'}
                    </td>
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
