'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Category, CategoryInput, Service, ServiceInput, Pagination } from '@/types';
import {
  Grid3X3, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, AlertCircle, Search,
  ArrowUp, ArrowDown, Eye, EyeOff, Star, Wrench, Users,
} from 'lucide-react';

const PRICE_UNITS: Record<string, string> = { JOB: 'par intervention', HOUR: 'par heure', CONSULTATION: 'consultation' };

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormFooter({ saving, onClose, label }: { saving: boolean; onClose: () => void; label: string }) {
  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
      <button type="button" onClick={onClose} disabled={saving}
        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">Annuler</button>
      <button type="submit" disabled={saving}
        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
        {saving && <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function FormError({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
    </div>
  );
}

// ── Category create/edit ────────────────────────────────────────────────────
function CategoryModal({ category, onSaved, onClose }: { category: Category | null; onSaved: () => void; onClose: () => void }) {
  const [name, setName]         = useState(category?.name ?? '');
  const [description, setDesc]  = useState(category?.description ?? '');
  const [icon, setIcon]         = useState(category?.icon ?? '');
  const [color, setColor]       = useState(category?.color ?? '#1a56db');
  const [isActive, setActive]   = useState(category?.isActive ?? true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body: CategoryInput = { name, description: description || null, icon: icon || null, color, isActive };
    try {
      if (category) await adminApi.updateCategory(category.id, body);
      else await adminApi.createCategory(body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSaving(false);
    }
  };

  return (
    <Modal title={category ? `Modifier « ${category.name} »` : 'Nouvelle catégorie'}
      subtitle={category ? `Code : ${category.key} (ne change pas)` : 'Le code est généré à partir du nom'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col min-h-0">
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          <FormError error={error} />
          <div>
            <label className={labelCls}>Nom *</label>
            <input required minLength={2} maxLength={60} value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="ex : Peinture" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input maxLength={300} value={description} onChange={e => setDesc(e.target.value)} className={inputCls} placeholder="ex : Peinture intérieure et extérieure" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Icône (app mobile)</label>
              <input value={icon} onChange={e => setIcon(e.target.value)} className={inputCls} placeholder="ex : color-palette" />
            </div>
            <div>
              <label className={labelCls}>Couleur</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-9 rounded border border-gray-200 cursor-pointer" />
                <input value={color} onChange={e => setColor(e.target.value)} className={inputCls} pattern="#[0-9a-fA-F]{6}" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            L&apos;icône est un nom <a href="https://ionic.io/ionicons" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ionicons</a>, affiché dans l&apos;application mobile.
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
            Visible dans l&apos;application
          </label>
        </div>
        <FormFooter saving={saving} onClose={onClose} label={category ? 'Enregistrer' : 'Créer'} />
      </form>
    </Modal>
  );
}

// ── Service create/edit ─────────────────────────────────────────────────────
function ServiceModal({ service, categories, defaultCategory, onSaved, onClose }: {
  service: Service | null; categories: Category[]; defaultCategory: string; onSaved: () => void; onClose: () => void;
}) {
  const [name, setName]           = useState(service?.name ?? '');
  const [description, setDesc]    = useState(service?.description ?? '');
  const [category, setCategory]   = useState(service?.category ?? defaultCategory);
  const [basePrice, setBasePrice] = useState(service?.basePrice?.toString() ?? '');
  const [priceUnit, setPriceUnit] = useState(service?.priceUnit ?? 'JOB');
  const [duration, setDuration]   = useState(service?.duration?.toString() ?? '');
  const [isActive, setActive]     = useState(service?.isActive ?? true);
  const [isPopular, setPopular]   = useState(service?.isPopular ?? false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body: ServiceInput = {
      name, description, category, priceUnit, isActive, isPopular,
      basePrice: basePrice === '' ? null : Number(basePrice.replace(',', '.')),
      duration: duration === '' ? null : Number(duration),
    };
    try {
      if (service) await adminApi.updateService(service.id, body);
      else await adminApi.createService(body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSaving(false);
    }
  };

  return (
    <Modal title={service ? `Modifier « ${service.name} »` : 'Nouveau service'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col min-h-0">
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          <FormError error={error} />
          <div>
            <label className={labelCls}>Nom *</label>
            <input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea required minLength={2} maxLength={1000} rows={3} value={description} onChange={e => setDesc(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Catégorie *</label>
            <select required value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
              {categories.map(c => <option key={c.key} value={c.key}>{c.name}{c.isActive ? '' : ' (masquée)'}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Prix de base (TND)</label>
              <input inputMode="decimal" value={basePrice} onChange={e => setBasePrice(e.target.value)} className={inputCls} placeholder="—" />
            </div>
            <div>
              <label className={labelCls}>Unité</label>
              <select value={priceUnit} onChange={e => setPriceUnit(e.target.value)} className={inputCls}>
                {Object.entries(PRICE_UNITS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Durée estimée (minutes)</label>
            <input type="number" min={15} max={1440} value={duration} onChange={e => setDuration(e.target.value)} className={inputCls} placeholder="—" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300" /> Actif
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={isPopular} onChange={e => setPopular(e.target.checked)} className="w-4 h-4 rounded border-gray-300" /> Populaire
            </label>
          </div>
        </div>
        <FormFooter saving={saving} onClose={onClose} label={service ? 'Enregistrer' : 'Créer'} />
      </form>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [services, setServices]     = useState<Service[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [category, setCategory]     = useState('ALL');
  const [search, setSearch]         = useState('');
  const [error, setError]           = useState('');

  const [editingCategory, setEditingCategory] = useState<Category | null | 'new'>(null);
  const [editingService, setEditingService]   = useState<Service | null | 'new'>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
    setCatLoading(false);
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 100 };
      if (category !== 'ALL') params.category = category;
      const res = await adminApi.getServices(params);
      setServices(res.data.services);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
    setLoading(false);
  }, [page, category]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchServices(); }, [fetchServices]);

  const categoryByKey = useMemo(() => Object.fromEntries(categories.map(c => [c.key, c])), [categories]);
  const visibleServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? services.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) : services;
  }, [services, search]);

  const run = async (action: () => Promise<unknown>) => {
    setError('');
    try {
      await action();
      await Promise.all([fetchCategories(), fetchServices()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  // Swap display order with the neighbour
  const move = (index: number, dir: -1 | 1) => {
    const a = categories[index];
    const b = categories[index + dir];
    if (!a || !b) return;
    const [orderA, orderB] = a.order === b.order ? [b.order + dir, a.order] : [b.order, a.order];
    run(() => Promise.all([adminApi.updateCategory(a.id, { order: orderA }), adminApi.updateCategory(b.id, { order: orderB })]));
  };

  const removeCategory = (c: Category) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    run(() => adminApi.deleteCategory(c.id));
  };

  const removeService = (s: Service) => {
    if (!window.confirm(`Supprimer le service « ${s.name} » ? Il sera retiré des profils des techniciens.`)) return;
    run(() => adminApi.deleteService(s.id));
  };

  const onSaved = () => {
    setEditingCategory(null);
    setEditingService(null);
    fetchCategories();
    fetchServices();
  };

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Catégories' }]} />
      <main className="p-4 sm:p-6 flex-1 min-w-0">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catégories & Services</h1>
            <p className="text-gray-500 text-sm mt-1">Les catégories et services proposés dans l&apos;application</p>
          </div>
          <button onClick={() => setEditingCategory('new')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle catégorie
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
          {catLoading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
          )) : categories.map((c, i) => (
            <div key={c.id} className={`bg-white rounded-xl shadow-sm border p-4 ${c.isActive ? 'border-gray-100' : 'border-dashed border-gray-300 opacity-70'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold"
                  style={{ background: c.color ?? '#6b7280' }}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    {!c.isActive && <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 rounded">masquée</span>}
                  </div>
                  <p className="text-[11px] font-mono text-gray-400">{c.key}{c.icon ? ` · ${c.icon}` : ''}</p>
                  {c.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <button onClick={() => { setCategory(c.key); setPage(1); }} className="flex items-center gap-1 whitespace-nowrap hover:text-blue-600" title="Voir les services">
                  <Wrench className="w-3.5 h-3.5" /> {c.serviceCount} service(s)
                </button>
                <span className="flex items-center gap-1 whitespace-nowrap"><Users className="w-3.5 h-3.5" /> {c.technicianCount} tech.</span>
                <div className="ml-auto flex items-center gap-0.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Monter" className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === categories.length - 1} title="Descendre" className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => run(() => adminApi.updateCategory(c.id, { isActive: !c.isActive }))}
                    title={c.isActive ? "Masquer dans l'application" : "Afficher dans l'application"} className="p-1 rounded hover:bg-gray-100">
                    {c.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setEditingCategory(c)} title="Modifier" className="p-1 rounded hover:bg-gray-100 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeCategory(c)} title="Supprimer" className="p-1 rounded hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Services */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900">Services</h2>
          <button onClick={() => setEditingService('new')} disabled={categories.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Nouveau service
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3 flex items-center gap-3 flex-wrap">
          <Grid3X3 className="w-4 h-4 text-gray-400" />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="ALL">Toutes les catégories</option>
            {categories.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un service…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Service', 'Catégorie', 'Prix de base', 'Durée', 'Populaire', 'Actif', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : visibleServices.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-12 text-sm">Aucun service</td></tr>
                ) : visibleServices.map(s => {
                  const cat = categoryByKey[s.category];
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50/50 ${s.isActive ? '' : 'opacity-60'}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{s.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          <span className="w-2 h-2 rounded-full" style={{ background: cat?.color ?? '#9ca3af' }} />
                          {cat?.name ?? s.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {s.basePrice !== null ? `${s.basePrice} TND` : '—'}
                        <span className="text-xs text-gray-400"> {PRICE_UNITS[s.priceUnit] ?? s.priceUnit}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.duration ? `${s.duration} min` : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => run(() => adminApi.updateService(s.id, { isPopular: !s.isPopular }))} title="Populaire">
                          <Star className={`w-4 h-4 ${s.isPopular ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => run(() => adminApi.updateService(s.id, { isActive: !s.isActive }))}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          role="switch" aria-checked={s.isActive} title={s.isActive ? 'Désactiver' : 'Activer'}>
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${s.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingService(s)} title="Modifier" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => removeService(s)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-end gap-1 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-gray-600 px-2">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </main>

      {editingCategory !== null && (
        <CategoryModal category={editingCategory === 'new' ? null : editingCategory} onSaved={onSaved} onClose={() => setEditingCategory(null)} />
      )}
      {editingService !== null && (
        <ServiceModal service={editingService === 'new' ? null : editingService} categories={categories}
          defaultCategory={category !== 'ALL' ? category : categories[0]?.key ?? ''} onSaved={onSaved} onClose={() => setEditingService(null)} />
      )}
    </>
  );
}
