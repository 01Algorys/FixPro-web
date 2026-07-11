'use client';

import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Service, Pagination } from '@/types';
import { Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  PLUMBING:   'Plomberie',
  ELECTRICAL: 'Électricité',
  HVAC:       'Climatisation',
  LOCKSMITH:  'Serrurerie',
};

export default function CategoriesPage() {
  const [services, setServices]     = useState<Service[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [category, setCategory]     = useState('ALL');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (category !== 'ALL') params.category = category;
      const res = await adminApi.getServices(params);
      setServices(res.data.services);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, category]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Catégories' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Catégories & Services</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez le catalogue de services</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-3">
          <Grid3X3 className="w-4 h-4 text-gray-400" />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="ALL">Toutes les catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['ID', 'Nom', 'Catégorie', 'Prix de base', 'Unité', 'Populaire', 'Actif', 'Créé le'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : services.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-12 text-sm">Aucun service trouvé</td></tr>
                ) : services.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">#{s.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {CATEGORY_LABELS[s.category] ?? s.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.basePrice ? `${s.basePrice} TND` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.priceUnit}</td>
                    <td className="px-4 py-3">
                      {s.isPopular && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">★ Populaire</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">{pagination.total} service{pagination.total > 1 ? 's' : ''}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
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
