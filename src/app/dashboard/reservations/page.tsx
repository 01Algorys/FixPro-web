'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays, CalendarClock, CalendarCheck2, Clock, Siren, CircleX, ChevronLeft, ChevronRight, List, LayoutGrid,
  RefreshCw, Search, User as UserIcon, ArrowLeft, Wrench,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Pagination, Reservation, ReservationStats, ReservationStatus } from '@/types';
import {
  Card, Skeleton, StatusBadge, Avatar, ServiceIcon, FilterSelect, Pager, ReservationDetails,
  serviceLabel, placeOf, requestRef, fmtDay, STATUS,
} from '@/components/dashboard/kit';

type View = 'calendar' | 'list';
type StatusKey = 'ALL' | 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_FILTERS: { key: StatusKey; label: string; query: string }[] = [
  { key: 'ALL',         label: 'Tous',            query: '' },
  { key: 'PENDING',     label: 'En attente',      query: 'PENDING' },
  { key: 'ACCEPTED',    label: 'Confirmées',      query: 'ACCEPTED' },
  { key: 'IN_PROGRESS', label: 'En intervention', query: 'IN_PROGRESS' },
  { key: 'COMPLETED',   label: 'Terminées',       query: 'COMPLETED' },
  { key: 'CANCELLED',   label: 'Annulées',        query: 'CANCELLED,REJECTED,EXPIRED' },
];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sameDay = (a: Date, b: Date) => ymd(a) === ymd(b);
const monthLabel = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
const dayLabel = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase());

/** Monday-first 6-week grid covering the month of `month` */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

const byTime = (a: Reservation, b: Reservation) => a.time.localeCompare(b.time) || a.id - b.id;

function StatCard({ icon: Icon, color, bg, value, label, hint }: { icon: React.ElementType; color: string; bg: string; value: number | undefined; label: string; hint?: string }) {
  return (
    <Card className="p-3.5 flex items-center gap-3">
      <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon className="w-[22px] h-[22px]" style={{ color }} strokeWidth={2.1} />
      </span>
      <div className="min-w-0">
        <div className="text-[22px] font-extrabold leading-none tabular-nums">
          {value === undefined ? <Skeleton className="h-6 w-10" /> : value.toLocaleString('fr-FR')}
        </div>
        <p className="mt-1 text-[12px] font-medium text-[#33405a] leading-tight">{label}</p>
        {hint && <p className="text-[11px] text-[#8a94ad] leading-tight">{hint}</p>}
      </div>
    </Card>
  );
}

function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const opt = (v: View, Icon: React.ElementType, label: string) => (
    <button
      onClick={() => onChange(v)}
      aria-pressed={value === v}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        value === v ? 'bg-white text-[#1d6ff2] shadow-[0_1px_4px_rgba(15,40,90,0.12)]' : 'text-[#5b6680] hover:text-[#0b1533]'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
  return (
    <div className="inline-flex rounded-xl bg-[#eef2f8] p-1">
      {opt('calendar', LayoutGrid, 'Calendrier')}
      {opt('list', List, 'Liste')}
    </div>
  );
}

// ─── Calendar ───────────────────────────────────────────────────────────────

function MonthCalendar({
  month, byDay, selectedDay, loading, onSelectDay, onOpen, categoryNames,
}: {
  month: Date;
  byDay: Record<string, Reservation[]>;
  selectedDay: Date;
  loading: boolean;
  onSelectDay: (d: Date) => void;
  onOpen: (r: Reservation) => void;
  categoryNames: Record<string, string>;
}) {
  const today = new Date();
  const days = monthGrid(month);
  return (
    <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-7 border-b border-[#edf1f7]">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11.5px] font-semibold uppercase tracking-wide text-[#8a94ad]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const key = ymd(d);
          const list = byDay[key] ?? [];
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = sameDay(d, today);
          const isSelected = sameDay(d, selectedDay);
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(d)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelectDay(d)}
              aria-label={`${dayLabel(d)} : ${list.length} réservation${list.length > 1 ? 's' : ''}`}
              className={`group relative min-h-[64px] md:min-h-[112px] border-[#edf1f7] p-1.5 text-left outline-none transition-colors cursor-pointer
                ${i % 7 !== 6 ? 'border-r' : ''} ${i < 35 ? 'border-b' : ''}
                ${isSelected ? 'bg-[#f2f7ff] ring-2 ring-inset ring-[#1d6ff2]' : inMonth ? 'hover:bg-[#fafbfd]' : 'bg-[#fafbfd]'}
                focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1d6ff2]`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex w-7 h-7 items-center justify-center rounded-full text-[12.5px] font-semibold tabular-nums
                    ${isToday ? 'bg-[#1d6ff2] text-white' : inMonth ? 'text-[#0b1533]' : 'text-[#b6c0d4]'}`}
                >
                  {d.getDate()}
                </span>
                {list.length > 0 && (
                  <span className="hidden md:inline text-[11px] font-semibold text-[#8a94ad] tabular-nums">{list.length}</span>
                )}
              </div>

              {/* Phones: one dot per status present */}
              {list.length > 0 && (
                <div className="md:hidden mt-1 flex flex-wrap gap-0.5 px-0.5">
                  {list.map(r => r.status).filter((s, k, all) => all.indexOf(s) === k).slice(0, 4).map(s => (
                    <span key={s} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS[s].dot }} />
                  ))}
                </div>
              )}

              {/* Wider screens: first bookings of the day */}
              <ul className="hidden md:block mt-1 space-y-0.5">
                {list.slice(0, 3).map(r => (
                  <li key={r.id}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onOpen(r);
                      }}
                      className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-[3px] text-left text-[11.5px] hover:bg-white hover:shadow-[0_1px_4px_rgba(15,40,90,0.1)]"
                      style={{ backgroundColor: `${STATUS[r.status].dot}14` }}
                      title={`${r.time} · ${serviceLabel(r, categoryNames)} · ${r.userInfo?.name ?? ''}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STATUS[r.status].dot }} />
                      <span className="font-semibold tabular-nums text-[#33405a]">{r.time}</span>
                      <ServiceIcon category={r.serviceInfo?.category} className="w-3.5 h-3.5 shrink-0 2xl:hidden" />
                      <span className="hidden 2xl:inline truncate text-[#5b6680]">{serviceLabel(r, categoryNames)}</span>
                      {r.emergency && <Siren className="w-3 h-3 shrink-0 text-[#dc2626]" />}
                    </button>
                  </li>
                ))}
                {list.length > 3 && (
                  <li className="px-1.5 text-[11px] font-semibold text-[#1d6ff2]">+{list.length - 3} autre{list.length - 3 > 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayAgenda({
  day, list, loading, onOpen, categoryNames,
}: { day: Date; list: Reservation[]; loading: boolean; onOpen: (r: Reservation) => void; categoryNames: Record<string, string> }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-[#edf1f7]">
        <p className="text-[12px] font-semibold text-[#8a94ad]">Agenda du jour</p>
        <h2 className="text-[15px] font-extrabold">{dayLabel(day)}</h2>
        <p className="text-[12px] text-[#5b6680]">{list.length} réservation{list.length > 1 ? 's' : ''}</p>
      </div>
      {loading && !list.length ? (
        <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : list.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <CalendarDays className="mx-auto w-8 h-8 text-[#c9d3e3]" />
          <p className="mt-2 text-[13px] text-[#8a94ad]">Aucune réservation ce jour-là.</p>
        </div>
      ) : (
        <ol className="p-2 max-h-[560px] overflow-y-auto">
          {list.map(r => (
            <li key={r.id}>
              <button
                onClick={() => onOpen(r)}
                className="flex w-full items-stretch gap-3 rounded-xl p-2.5 text-left hover:bg-[#f5f7fb] transition-colors"
              >
                <span className="w-12 shrink-0 pt-0.5 text-[13px] font-bold tabular-nums text-[#0b1533]">{r.time}</span>
                <span className="w-1 rounded-full shrink-0" style={{ backgroundColor: STATUS[r.status].dot }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <ServiceIcon category={r.serviceInfo?.category} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{serviceLabel(r, categoryNames)}</span>
                    {r.emergency && <Siren className="w-3.5 h-3.5 shrink-0 text-[#dc2626]" aria-label="Urgent" />}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#5b6680]">
                    <UserIcon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{r.userInfo?.name ?? `#${r.userId}`}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-[#5b6680]">
                    <Wrench className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{r.workerInfo?.name ?? `#${r.workerId}`}</span>
                  </span>
                  <span className="mt-1 inline-block"><StatusBadge status={r.status} /></span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [view, setView] = useState<View>('calendar');
  const [status, setStatus] = useState<StatusKey>('ALL');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [opened, setOpened] = useState<Reservation | null>(null);

  const [monthRows, setMonthRows] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [calLoading, setCalLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // List view
  const [rows, setRows] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [listLoading, setListLoading] = useState(false);

  const statusQuery = STATUS_FILTERS.find(s => s.key === status)?.query ?? '';
  const grid = useMemo(() => monthGrid(month), [month]);
  const monthFrom = ymd(new Date(month.getFullYear(), month.getMonth(), 1));
  const monthTo = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));

  useEffect(() => {
    adminApi.getCategories().then(res => setCategories(Object.fromEntries(res.data.map(c => [c.key, c.name])))).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Calendar data: every booking scheduled in the visible 6 weeks, plus the month's counters
  const calRequest = useRef(0);
  const loadCalendar = useCallback(() => {
    const id = ++calRequest.current;
    setCalLoading(true);
    setFailed(false);
    const params: Record<string, string | number> = { dateFrom: ymd(grid[0]), dateTo: ymd(grid[41]), sort: 'date', limit: 500 };
    if (statusQuery) params.status = statusQuery;
    Promise.all([adminApi.getReservations(params), adminApi.getReservationStats({ dateFrom: monthFrom, dateTo: monthTo })])
      .then(([list, st]) => {
        if (id !== calRequest.current) return;
        setMonthRows(list.data.reservations);
        setStats(st.data);
      })
      .catch(() => id === calRequest.current && setFailed(true))
      .finally(() => id === calRequest.current && setCalLoading(false));
  }, [grid, statusQuery, monthFrom, monthTo]);

  useEffect(loadCalendar, [loadCalendar]);

  const listRequest = useRef(0);
  const loadList = useCallback(() => {
    const id = ++listRequest.current;
    setListLoading(true);
    const params: Record<string, string | number> = { page, limit: perPage };
    if (statusQuery) params.status = statusQuery;
    if (debounced.trim()) params.search = debounced.trim();
    adminApi.getReservations(params)
      .then(res => {
        if (id !== listRequest.current) return;
        setRows(res.data.reservations);
        setPagination(res.data.pagination);
      })
      .catch(() => id === listRequest.current && setFailed(true))
      .finally(() => id === listRequest.current && setListLoading(false));
  }, [page, perPage, statusQuery, debounced]);

  useEffect(() => {
    if (view === 'list') loadList();
  }, [view, loadList]);

  useEffect(() => setPage(1), [statusQuery, debounced, perPage]);

  const byDay = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    monthRows.forEach(r => (map[ymd(new Date(r.date))] ||= []).push(r));
    Object.values(map).forEach(l => l.sort(byTime));
    return map;
  }, [monthRows]);

  const dayList = byDay[ymd(selectedDay)] ?? [];
  const b = stats?.byStatus;
  const cancelled = b ? b.CANCELLED + b.REJECTED + b.EXPIRED : undefined;

  const shiftMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth(next);
    setSelectedDay(sameDay(next, new Date(new Date().getFullYear(), new Date().getMonth(), 1)) ? new Date() : next);
    setOpened(null);
  };
  const goToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now);
    setOpened(null);
  };
  const selectDay = (d: Date) => {
    setSelectedDay(d);
    setOpened(null);
    if (d.getMonth() !== month.getMonth()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const monthName = month.toLocaleDateString('fr-FR', { month: 'long' });

  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Heading */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex w-11 h-11 rounded-xl bg-[#e8f0fe] items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-[#1d6ff2]" strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Réservations</h1>
              <p className="mt-0.5 text-[13px] text-[#6b7590]">Le planning des interventions programmées par les clients.</p>
            </div>
          </div>
          <ViewToggle value={view} onChange={v => { setView(v); setOpened(null); }} />
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard icon={CalendarClock} color="#1d6ff2" bg="#e6efff" value={stats?.today} label="Aujourd'hui" hint="prévues ce jour" />
          <StatCard icon={Clock} color="#d97706" bg="#fff4d6" value={stats?.upcoming} label="À venir" hint="en attente ou confirmées" />
          <StatCard icon={CalendarDays} color="#0284c7" bg="#e0f2fe" value={stats?.total} label={`En ${monthName}`} hint="toutes réservations" />
          <StatCard icon={CalendarCheck2} color="#7c3aed" bg="#efeafe" value={b?.COMPLETED} label="Terminées" hint={`en ${monthName}`} />
          <StatCard icon={CircleX} color="#dc2626" bg="#fde8e8" value={cancelled} label="Annulées" hint={`en ${monthName}`} />
          <StatCard icon={Siren} color="#be123c" bg="#ffe4e6" value={stats?.emergencies} label="Urgentes" hint={`en ${monthName}`} />
        </div>

        {failed && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#fde2e2] bg-[#fff6f6] px-4 py-3 text-[14px] text-[#b91c1c]">
            Impossible de charger les réservations.
            <button onClick={() => (view === 'calendar' ? loadCalendar() : loadList())} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        )}

        {view === 'calendar' ? (
          <div className="grid gap-4 items-start xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="overflow-hidden min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#edf1f7]">
                <div className="flex items-center gap-2">
                  <button onClick={() => shiftMonth(-1)} aria-label="Mois précédent" className="w-9 h-9 rounded-xl border border-[#e3e8f1] flex items-center justify-center hover:bg-[#f3f6fb]">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => shiftMonth(1)} aria-label="Mois suivant" className="w-9 h-9 rounded-xl border border-[#e3e8f1] flex items-center justify-center hover:bg-[#f3f6fb]">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <h2 className="ml-1 text-[17px] font-extrabold">{monthLabel(month)}</h2>
                  <button onClick={goToday} className="ml-1 rounded-xl border border-[#cfe0fc] bg-[#f2f7ff] px-3 py-1.5 text-[12.5px] font-semibold text-[#1d6ff2] hover:bg-[#e8f0fe]">
                    Aujourd&apos;hui
                  </button>
                </div>
                <FilterSelect icon={UserIcon} label="Statut" value={status} onChange={setStatus} options={STATUS_FILTERS} />
              </div>
              <MonthCalendar
                month={month}
                byDay={byDay}
                selectedDay={selectedDay}
                loading={calLoading}
                onSelectDay={selectDay}
                onOpen={r => {
                  setSelectedDay(new Date(r.date));
                  setOpened(r);
                }}
                categoryNames={categories}
              />
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3 border-t border-[#edf1f7]">
                {(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as ReservationStatus[]).map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 text-[11.5px] text-[#5b6680]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS[s].dot }} /> {STATUS[s].label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#5b6680]"><Siren className="w-3.5 h-3.5 text-[#dc2626]" /> Urgente</span>
              </div>
            </Card>

            <div className="xl:sticky xl:top-4 space-y-3">
              {opened ? (
                <>
                  <button onClick={() => setOpened(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1d6ff2] hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Agenda du {selectedDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </button>
                  <ReservationDetails reservation={opened} categoryNames={categories} onClose={() => setOpened(null)} />
                </>
              ) : (
                <DayAgenda day={selectedDay} list={dayList} loading={calLoading} onOpen={setOpened} categoryNames={categories} />
              )}
            </div>
          </div>
        ) : (
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-[17px] font-extrabold">Toutes les réservations ({(pagination?.total ?? 0).toLocaleString('fr-FR')})</h2>
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
                <FilterSelect icon={UserIcon} label="Statut" value={status} onChange={setStatus} options={STATUS_FILTERS} />
              </div>
            </div>

            <div className={`overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5 transition-opacity ${listLoading && rows.length ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[860px] text-[13px]">
                <thead>
                  <tr className="bg-[#f5f7fb] text-left text-[12px] font-semibold text-[#33405a]">
                    {['#', 'Client', 'Technicien', 'Service', 'Prévue le', 'Lieu', 'Prix', 'Statut'].map((h, i, all) => (
                      <th key={h} className={`px-3 py-2.5 whitespace-nowrap ${i === 0 ? 'rounded-l-xl' : ''} ${i === all.length - 1 ? 'rounded-r-xl' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listLoading && !rows.length ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#f0f3f8]"><td colSpan={8} className="px-3 py-3"><Skeleton className="h-8" /></td></tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={8} className="py-14 text-center text-[13px] text-[#8a94ad]">Aucune réservation trouvée.</td></tr>
                  ) : rows.map(r => {
                    const price = r.actualPrice ?? r.estimatedPrice;
                    return (
                      <tr key={r.id} onClick={() => setOpened(r)} className="border-b border-[#f0f3f8] cursor-pointer hover:bg-[#fafbfd] transition-colors">
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
                        <td className="px-3 py-3 truncate max-w-[150px]">{r.workerInfo?.name ?? `#${r.workerId}`}</td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <ServiceIcon category={r.serviceInfo?.category} /> {serviceLabel(r, categories)}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{fmtDay(r.date)} <span className="text-[#5b6680]">· {r.time}</span></td>
                        <td className="px-3 py-3 whitespace-nowrap text-[#33405a]">{placeOf(r).city ?? '—'}</td>
                        <td className="px-3 py-3 whitespace-nowrap tabular-nums">{price !== null && price !== undefined ? `${price.toLocaleString('fr-FR')} DT` : '—'}</td>
                        <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Pager page={page} totalPages={pagination?.totalPages ?? 1} onPage={setPage} perPage={perPage} onPerPage={setPerPage} />
            </div>

            {opened && (
              <div className="fixed inset-0 z-40 flex justify-end bg-[#0b1533]/30" onClick={() => setOpened(null)}>
                <div className="h-full w-full max-w-[420px] overflow-y-auto p-3" onClick={e => e.stopPropagation()}>
                  <ReservationDetails reservation={opened} categoryNames={categories} onClose={() => setOpened(null)} />
                </div>
              </div>
            )}
          </Card>
        )}
      </main>
    </>
  );
}
