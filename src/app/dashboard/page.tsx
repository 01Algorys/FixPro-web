'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  User as UserIcon, Wrench, CalendarDays, CircleCheck, Coins, Database, FileText, Clock, UserPlus,
  ArrowUp, ArrowDown, ArrowRight, ChevronDown, Download, CalendarRange, MoreHorizontal, BarChart3,
  UserRoundPlus, CircleX, Star, BadgeCheck, CheckCircle2, RefreshCw, Check,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { DashboardStats, Reservation, Review, Service, User, UserStats } from '@/types';
import { LineChart, Donut, Sparkline } from '@/components/dashboard/charts';
import ZoneMap, { type ZonePoint } from '@/components/dashboard/ZoneMap';
import {
  CATEGORIES, categoryMeta, TONES, RESERVATION_STATUS, ACCOUNT_STATUS, parseLocation, startOfDay, addDays,
  dayKey, shortDate, longDate, relativeTime, PERIODS, periodStart, delta, type Period, type Tone,
} from '@/components/dashboard/data';

// The admin list endpoints cap `limit` at 100, so charts are computed from at most this many rows
const SAMPLE = 100;

const fmt = (n: number) => n.toLocaleString('fr-FR');
const tnd = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND`;

interface Data {
  stats: DashboardStats | null;
  userStats: UserStats | null;
  reservations: Reservation[];
  reservationsTotal: number;
  services: Service[];
  workers: User[];
  users: User[];
  reviews: Review[];
}

// ─── Small building blocks ──────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#edf1f7] shadow-[0_2px_10px_rgba(15,40,90,0.04)] ${className}`}>
      {children}
    </div>
  );
}

function Delta({ value }: { value: number | undefined }) {
  if (value === undefined) return null;
  const up = value > 0;
  const down = value < 0;
  const Icon = down ? ArrowDown : ArrowUp;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-bold tabular-nums ${up ? 'text-[#16a34a]' : down ? 'text-[#dc2626]' : 'text-[#8a94ad]'}`}>
      <Icon className="w-3 h-3" strokeWidth={2.6} />
      {up ? '+' : ''}{fmt(value)}%
    </span>
  );
}

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const Icon = tone === 'green' || tone === 'indigo' ? CheckCircle2 : tone === 'red' ? CircleX : Clock;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${TONES[tone]}`}>
      <Icon className="w-3 h-3" strokeWidth={2.4} /> {children}
    </span>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#eef2f8] ${className}`} />;
}

function Dropdown<T extends string>({
  value, options, onChange, className = '', icon,
}: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; className?: string; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const current = options.find(o => o.key === value);
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-[#e3e8f1] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#0b1533] hover:border-[#c9d3e3] transition-colors"
      >
        {icon}
        <span className="flex-1 text-left whitespace-nowrap">{current?.label}</span>
        <ChevronDown className={`w-4 h-4 text-[#8a94ad] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-20 mt-1.5 min-w-full rounded-xl border border-[#edf1f7] bg-white p-1 shadow-[0_14px_40px_rgba(15,40,90,0.16)]">
          {options.map(o => (
            <li key={o.key}>
              <button
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] ${o.key === value ? 'bg-[#e8f0fe] font-semibold text-[#1d6ff2]' : 'hover:bg-[#f3f6fb]'}`}
              >
                <span className="flex-1">{o.label}</span>
                {o.key === value && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon, color, bg, title, value, deltaValue, sub, cornerIcon: Corner,
}: {
  icon: React.ElementType; color: string; bg: string; title: string; value: string; deltaValue?: number; sub: string; cornerIcon: React.ElementType;
}) {
  return (
    <Card className="relative p-4 flex items-center gap-3">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-[#33405a]">{title}</p>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className="text-[20px] font-extrabold leading-tight tabular-nums">{value}</span>
          <Delta value={deltaValue} />
        </p>
        <p className="mt-0.5 text-[11.5px] text-[#6b7590]">{sub}</p>
      </div>
      <Corner className="absolute right-4 top-4 w-4 h-4 text-[#b6c0d4]" strokeWidth={1.8} />
    </Card>
  );
}

function RevenueCard({
  icon: Icon, color, bg, title, value, deltaValue, sub, spark,
}: {
  icon: React.ElementType; color: string; bg: string; title: string; value: string; deltaValue?: number; sub?: string; spark: number[];
}) {
  return (
    <Card className="relative overflow-hidden p-4 flex items-center gap-3">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
      </span>
      <div className="relative z-10 min-w-0">
        <p className="text-[12.5px] font-medium text-[#33405a] whitespace-nowrap">{title}</p>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className="text-[19px] font-extrabold leading-tight tabular-nums whitespace-nowrap">{value}</span>
          <Delta value={deltaValue} />
        </p>
        {sub && <p className="mt-0.5 text-[11.5px] text-[#6b7590]">{sub}</p>}
      </div>
      {/* Decorative trend in the corner; the value and delta carry the information */}
      <Sparkline values={spark} color={color} className="absolute right-3 bottom-2.5 w-[28%] max-w-[100px] h-7 opacity-90" />
    </Card>
  );
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[14.5px] font-extrabold whitespace-nowrap truncate">{title}</h2>
      {action}
    </div>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1d6ff2] hover:gap-2 transition-all">
      Voir tout <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function SampleNote({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="mt-3 text-[11px] text-[#8a94ad]">Calculé sur les {SAMPLE} dernières réservations.</p>;
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />;
  }
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1d6ff2] to-[#38bdf8] text-white text-[10.5px] font-bold flex items-center justify-center shrink-0">
      {initials || '?'}
    </span>
  );
}

function ServiceCell({ category }: { category: string | undefined }) {
  const meta = categoryMeta(category);
  if (!meta) return <span className="text-[#8a94ad]">—</span>;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <meta.icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
      {meta.label}
    </span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [chartDays, setChartDays] = useState<'7' | '14' | '30'>('7');

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    Promise.allSettled([
      adminApi.getDashboardStats(),
      adminApi.getUserStats(),
      adminApi.getReservations({ limit: SAMPLE }),
      adminApi.getServices({ limit: 100 }),
      adminApi.getUsers({ role: 'WORKER', limit: 5 }),
      adminApi.getUsers({ limit: SAMPLE }),
      adminApi.getReviews({ limit: 10 }),
    ]).then(([stats, userStats, resv, services, workers, users, reviews]) => {
      const ok = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null);
      if (stats.status === 'rejected') setFailed(true);
      setData({
        stats: ok(stats)?.data ?? null,
        userStats: ok(userStats)?.data ?? null,
        reservations: ok(resv)?.data.reservations ?? [],
        reservationsTotal: ok(resv)?.data.pagination.total ?? 0,
        services: ok(services)?.data.services ?? [],
        workers: ok(workers)?.data.users ?? [],
        users: ok(users)?.data.users ?? [],
        reviews: ok(reviews)?.data.reviews ?? [],
      });
      setLoading(false);
    });
  }, []);

  useEffect(load, [load]);

  const view = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const inMonth = (iso: string | null | undefined, from: Date, to: Date) => !!iso && new Date(iso) >= from && new Date(iso) < to;

    const resv = data.reservations;
    // Month-over-month deltas are only exact when we hold every reservation
    const complete = data.reservationsTotal <= resv.length;
    const categoryOf = new Map(data.services.map(s => [s.id, s.category]));
    const completed = resv.filter(r => r.status === 'COMPLETED');

    const monthDelta = (dates: (string | null | undefined)[], weights?: number[]) => {
      if (!complete) return undefined;
      let curr = 0;
      let prev = 0;
      dates.forEach((d, i) => {
        const w = weights ? weights[i] : 1;
        if (inMonth(d, thisMonth, addDays(now, 1))) curr += w;
        else if (inMonth(d, lastMonth, thisMonth)) prev += w;
      });
      return delta(curr, prev);
    };

    // Daily buckets for the line chart and the revenue sparkline
    const days = Number(chartDays);
    const today = startOfDay(now);
    const buckets = (n: number) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
    const countBy = (range: Date[], dates: (string | null | undefined)[], weights?: number[]) => {
      const idx = new Map(range.map((d, i) => [dayKey(d), i]));
      const out = range.map(() => 0);
      dates.forEach((d, i) => {
        if (!d) return;
        const k = idx.get(dayKey(new Date(d)));
        if (k !== undefined) out[k] += weights ? weights[i] : 1;
      });
      return out;
    };
    const chartRange = buckets(days);
    const clients = data.users.filter(u => u.role !== 'ADMIN');
    const sparkRange = buckets(14);

    // Period-filtered breakdowns (donut + map)
    const from = periodStart(period, now);
    const inPeriod = resv.filter(r => !from || new Date(r.createdAt) >= from);

    const byCategory = new Map<string, number>();
    inPeriod.forEach(r => {
      const c = categoryOf.get(r.serviceId);
      if (c) byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
    });

    const zones = new Map<string, ZonePoint>();
    let unplaced = 0;
    inPeriod.forEach(r => {
      const { city, lat, lng } = parseLocation(r.location);
      if (lat === null || lng === null) {
        unplaced++;
        return;
      }
      const label = city ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      const z = zones.get(label) ?? { label, count: 0, lat, lng };
      z.count++;
      zones.set(label, z);
    });

    // Recent activity merged from the lists we already have
    type Activity = { at: string; title: string; sub: string; icon: React.ElementType; tone: Tone };
    const activity: Activity[] = [];
    resv.slice(0, 10).forEach(r => {
      const cat = categoryMeta(categoryOf.get(r.serviceId))?.label;
      const who = [r.userInfo?.name, cat].filter(Boolean).join(' · ');
      activity.push({ at: r.createdAt, title: `Nouvelle demande #${r.id}`, sub: who, icon: FileText, tone: 'blue' });
      if (r.status === 'CANCELLED' && r.cancelledAt) activity.push({ at: r.cancelledAt, title: 'Demande annulée', sub: who, icon: CircleX, tone: 'red' });
      if (r.status === 'COMPLETED' && r.completedAt) activity.push({ at: r.completedAt, title: `Intervention terminée #${r.id}`, sub: who, icon: CircleCheck, tone: 'green' });
    });
    clients.slice(0, 6).forEach(u => {
      activity.push(
        u.role === 'WORKER'
          ? { at: u.createdAt, title: 'Nouveau technicien inscrit', sub: u.name, icon: Wrench, tone: 'indigo' }
          : { at: u.createdAt, title: 'Nouvel utilisateur inscrit', sub: u.name, icon: UserRoundPlus, tone: 'blue' },
      );
    });
    data.reviews.slice(0, 6).forEach(rv => {
      activity.push({
        at: rv.createdAt,
        title: 'Avis client ajouté',
        sub: `${rv.userInfo?.name ?? 'Client'} · ${rv.rating} étoile${rv.rating > 1 ? 's' : ''}`,
        icon: Star,
        tone: 'amber',
      });
    });
    activity.sort((a, b) => +new Date(b.at) - +new Date(a.at));

    return {
      complete,
      categoryOf,
      reservationsDelta: monthDelta(resv.map(r => r.createdAt)),
      completedDelta: monthDelta(completed.map(r => r.completedAt)),
      revenueDelta: monthDelta(completed.map(r => r.completedAt), completed.map(r => r.actualPrice ?? 0)),
      revenueSpark: countBy(sparkRange, completed.map(r => r.completedAt), completed.map(r => r.actualPrice ?? 0)),
      chart: {
        labels: chartRange.map(d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '')),
        series: [
          { name: 'Réservations', color: '#1d6ff2', values: countBy(chartRange, resv.map(r => r.createdAt)) },
          { name: 'Interventions', color: '#16a34a', values: countBy(chartRange, completed.map(r => r.completedAt)) },
          { name: 'Nouveaux utilisateurs', color: '#8b3dff', values: countBy(chartRange, clients.map(u => u.createdAt)) },
        ],
      },
      slices: CATEGORIES.map(c => ({ label: c.label, value: byCategory.get(c.key) ?? 0, color: c.color })),
      periodCount: inPeriod.length,
      zones: Array.from(zones.values()).sort((a, b) => b.count - a.count),
      unplaced,
      activity: activity.slice(0, 6),
    };
  }, [data, period, chartDays]);

  const s = data?.stats;
  const periodFrom = periodStart(period);
  const rangeLabel = periodFrom ? `${longDate(periodFrom)} - ${longDate(new Date())}` : 'Depuis le début';

  const exportCsv = () => {
    if (!data) return;
    const rows: (string | number)[][] = [
      ['Indicateur', 'Valeur'],
      ['Utilisateurs', s?.totalUsers ?? ''],
      ['Techniciens approuvés', s?.totalWorkers ?? ''],
      ['Réservations', s?.totalReservations ?? ''],
      ['Interventions terminées', s?.completedReservations ?? ''],
      ['Revenus totaux (TND)', s?.totalRevenue ?? ''],
      ['En attente d’approbation', s?.pendingApprovals ?? ''],
      [],
      ['#', 'Service', 'Client', 'Localisation', 'Statut', 'Date'],
      ...data.reservations.map(r => [
        r.id,
        categoryMeta(view?.categoryOf.get(r.serviceId))?.label ?? '',
        r.userInfo?.name ?? '',
        parseLocation(r.location).city ?? '',
        RESERVATION_STATUS[r.status]?.label ?? r.status,
        new Date(r.createdAt).toLocaleDateString('fr-FR'),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixpro-tableau-de-bord-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Heading */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Tableau de bord</h1>
            <p className="mt-0.5 text-[13px] text-[#6b7590]">Vue d&apos;ensemble de la plateforme FixPro</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Dropdown
              value={period}
              onChange={setPeriod}
              options={PERIODS.map(p => ({ key: p.key, label: p.key === period ? rangeLabel : p.label }))}
              icon={<CalendarRange className="w-4 h-4 text-[#6b7590]" />}
              className="min-w-[210px] [&>button]:py-2 [&>button]:text-[12.5px]"
            />
            <button
              onClick={exportCsv}
              disabled={!data}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1d6ff2] hover:bg-[#165fd6] disabled:opacity-50 px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(29,111,242,0.25)] transition-colors"
            >
              <Download className="w-4 h-4" /> Exporter
            </button>
          </div>
        </div>

        {failed && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#fde2e2] bg-[#fff6f6] px-4 py-3 text-[14px] text-[#b91c1c]">
            Impossible de charger les statistiques.
            <button onClick={load} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[78px] rounded-2xl" />)
          ) : (
            <>
              <KpiCard icon={UserIcon} color="#1d6ff2" bg="#e8f0fe" title="Utilisateurs" value={fmt(s?.totalUsers ?? 0)}
                deltaValue={data?.userStats?.particuliers.delta} sub="Clients inscrits" cornerIcon={UserPlus} />
              <KpiCard icon={Wrench} color="#8b3dff" bg="#f1e8ff" title="Techniciens" value={fmt(s?.totalWorkers ?? 0)}
                deltaValue={data?.userStats?.techniciens.delta} sub="Comptes approuvés" cornerIcon={BarChart3} />
              <KpiCard icon={CalendarDays} color="#ea580c" bg="#fff1e6" title="Réservations" value={fmt(s?.totalReservations ?? 0)}
                deltaValue={view?.reservationsDelta} sub="Total des réservations" cornerIcon={CalendarDays} />
              <KpiCard icon={CircleCheck} color="#16a34a" bg="#e7f7ee" title="Interventions terminées" value={fmt(s?.completedReservations ?? 0)}
                deltaValue={view?.completedDelta} sub="Services réalisés" cornerIcon={BadgeCheck} />
            </>
          )}
        </div>

        {/* Revenue row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[78px] rounded-2xl" />)
          ) : (
            <>
              <RevenueCard icon={Coins} color="#16a34a" bg="#e7f7ee" title="Revenus totaux" value={tnd(s?.totalRevenue ?? 0)}
                deltaValue={view?.revenueDelta} sub="Depuis le début" spark={view?.revenueSpark ?? []} />
              <RevenueCard icon={Database} color="#8b3dff" bg="#f1e8ff" title="Revenus abonnements" value={tnd(0)}
                sub="Module à venir" spark={Array(14).fill(0)} />
              <RevenueCard icon={FileText} color="#1d6ff2" bg="#e8f0fe" title="Revenus commissions" value={tnd(0)}
                sub="Module à venir" spark={Array(14).fill(0)} />
              <Card className="relative p-4 flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-[#fdecec] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#dc2626]" strokeWidth={2} />
                </span>
                <div className="min-w-0 pr-6">
                  <p className="text-[12.5px] font-medium text-[#33405a] whitespace-nowrap">En attente d&apos;approbation</p>
                  <p className="mt-0.5 text-[20px] font-extrabold leading-tight tabular-nums">{fmt(s?.pendingApprovals ?? 0)}</p>
                  <Link href="/dashboard/techniciens" className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[11.5px] font-semibold text-[#dc2626] hover:gap-2.5 transition-all">
                    Voir les demandes <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <span className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-[#fdecec] flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5 text-[#dc2626]" />
                </span>
              </Card>
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-[1.45fr_1.15fr_1fr] gap-3">
          <Card className="p-4 xl:col-span-2 2xl:col-span-1">
            <CardHeader
              title="Évolution des réservations"
              action={
                <Dropdown
                  value={chartDays}
                  onChange={setChartDays}
                  options={[{ key: '7', label: '7 derniers jours' }, { key: '14', label: '14 derniers jours' }, { key: '30', label: '30 derniers jours' }]}
                />
              }
            />
            {view ? (
              <>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                  {view.chart.series.map(sr => (
                    <span key={sr.name} className="inline-flex items-center gap-1.5 text-[12px] text-[#33405a]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sr.color }} /> {sr.name}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <LineChart labels={view.chart.labels} series={view.chart.series} height={180} />
                </div>
                <SampleNote show={!view.complete} />
              </>
            ) : (
              <Skeleton className="mt-3 h-[205px]" />
            )}
          </Card>

          <Card className="p-4">
            <CardHeader
              title="Réservations par service"
              action={<Dropdown value={period} onChange={setPeriod} options={PERIODS.map(p => ({ key: p.key, label: p.short }))} />}
            />
            {view ? (
              <>
                <div className="mt-3 flex flex-col sm:flex-row items-center gap-5">
                  <Donut slices={view.slices} centerLabel={view.periodCount > 1 ? 'Réservations' : 'Réservation'} size={136} />
                  <ul className="flex-1 w-full space-y-[5px]">
                    {view.slices.map(sl => {
                      const pct = view.periodCount ? Math.round((sl.value / view.periodCount) * 100) : 0;
                      return (
                        <li key={sl.label} className="flex items-center gap-2 text-[12px]">
                          <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: sl.color }} />
                          <span className="flex-1 text-[#33405a] truncate">{sl.label}</span>
                          <span className="font-bold tabular-nums">{sl.value}</span>
                          <span className="w-11 text-right text-[#8a94ad] tabular-nums">({pct}%)</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <SampleNote show={!view.complete} />
              </>
            ) : (
              <Skeleton className="mt-3 h-[180px]" />
            )}
          </Card>

          <Card className="p-4">
            <CardHeader
              title="Demandes par zone"
              action={<Dropdown value={period} onChange={setPeriod} options={PERIODS.map(p => ({ key: p.key, label: p.short }))} />}
            />
            <div className="mt-3">
              {view ? <ZoneMap points={view.zones} unplaced={view.unplaced} height={184} /> : <Skeleton className="h-[184px]" />}
            </div>
            {view && <SampleNote show={!view.complete} />}
          </Card>
        </div>

        {/* Tables row */}
        {/* Three columns only when both tables fit without scrolling */}
        <div className="grid grid-cols-1 xl:grid-cols-2 min-[1680px]:grid-cols-[1.4fr_1.4fr_0.95fr] gap-3">
          <Card className="p-4 min-w-0">
            <CardHeader title="Dernières demandes" action={<SeeAll href="/dashboard/demandes" />} />
            <div className="relative mt-3 overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[440px] text-[12px]">
                <thead>
                  <tr className="bg-[#f6f8fc] text-left text-[11.5px] font-semibold text-[#33405a]">
                    <th className="py-2 pl-3 pr-2 rounded-l-lg">#</th>
                    <th className="py-2 px-1.5">Service</th>
                    <th className="py-2 px-1.5">Client</th>
                    <th className="py-2 px-1.5">Localisation</th>
                    <th className="py-2 px-1.5">Statut</th>
                    <th className="py-2 px-1.5">Date</th>
                    <th className="py-2 pr-3 rounded-r-lg"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="py-2.5"><Skeleton className="h-6" /></td></tr>
                  ))}
                  {!loading && data?.reservations.slice(0, 5).map(r => {
                    const st = RESERVATION_STATUS[r.status] ?? { label: r.status, tone: 'gray' as Tone };
                    return (
                      <tr key={r.id} className="border-b border-[#f1f4f9] last:border-0">
                        <td className="py-2 pl-3 pr-2 font-semibold">#{r.id}</td>
                        <td className="py-2 px-1.5"><ServiceCell category={view?.categoryOf.get(r.serviceId)} /></td>
                        <td className="py-2 px-1.5 text-[#33405a] whitespace-nowrap">{r.userInfo?.name ?? '—'}</td>
                        <td className="py-2 px-1.5 text-[#33405a]">{parseLocation(r.location).city ?? '—'}</td>
                        <td className="py-2 px-1.5"><Chip tone={st.tone}>{st.label}</Chip></td>
                        <td className="py-2 px-1.5 text-[#6b7590] whitespace-nowrap">{shortDate(r.createdAt)}</td>
                        <td className="py-2 pr-3 text-right">
                          <Link href="/dashboard/reservations" className="inline-flex p-1 rounded-md text-[#6b7590] hover:bg-[#f3f6fb]" aria-label={`Voir la demande #${r.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && !data?.reservations.length && (
                    <tr><td colSpan={7} className="py-10 text-center text-[#8a94ad]">Aucune demande pour le moment</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 min-w-0">
            <CardHeader title="Derniers techniciens inscrits" action={<SeeAll href="/dashboard/techniciens" />} />
            <div className="relative mt-3 overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[440px] text-[12px]">
                <thead>
                  <tr className="bg-[#f6f8fc] text-left text-[11.5px] font-semibold text-[#33405a]">
                    <th className="py-2 pl-3 pr-2 rounded-l-lg">Technicien</th>
                    <th className="py-2 px-1.5">Service</th>
                    <th className="py-2 px-1.5">Ville</th>
                    <th className="py-2 px-1.5">Statut</th>
                    <th className="py-2 px-1.5">Date</th>
                    <th className="py-2 pr-3 rounded-r-lg"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="py-2.5"><Skeleton className="h-6" /></td></tr>
                  ))}
                  {!loading && data?.workers.map(w => {
                    const st = ACCOUNT_STATUS[w.accountStatus];
                    const serviceId = w.worker?.services?.[0];
                    return (
                      <tr key={w.id} className="border-b border-[#f1f4f9] last:border-0">
                        <td className="py-1.5 pl-3 pr-2">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={w.name} src={w.avatar} />
                            <span className="min-w-0">
                              <span className="block font-semibold truncate max-w-[110px]">{w.name}</span>
                              <span className="block text-[10.5px] text-[#8a94ad]">#USR-{w.id}</span>
                            </span>
                          </span>
                        </td>
                        <td className="py-1.5 px-1.5"><ServiceCell category={serviceId !== undefined ? view?.categoryOf.get(serviceId) : undefined} /></td>
                        <td className="py-1.5 px-1.5 text-[#33405a]">{parseLocation(w.location).city ?? '—'}</td>
                        <td className="py-1.5 px-1.5"><Chip tone={st.tone}>{st.label}</Chip></td>
                        <td className="py-1.5 px-1.5 text-[#6b7590] whitespace-nowrap">{shortDate(w.createdAt)}</td>
                        <td className="py-1.5 pr-3 text-right">
                          <Link href="/dashboard/techniciens" className="inline-flex p-1 rounded-md text-[#6b7590] hover:bg-[#f3f6fb]" aria-label={`Voir ${w.name}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && !data?.workers.length && (
                    <tr><td colSpan={6} className="py-10 text-center text-[#8a94ad]">Aucun technicien inscrit</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 xl:col-span-2 min-[1680px]:col-span-1">
            <CardHeader title="Activité récente" action={<SeeAll href="/dashboard/notifications" />} />
            <ul className="mt-2 divide-y divide-[#f1f4f9] xl:grid xl:grid-cols-2 xl:gap-x-10 xl:divide-y-0 min-[1680px]:block min-[1680px]:divide-y">
              {loading && Array.from({ length: 5 }).map((_, i) => <li key={i} className="py-2"><Skeleton className="h-7" /></li>)}
              {view?.activity.map((a, i) => (
                <li key={i} className="flex items-center gap-2.5 py-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${TONES[a.tone]}`}>
                    <a.icon className="w-3.5 h-3.5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold truncate">{a.title}</span>
                    <span className="block text-[11px] text-[#6b7590] truncate">{a.sub}</span>
                  </span>
                  <span className="text-[11.5px] text-[#8a94ad] shrink-0">{relativeTime(a.at)}</span>
                </li>
              ))}
              {!loading && !view?.activity.length && <li className="py-10 text-center text-[13px] text-[#8a94ad]">Aucune activité récente</li>}
            </ul>
          </Card>
        </div>
      </main>
    </>
  );
}
