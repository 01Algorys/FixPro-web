'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList, Clock, CircleCheck, Wrench, BadgeCheck, CircleX, CalendarRange, MapPin, Layers, User as UserIcon,
  RotateCcw, Download, Eye, Search, RefreshCw, Loader2, Siren,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Pagination, Reservation, ReservationStats } from '@/types';
import {
  Card, Skeleton, StatusBadge, Avatar, ServiceIcon, FilterSelect, Pager, ReservationDetails,
  serviceLabel, placeOf, requestRef, fmtDay, fmtTime, STATUS,
} from '@/components/dashboard/kit';

type PeriodKey = 'month' | '7d' | '30d' | 'lastMonth' | 'all';
type StatusKey = 'ALL' | 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'month',     label: 'Ce mois' },
  { key: '7d',        label: '7 derniers jours' },
  { key: '30d',       label: '30 derniers jours' },
  { key: 'lastMonth', label: 'Mois dernier' },
  { key: 'all',       label: 'Tout' },
];

const STATUS_FILTERS: { key: StatusKey; label: string; query: string }[] = [
  { key: 'ALL',         label: 'Tous',            query: '' },
  { key: 'PENDING',     label: 'En attente',      query: 'PENDING' },
  { key: 'ACCEPTED',    label: 'Confirmées',      query: 'ACCEPTED' },
  { key: 'IN_PROGRESS', label: 'En intervention', query: 'IN_PROGRESS' },
  { key: 'COMPLETED',   label: 'Terminées',       query: 'COMPLETED' },
  // Cancelled by someone, refused by the technician, or never answered
  { key: 'CANCELLED',   label: 'Annulées',        query: 'CANCELLED,REJECTED,EXPIRED' },
];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function periodRange(p: PeriodKey): { createdFrom?: string; createdTo?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'month') return { createdFrom: ymd(new Date(now.getFullYear(), now.getMonth(), 1)) };
  if (p === '7d') return { createdFrom: ymd(new Date(today.getTime() - 6 * 864e5)) };
  if (p === '30d') return { createdFrom: ymd(new Date(today.getTime() - 29 * 864e5)) };
  if (p === 'lastMonth') {
    return { createdFrom: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)), createdTo: ymd(new Date(now.getFullYear(), now.getMonth(), 0)) };
  }
  return {};
}

function StatCard({
  icon: Icon, color, bg, value, label, active, onClick,
}: { icon: React.ElementType; color: string; bg: string; value: number | undefined; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-[0_2px_10px_rgba(15,40,90,0.04)] transition-all hover:-translate-y-0.5 ${
        active ? 'border-[#1d6ff2] ring-2 ring-[#1d6ff2]/15' : 'border-[#edf1f7] hover:border-[#d6e0f0]'
      }`}
    >
      <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon className="w-[22px] h-[22px]" style={{ color }} strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span className="block text-[22px] font-extrabold leading-none tabular-nums">
          {value === undefined ? <Skeleton className="h-6 w-12" /> : value.toLocaleString('fr-FR')}
        </span>
        <span className="mt-1 block text-[12px] font-medium text-[#33405a] leading-tight">{label}</span>
      </span>
    </button>
  );
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function InterventionsPage() {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [city, setCity] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState<StatusKey>('ALL');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [rows, setRows] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [categories, setCategories] = useState<{ key: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Reservation | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    adminApi.getCategories().then(res => setCategories(res.data.map(c => ({ key: c.key, name: c.name })))).catch(() => {});
  }, []);

  // Filters shared by the list and the counters (the counters ignore the status filter)
  const filters = useMemo(() => {
    const f: Record<string, string> = { ...periodRange(period) } as Record<string, string>;
    if (city !== 'ALL') f.city = city;
    if (category !== 'ALL') f.category = category;
    if (debounced.trim()) f.search = debounced.trim();
    return f;
  }, [period, city, category, debounced]);

  const statusQuery = STATUS_FILTERS.find(s => s.key === status)?.query ?? '';

  // Only the latest request may update the page (filters can change while one is in flight)
  const requestId = useRef(0);
  const load = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    const listParams: Record<string, string | number> = { ...filters, page, limit: perPage };
    if (statusQuery) listParams.status = statusQuery;
    Promise.all([adminApi.getReservations(listParams), adminApi.getReservationStats(filters)])
      .then(([list, st]) => {
        if (id !== requestId.current) return;
        setRows(list.data.reservations);
        setPagination(list.data.pagination);
        setStats(st.data);
      })
      .catch(() => id === requestId.current && setFailed(true))
      .finally(() => id === requestId.current && setLoading(false));
  }, [filters, statusQuery, page, perPage]);

  useEffect(load, [load]);

  // Back to page 1 whenever the filters change
  useEffect(() => setPage(1), [filters, statusQuery, perPage]);

  const names = useMemo(() => Object.fromEntries(categories.map(c => [c.key, c.name])), [categories]);
  const b = stats?.byStatus;
  const cancelled = b ? b.CANCELLED + b.REJECTED + b.EXPIRED : undefined;
  const filtered = period !== 'month' || city !== 'ALL' || category !== 'ALL' || status !== 'ALL' || search !== '';

  const reset = () => {
    setPeriod('month');
    setCity('ALL');
    setCategory('ALL');
    setStatus('ALL');
    setSearch('');
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params: Record<string, string | number> = { ...filters, limit: 500 };
      if (statusQuery) params.status = statusQuery;
      const res = await adminApi.getReservations(params);
      const lines = [
        ['Référence', 'Client', 'Téléphone', 'Technicien', 'Service', 'Localisation', 'Demandée le', 'Prévue le', 'Statut', 'Urgence', 'Prix (DT)'],
        ...res.data.reservations.map(r => [
          requestRef(r.id), r.userInfo?.name, r.userInfo?.phone, r.workerInfo?.name, serviceLabel(r, names), placeOf(r).line,
          `${fmtDay(r.createdAt)} ${fmtTime(r.createdAt)}`, `${fmtDay(r.date)} ${r.time}`, STATUS[r.status]?.label ?? r.status,
          r.emergency ? 'Oui' : 'Non', r.actualPrice ?? r.estimatedPrice ?? '',
        ]),
      ];
      const csv = '﻿' + lines.map(l => l.map(csvCell).join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `fixpro-interventions-${ymd(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setFailed(true);
    } finally {
      setExporting(false);
    }
  };

  const total = pagination?.total ?? 0;
  const columns = selected
    ? ['#', 'Client', 'Service', 'Date', 'Statut', 'Actions']
    : ['#', 'Client', 'Service', 'Localisation', 'Date', 'Statut', 'Actions'];

  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Heading */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex w-11 h-11 rounded-xl bg-[#e8f0fe] items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-[#1d6ff2]" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Interventions</h1>
            <p className="mt-0.5 text-[13px] text-[#6b7590]">Toutes les demandes créées par les clients, en attente ou traitées.</p>
          </div>
        </div>

        {/* Counters (click to filter) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard icon={ClipboardList} color="#0284c7" bg="#e0f2fe" value={stats?.total} label="Total demandes" active={status === 'ALL'} onClick={() => setStatus('ALL')} />
          <StatCard icon={Clock} color="#d97706" bg="#fff4d6" value={b?.PENDING} label="En attente" active={status === 'PENDING'} onClick={() => setStatus('PENDING')} />
          <StatCard icon={CircleCheck} color="#16a34a" bg="#e3f6ea" value={b?.ACCEPTED} label="Confirmées" active={status === 'ACCEPTED'} onClick={() => setStatus('ACCEPTED')} />
          <StatCard icon={Wrench} color="#1d6ff2" bg="#e6efff" value={b?.IN_PROGRESS} label="En intervention" active={status === 'IN_PROGRESS'} onClick={() => setStatus('IN_PROGRESS')} />
          <StatCard icon={BadgeCheck} color="#7c3aed" bg="#efeafe" value={b?.COMPLETED} label="Terminées" active={status === 'COMPLETED'} onClick={() => setStatus('COMPLETED')} />
          <StatCard icon={CircleX} color="#dc2626" bg="#fde8e8" value={cancelled} label="Annulées" active={status === 'CANCELLED'} onClick={() => setStatus('CANCELLED')} />
        </div>

        <div className={`grid gap-4 items-start ${selected ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
          <div className="space-y-4 min-w-0">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <FilterSelect icon={CalendarRange} label="Période" value={period} onChange={setPeriod} options={PERIODS} />
              <FilterSelect
                icon={MapPin} label="Ville" value={city} onChange={setCity}
                options={[{ key: 'ALL', label: 'Toutes' }, ...(stats?.cities ?? []).map(c => ({ key: c, label: c }))]}
              />
              <FilterSelect
                icon={Layers} label="Service" value={category} onChange={setCategory}
                options={[{ key: 'ALL', label: 'Tous' }, ...categories.map(c => ({ key: c.key, label: c.name }))]}
              />
              <FilterSelect icon={UserIcon} label="Statut" value={status} onChange={setStatus} options={STATUS_FILTERS} />
              <button
                onClick={reset}
                disabled={!filtered}
                className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0fc] bg-[#f2f7ff] px-3.5 py-2 text-[12.5px] font-semibold text-[#1d6ff2] hover:bg-[#e8f0fe] disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>

            {failed && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#fde2e2] bg-[#fff6f6] px-4 py-3 text-[14px] text-[#b91c1c]">
                Impossible de charger les demandes.
                <button onClick={load} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
                  <RefreshCw className="w-4 h-4" /> Réessayer
                </button>
              </div>
            )}

            {/* List */}
            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-[17px] font-extrabold">Liste des demandes ({total.toLocaleString('fr-FR')})</h2>
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a94ad]" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Client, technicien, n°…"
                      className="w-[210px] rounded-xl border border-[#e3e8f1] bg-white py-2 pl-9 pr-3 text-[13px] placeholder:text-[#a3adc2] focus:outline-none focus:ring-2 focus:ring-[#1d6ff2]/20"
                    />
                  </label>
                  <button
                    onClick={exportCsv}
                    disabled={exporting || !total}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0fc] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1d6ff2] hover:bg-[#f2f7ff] disabled:opacity-50 transition-colors"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Exporter
                  </button>
                </div>
              </div>

              <div className={`overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5 transition-opacity ${loading && rows.length ? 'opacity-60' : ''}`}>
                <table className={`w-full text-[13px] ${selected ? 'min-w-[620px]' : 'min-w-[760px]'}`}>
                  <thead>
                    <tr className="bg-[#f5f7fb] text-left text-[12px] font-semibold text-[#33405a]">
                      {columns.map((h, i) => (
                        <th key={h} className={`px-3 py-2.5 whitespace-nowrap ${i === 0 ? 'rounded-l-xl' : ''} ${i === columns.length - 1 ? 'rounded-r-xl text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !rows.length ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-b border-[#f0f3f8]">
                          <td colSpan={columns.length} className="px-3 py-3"><Skeleton className="h-8" /></td>
                        </tr>
                      ))
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={columns.length} className="py-14 text-center text-[13px] text-[#8a94ad]">Aucune demande pour ces filtres.</td></tr>
                    ) : rows.map(r => {
                      const place = placeOf(r);
                      const isOpen = selected?.id === r.id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelected(r)}
                          className={`border-b border-[#f0f3f8] cursor-pointer transition-colors ${isOpen ? 'bg-[#f2f7ff]' : 'hover:bg-[#fafbfd]'}`}
                        >
                          <td className="px-3 py-3 font-bold whitespace-nowrap">
                            {requestRef(r.id)}
                            {r.emergency && <Siren className="inline ml-1.5 -mt-0.5 w-3.5 h-3.5 text-[#dc2626]" aria-label="Urgent" />}
                          </td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-2.5">
                              <Avatar name={r.userInfo?.name ?? '?'} src={r.userInfo?.avatar} />
                              <span className="font-medium truncate max-w-[140px]">{r.userInfo?.name ?? `#${r.userId}`}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-2 whitespace-nowrap">
                              <ServiceIcon category={r.serviceInfo?.category} />
                              {serviceLabel(r, names)}
                            </span>
                          </td>
                          {!selected && <td className="px-3 py-3">
                            <span className="flex items-start gap-1.5 max-w-[190px]">
                              <MapPin className="w-4 h-4 mt-0.5 text-[#1d6ff2] shrink-0" />
                              <span className="leading-snug line-clamp-2">{place.line}</span>
                            </span>
                          </td>}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="flex items-start gap-1.5">
                              <CalendarRange className="w-4 h-4 mt-0.5 text-[#5b6680]" />
                              <span className="leading-snug">{fmtDay(r.createdAt)}<br /><span className="text-[#5b6680]">{fmtTime(r.createdAt)}</span></span>
                            </span>
                          </td>
                          <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelected(r);
                              }}
                              aria-label={`Voir la demande ${requestRef(r.id)}`}
                              className="p-1.5 rounded-lg text-[#33405a] hover:bg-[#e8f0fe] hover:text-[#1d6ff2]"
                            >
                              <Eye className="w-[18px] h-[18px]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <Pager page={page} totalPages={pagination?.totalPages ?? 1} onPage={setPage} perPage={perPage} onPerPage={setPerPage} />
              </div>
            </Card>
          </div>

          {/* Details: side column on wide screens, slide-over below */}
          {selected && (
            <>
              <div className="hidden xl:block sticky top-4">
                <ReservationDetails reservation={selected} categoryNames={names} onClose={() => setSelected(null)} />
              </div>
              <div className="xl:hidden fixed inset-0 z-40 flex justify-end bg-[#0b1533]/30" onClick={() => setSelected(null)}>
                <div className="h-full w-full max-w-[420px] overflow-y-auto p-3" onClick={e => e.stopPropagation()}>
                  <ReservationDetails reservation={selected} categoryNames={names} onClose={() => setSelected(null)} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
