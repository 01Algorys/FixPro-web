'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, ClipboardList, Wrench, Coins, Star, ArrowUp, ArrowDown, ChevronDown, Check, Download, CalendarRange,
  RefreshCw, Users, UserRound, CalendarCheck, Clock, FileText, TrendingUp, UsersRound, MessageSquareText, Loader2,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { Analytics, AnalyticsPeriod, ReportKind, ReservationStatus } from '@/types';
import { LineChart, Donut, BarChart } from '@/components/dashboard/charts';
import { categoryMeta } from '@/components/dashboard/data';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const dt = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DT`;
const pct = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`;

const PERIODS: { key: AnalyticsPeriod; label: string; prevLabel: string }[] = [
  { key: 'today',     label: "Aujourd'hui",       prevLabel: 'hier' },
  { key: '7d',        label: '7 derniers jours',  prevLabel: 'les 7 jours précédents' },
  { key: '30d',       label: '30 derniers jours', prevLabel: 'les 30 jours précédents' },
  { key: 'month',     label: 'Ce mois',           prevLabel: 'la même période le mois dernier' },
  { key: 'lastMonth', label: 'Mois dernier',      prevLabel: 'le mois précédent' },
  { key: '90d',       label: '3 derniers mois',   prevLabel: 'les 3 mois précédents' },
  { key: 'year',      label: 'Cette année',       prevLabel: "la même période l'an dernier" },
];

// Booking statuses grouped the way an admin reads them
const STATUS_GROUPS: { label: string; color: string; statuses: ReservationStatus[] }[] = [
  { label: 'Terminées', color: '#16a34a', statuses: ['COMPLETED'] },
  { label: 'En cours',  color: '#1d6ff2', statuses: ['IN_PROGRESS'] },
  { label: 'À venir',   color: '#f59e0b', statuses: ['PENDING', 'ACCEPTED'] },
  { label: 'Annulées',  color: '#dc2626', statuses: ['CANCELLED', 'REJECTED', 'EXPIRED'] },
];

const REPORTS: { key: ReportKind; title: string; sub: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'interventions', title: 'Rapport des interventions', sub: 'toutes les demandes et leur statut', icon: FileText,          color: '#1d6ff2', bg: '#e8f0fe' },
  { key: 'finance',       title: 'Rapport financier',         sub: 'frais de mission, abonnements',      icon: TrendingUp,        color: '#16a34a', bg: '#e7f7ee' },
  { key: 'technicians',   title: 'Rapport des techniciens',   sub: 'performance et soldes',              icon: UsersRound,        color: '#7c3aed', bg: '#f1ebfe' },
  { key: 'reviews',       title: 'Rapport des avis',          sub: 'notes et satisfaction',              icon: MessageSquareText, color: '#d18f00', bg: '#fff5dc' },
];

// ─── Small building blocks ──────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#edf1f7] shadow-[0_2px_10px_rgba(15,40,90,0.04)] ${className}`}>
      {children}
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#eef2f8] ${className}`} />;
}

/** Change badge. `invert` for metrics where lower is better (e.g. intervention time). */
function DeltaBadge({ value, unit = '%', invert = false }: { value: number | null | undefined; unit?: string; invert?: boolean }) {
  if (value === null || value === undefined) return <span className="text-[11px] font-semibold text-[#a3adc2]">—</span>;
  const good = invert ? value < 0 : value > 0;
  const bad = invert ? value > 0 : value < 0;
  const Icon = value < 0 ? ArrowDown : ArrowUp;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums whitespace-nowrap ${
        good ? 'bg-[#e7f7ee] text-[#15803d]' : bad ? 'bg-[#fdecec] text-[#b91c1c]' : 'bg-[#f1f4f9] text-[#6b7590]'
      }`}
    >
      {value !== 0 && <Icon className="w-3 h-3" strokeWidth={2.6} />}
      {value > 0 ? '+' : ''}{value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}{unit}
    </span>
  );
}

function PeriodDropdown({ value, onChange }: { value: AnalyticsPeriod; onChange: (v: AnalyticsPeriod) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const current = PERIODS.find(p => p.key === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex min-w-[220px] items-center gap-2 rounded-lg border border-[#e3e8f1] bg-white px-3 py-2 text-[12.5px] font-medium text-[#0b1533] hover:border-[#c9d3e3] transition-colors"
      >
        <CalendarRange className="w-4 h-4 text-[#6b7590]" />
        <span className="flex-1 text-left whitespace-nowrap">Période : {current?.label}</span>
        <ChevronDown className={`w-4 h-4 text-[#8a94ad] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-20 mt-1.5 min-w-full rounded-xl border border-[#edf1f7] bg-white p-1 shadow-[0_14px_40px_rgba(15,40,90,0.16)]">
          {PERIODS.map(p => (
            <li key={p.key}>
              <button
                onClick={() => {
                  onChange(p.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] ${p.key === value ? 'bg-[#e8f0fe] font-semibold text-[#1d6ff2]' : 'hover:bg-[#f3f6fb]'}`}
              >
                <span className="flex-1">{p.label}</span>
                {p.key === value && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon, color, bg, value, label, delta, deltaUnit, sub,
}: { icon: React.ElementType; color: string; bg: string; value: string; label: string; delta: number | null; deltaUnit?: string; sub?: string }) {
  return (
    <Card className="p-4 flex items-center gap-3.5">
      <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[22px] font-extrabold leading-tight tabular-nums whitespace-nowrap">{value}</p>
          <DeltaBadge value={delta} unit={deltaUnit} />
        </div>
        <p className="text-[12.5px] font-medium text-[#33405a]">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-[#8a94ad] truncate">{sub}</p>}
      </div>
    </Card>
  );
}

function CardTitle({ icon: Icon, children, right }: { icon?: React.ElementType; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="flex items-center gap-2 text-[14.5px] font-extrabold">
        {Icon && <Icon className="w-4 h-4 text-[#1d6ff2]" strokeWidth={2.4} />}
        {children}
      </h2>
      {right}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map(i => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-[#6b7590]">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: i.color }} /> {i.label}
        </span>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-[13px] text-[#8a94ad]">{children}</p>;
}

const duration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min` : `${min} min`);

// One-paragraph reading of the period, built from the biggest moves
function summarize(a: Analytics, prevLabel: string) {
  const { revenue, completed, requests, rating } = a.kpis;
  const parts: string[] = [];
  const move = (d: number | null, what: string) => {
    if (d === null) return;
    if (Math.abs(d) < 1) parts.push(`${what} stable`);
    else parts.push(`${what} ${d > 0 ? '+' : ''}${pct(d)}`);
  };
  move(revenue.delta, "chiffre d'affaires");
  move(completed.delta, 'interventions réalisées');
  move(requests.delta, 'demandes');

  const ups = [revenue.delta, completed.delta].filter((d): d is number => d !== null);
  const mood = !ups.length
    ? 'Pas encore assez d’historique pour comparer.'
    : ups.every(d => d >= 5) ? 'Belle croissance sur la période'
    : ups.every(d => d <= -5) ? 'Activité en recul sur la période'
    : 'Activité contrastée sur la période';
  const tail = parts.length ? ` : ${parts.join(', ')} par rapport à ${prevLabel}.` : '';
  const ratingNote =
    rating.value !== null && rating.value < 3.5 ? ` Note moyenne basse (${rating.value.toLocaleString('fr-FR')}/5) : vérifiez les avis récents.` : '';
  const top = a.topServices[0];
  const topNote = top ? ` Service le plus demandé : ${top.name} (${pct(top.share)}).` : '';
  return `${mood}${tail}${topNote}${ratingNote}`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RapportsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState<ReportKind | null>(null);
  const [downloadError, setDownloadError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminApi.getAnalytics({ period })
      .then(res => setData(res.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(load, [load]);

  const download = async (report: ReportKind) => {
    setDownloading(report);
    setDownloadError('');
    try {
      const day = (iso: string) => iso.slice(0, 10);
      const name = data ? `${day(data.range.from)}_${day(new Date(new Date(data.range.to).getTime() - 1).toISOString())}` : period;
      await adminApi.downloadReport(report, { period }, `fixpro-${report}-${name}.csv`);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : 'Téléchargement impossible');
    } finally {
      setDownloading(null);
    }
  };

  const view = useMemo(() => {
    if (!data) return null;
    const slices = STATUS_GROUPS.map(g => ({
      label: g.label,
      color: g.color,
      value: g.statuses.reduce((s, k) => s + (data.byStatus[k] || 0), 0),
    }));
    const statusTotal = slices.reduce((s, x) => s + x.value, 0);
    const topMax = Math.max(1, ...data.topServices.map(s => s.count));
    return { slices, statusTotal, topMax };
  }, [data]);

  const prevLabel = PERIODS.find(p => p.key === period)?.prevLabel ?? 'la période précédente';
  const k = data?.kpis;
  const ind = data?.indicators;

  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Heading */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex w-11 h-11 rounded-xl bg-[#e8f0fe] items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-[#1d6ff2]" strokeWidth={2.4} />
            </span>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Rapports &amp; Analyses</h1>
              <p className="mt-0.5 text-[13px] text-[#6b7590]">
                Suivez les performances de FixPro, analysez votre activité et prenez les bonnes décisions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodDropdown value={period} onChange={setPeriod} />
            <button
              onClick={() => download('summary')}
              disabled={!data || downloading !== null}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1d6ff2] bg-white hover:bg-[#f2f7ff] disabled:opacity-50 px-3.5 py-2 text-[13px] font-semibold text-[#1d6ff2] transition-colors"
            >
              {downloading === 'summary' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exporter le rapport
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
        {downloadError && (
          <div className="rounded-xl border border-[#fde2e2] bg-[#fff6f6] px-4 py-3 text-[13.5px] text-[#b91c1c]">{downloadError}</div>
        )}

        {/* KPIs */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
          {!k ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[84px] rounded-2xl" />)
          ) : (
            <>
              <KpiCard icon={ClipboardList} color="#1d6ff2" bg="#e8f0fe" value={fmt(k.requests.value)} label="Demandes reçues" delta={k.requests.delta} />
              <KpiCard icon={Wrench} color="#7c3aed" bg="#f1ebfe" value={fmt(k.completed.value)} label="Interventions réalisées" delta={k.completed.delta} />
              <KpiCard
                icon={Coins} color="#16a34a" bg="#e7f7ee" value={dt(k.revenue.value)} label="Chiffre d'affaires" delta={k.revenue.delta}
                sub={`${dt(k.revenue.fees)} frais · ${dt(k.revenue.subscriptions)} abonnements`}
              />
              <KpiCard
                icon={Star} color="#d18f00" bg="#fff5dc"
                value={k.rating.value !== null ? `${k.rating.value.toLocaleString('fr-FR')} / 5` : '—'}
                label="Note moyenne" delta={k.rating.delta} deltaUnit=""
                sub={`${fmt(k.rating.count)} avis sur la période`}
              />
            </>
          )}
        </div>

        {/* Timeline · statuses · top services */}
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr] gap-4 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
          <Card className="p-5 md:col-span-2 xl:col-span-1 min-w-0">
            <CardTitle right={<Legend items={[{ label: 'Demandes', color: '#93b8f8' }, { label: 'Terminées', color: '#1d6ff2' }]} />}>
              Évolution des interventions
            </CardTitle>
            {!data ? (
              <Skeleton className="h-[230px]" />
            ) : data.timeline.length < 2 ? (
              <div className="flex h-[230px] items-center justify-center gap-10 text-center">
                <div><p className="text-[30px] font-extrabold tabular-nums">{fmt(data.timeline[0]?.requests ?? 0)}</p><p className="text-[12px] text-[#6b7590]">demandes</p></div>
                <div><p className="text-[30px] font-extrabold tabular-nums text-[#1d6ff2]">{fmt(data.timeline[0]?.completed ?? 0)}</p><p className="text-[12px] text-[#6b7590]">terminées</p></div>
              </div>
            ) : (
              <LineChart
                labels={data.timeline.map(t => t.label)}
                series={[
                  { name: 'Terminées', color: '#1d6ff2', values: data.timeline.map(t => t.completed) },
                  { name: 'Demandes', color: '#93b8f8', values: data.timeline.map(t => t.requests) },
                ]}
              />
            )}
          </Card>

          <Card className="p-5 min-w-0">
            <CardTitle>Interventions par statut</CardTitle>
            {!view ? (
              <Skeleton className="h-[230px]" />
            ) : view.statusTotal === 0 ? (
              <Empty>Aucune demande sur la période.</Empty>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-6 py-2">
                <Donut slices={view.slices} centerLabel={view.statusTotal > 1 ? 'Demandes' : 'Demande'} size={168} />
                <ul className="space-y-2.5">
                  {view.slices.map(s => (
                    <li key={s.label} className="flex items-start gap-2.5">
                      <span className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <div className="leading-tight">
                        <p className="text-[13px] font-semibold">{s.label}</p>
                        <p className="text-[12px] text-[#6b7590] tabular-nums">
                          {pct(view.statusTotal ? (s.value / view.statusTotal) * 100 : 0)} ({fmt(s.value)})
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="p-5 min-w-0">
            <CardTitle>Top services</CardTitle>
            {!data || !view ? (
              <Skeleton className="h-[230px]" />
            ) : data.topServices.length === 0 ? (
              <Empty>Aucune demande sur la période.</Empty>
            ) : (
              <ul className="space-y-3.5">
                {data.topServices.slice(0, 6).map(s => {
                  const meta = categoryMeta(s.key);
                  const color = s.color || meta?.color || '#64748b';
                  const Icon = meta?.icon;
                  return (
                    <li key={s.key} className="grid grid-cols-[18px_minmax(80px,auto)_1fr_auto] items-center gap-2.5">
                      {Icon ? <Icon className="w-[18px] h-[18px]" style={{ color }} /> : <Wrench className="w-4 h-4" style={{ color }} />}
                      <span className="text-[13px] font-medium truncate">{s.name}</span>
                      <span className="h-2 rounded-full bg-[#eef2f8] overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${(s.count / view.topMax) * 100}%`, backgroundColor: color }} />
                      </span>
                      <span className="text-[12px] tabular-nums text-[#33405a] whitespace-nowrap">
                        <b className="font-bold">{fmt(s.count)}</b> <span className="text-[#8a94ad]">({pct(s.share)})</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Revenue · key indicators */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-4">
          <Card className="p-5 min-w-0">
            <CardTitle
              icon={Coins}
              right={<Legend items={[{ label: `Frais de mission (${data?.range.missionFee ?? 2} DT)`, color: '#1d6ff2' }, { label: 'Abonnements', color: '#7fb0ff' }]} />}
            >
              Chiffre d&apos;affaires (DT)
            </CardTitle>
            {!data ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <>
                <BarChart
                  labels={data.revenueByMonth.map(m => m.label)}
                  series={[
                    { name: 'Frais de mission', color: '#1d6ff2', values: data.revenueByMonth.map(m => m.fees) },
                    { name: 'Abonnements', color: '#7fb0ff', values: data.revenueByMonth.map(m => m.subscriptions) },
                  ]}
                  format={n => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                  highlightLast
                />
                <p className="mt-2 text-[11px] text-[#8a94ad]">
                  6 derniers mois · frais générés par les missions acceptées et paiements d&apos;abonnement saisis.
                </p>
              </>
            )}
          </Card>

          <Card className={`p-5 min-w-0 transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
            <CardTitle icon={BarChart3}>Indicateurs clés</CardTitle>
            {!ind ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <ul className="divide-y divide-[#edf1f7] rounded-xl border border-[#edf1f7]">
                {[
                  {
                    icon: Users, label: 'Techniciens actifs', value: fmt(ind.activeTechnicians),
                    extra: `${fmt(ind.newTechnicians.value)} nouveau${ind.newTechnicians.value > 1 ? 'x' : ''}`, delta: ind.newTechnicians.delta,
                  },
                  {
                    icon: UserRound, label: 'Clients inscrits', value: fmt(ind.clients),
                    extra: `${fmt(ind.newClients.value)} nouveau${ind.newClients.value > 1 ? 'x' : ''}`, delta: ind.newClients.delta,
                  },
                  {
                    icon: CalendarCheck, label: 'Taux de réalisation', value: ind.completionRate !== null ? pct(ind.completionRate) : '—',
                    extra: 'terminées / clôturées', delta: null as number | null,
                  },
                  {
                    icon: Clock, label: "Temps moyen d'intervention", value: ind.avgDurationMinutes !== null ? duration(ind.avgDurationMinutes) : '—',
                    extra: 'du début à la fin', delta: null as number | null,
                  },
                ].map(row => (
                  <li key={row.label} className="flex items-center gap-3 px-4 py-3">
                    <row.icon className="w-[18px] h-[18px] text-[#1d6ff2] shrink-0" strokeWidth={2.1} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{row.label}</p>
                      <p className="text-[11px] text-[#8a94ad]">{row.extra}</p>
                    </div>
                    <span className="text-[16px] font-extrabold tabular-nums whitespace-nowrap">{row.value}</span>
                    <span className="w-[68px] text-right">{row.delta !== null && <DeltaBadge value={row.delta} />}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Downloadable reports · overall reading */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
          <Card className="p-5 min-w-0">
            <CardTitle icon={FileText}>Rapports disponibles</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {REPORTS.map(r => (
                <button
                  key={r.key}
                  onClick={() => download(r.key)}
                  disabled={downloading !== null}
                  className="group relative rounded-xl border border-[#edf1f7] p-4 text-left hover:border-[#c9d8f5] hover:shadow-[0_6px_18px_rgba(15,40,90,0.08)] disabled:opacity-60 transition-all"
                >
                  <span className="flex items-start justify-between">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: r.bg }}>
                      <r.icon className="w-[18px] h-[18px]" style={{ color: r.color }} strokeWidth={2.2} />
                    </span>
                    {downloading === r.key
                      ? <Loader2 className="w-4 h-4 text-[#1d6ff2] animate-spin" />
                      : <Download className="w-4 h-4 text-[#1d6ff2] opacity-70 group-hover:opacity-100" />}
                  </span>
                  <span className="mt-3 block text-[13px] font-bold leading-snug">{r.title}</span>
                  <span className="block text-[11.5px] text-[#6b7590]">{r.sub}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[#8a94ad]">Fichiers CSV (Excel) pour la période sélectionnée.</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-[#eef4ff] to-white">
            <h2 className="flex items-center gap-2 text-[14.5px] font-extrabold">
              <TrendingUp className="w-5 h-5 text-[#1d6ff2]" strokeWidth={2.4} /> Analyse globale
            </h2>
            {!data ? (
              <Skeleton className="mt-3 h-16" />
            ) : (
              <p className="mt-2.5 text-[13px] leading-relaxed text-[#33405a]">{summarize(data, prevLabel)}</p>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
