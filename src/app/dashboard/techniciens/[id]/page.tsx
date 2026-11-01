'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import { parseLocation, RESERVATION_STATUS, ACCOUNT_STATUS } from '@/components/dashboard/data';
import type { TechnicianDetails, TechnicianMission, TrackingEntry, ReservationStatus } from '@/types';
import type { TrackMission } from '@/components/zones/TrackMap';
import {
  ArrowLeft, Phone, Mail, Star, Wallet, Briefcase, CheckCircle, MapPin, Navigation, Clock,
  AlertCircle, Search, AlertTriangle, CalendarDays, User as UserIcon, Wrench, FileText,
} from 'lucide-react';

const TrackMap = dynamic(() => import('@/components/zones/TrackMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gray-100 animate-pulse" />,
});

type Tab = 'missions' | 'avis' | 'paiements' | 'profil';

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b', ACCEPTED: '#22c55e', IN_PROGRESS: '#3b82f6', COMPLETED: '#6366f1',
  REJECTED: '#ef4444', CANCELLED: '#ef4444', EXPIRED: '#9ca3af', EN_ROUTE: '#2563eb',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-indigo-100 text-indigo-700',
  REJECTED: 'bg-red-100 text-red-700', CANCELLED: 'bg-red-100 text-red-700', EXPIRED: 'bg-gray-100 text-gray-600',
};

const EVENT_LABEL: Record<string, string> = {
  PENDING: 'Réservation créée', ACCEPTED: 'Acceptée par le technicien', REJECTED: 'Refusée',
  IN_PROGRESS: 'Intervention démarrée', COMPLETED: 'Intervention terminée', CANCELLED: 'Annulée',
  EXPIRED: 'Expirée (sans réponse)', EN_ROUTE: 'Position GPS', ARRIVED: 'Arrivé sur place',
};

const tnd = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} TND`;
const dateTime = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const shortDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const gpsOf = (t: TrackingEntry): [number, number] | null => {
  const l = t.location;
  if (!l) return null;
  const lat = Number(l.lat ?? l.latitude);
  const lng = Number(l.lng ?? l.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

interface TimelineEvent {
  key: string;
  at: string;
  status: string;
  note: string | null;
  gps: number;            // >0 for a run of GPS points collapsed into one row
  rebuilt: boolean;       // derived from the booking's own dates (no history saved at the time)
}

/** Status changes and GPS points in order; GPS runs collapse into one row. Older bookings, saved before
 *  history was recorded, get their steps rebuilt from the booking's own timestamps. */
function buildTimeline(m: TechnicianMission): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const t of m.tracking) {
    const isGps = gpsOf(t) !== null;
    const last = events[events.length - 1];
    if (isGps && last && last.gps > 0) {
      last.gps++;
      continue;
    }
    events.push({ key: `t${t.id}`, at: t.timestamp, status: t.status, note: t.note, gps: isGps ? 1 : 0, rebuilt: false });
  }

  const seen = new Set(events.filter(e => e.gps === 0).map(e => e.status));
  const derive = (status: string, at: string | null, note: string | null = null) => {
    if (at && !seen.has(status)) events.push({ key: `d${status}`, at, status, note, gps: 0, rebuilt: true });
  };
  derive('PENDING', m.createdAt);
  derive('IN_PROGRESS', m.startTime);
  derive('COMPLETED', m.completedAt);
  if (m.status === 'CANCELLED' || m.status === 'EXPIRED') derive(m.status, m.cancelledAt ?? m.updatedAt, m.cancellationReason);
  else if (m.status === 'ACCEPTED' || m.status === 'REJECTED') derive(m.status, m.updatedAt);

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function Stars({ rating }: { rating: number }) {
  const bad = rating < 3;
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? (bad ? 'text-red-500 fill-red-500' : 'text-yellow-400 fill-yellow-400') : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </span>
  );
}

export default function TechnicianDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [data, setData]       = useState<TechnicianDetails | null>(null);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState<Tab>('missions');
  const [selected, setSelected] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReservationStatus>('ALL');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    adminApi.getTechnicianDetails(id)
      .then(res => setData(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Erreur de chargement'));
  }, [id]);

  const missions = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.reservations.filter(r =>
      (statusFilter === 'ALL' || r.status === statusFilter) &&
      (!q || [r.client?.name, r.description, r.service?.name, `#${r.id}`].some(v => v?.toLowerCase().includes(q)))
    );
  }, [data, statusFilter, search]);

  const trackMissions: TrackMission[] = useMemo(() => missions.map(m => {
    const loc = parseLocation(m.location);
    return {
      id: m.id,
      label: `#${m.id} · ${m.client?.name ?? 'Client'} · ${RESERVATION_STATUS[m.status]?.label ?? m.status}`,
      color: STATUS_COLOR[m.status] ?? '#6b7280',
      site: loc.lat !== null && loc.lng !== null ? [loc.lat, loc.lng] : null,
      trail: m.tracking.map(gpsOf).filter((p): p is [number, number] => p !== null),
    };
  }), [missions]);

  const selectedMission = data?.reservations.find(r => r.id === selected) ?? null;

  if (error) {
    return (
      <>
        <TopBar />
        <main className="p-6">
          <Link href="/dashboard/techniciens" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4" /> Techniciens
          </Link>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopBar />
        <main className="p-6 space-y-4">
          <div className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />
          <div className="h-96 bg-white rounded-xl border border-gray-100 animate-pulse" />
        </main>
      </>
    );
  }

  const { profile, worker, balance, stats } = data;
  const accountStatus = ACCOUNT_STATUS[profile.accountStatus];
  const city = parseLocation(profile.location).city;
  const totalGps = stats.gpsPoints;

  const cards = [
    { label: 'Missions', value: `${stats.totalReservations}`, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Terminées', value: `${stats.byStatus.COMPLETED ?? 0}`, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Note moyenne', value: worker.totalReviews ? `${worker.averageRating.toFixed(1)} ★ (${worker.totalReviews})` : '—', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Solde dû', value: tnd(balance?.amountDue ?? 0), icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Points GPS', value: `${totalGps}`, icon: Navigation, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'missions',  label: 'Missions & traces', count: stats.totalReservations },
    { key: 'avis',      label: 'Avis', count: data.reviews.length },
    { key: 'paiements', label: 'Paiements', count: data.paymentLogs.length },
    { key: 'profil',    label: 'Profil' },
  ];

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Techniciens', href: '/dashboard/techniciens' }, { label: profile.name }]} />
      <main className="p-4 sm:p-6 flex-1 min-w-0">
        <Link href="/dashboard/techniciens" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> Techniciens
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {profile.avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
            : <div className="w-16 h-16 rounded-full bg-blue-500 text-white text-2xl font-bold flex items-center justify-center">{profile.name[0]?.toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              {accountStatus && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.accountStatus === 'APPROVED' ? 'bg-green-100 text-green-700'
                  : profile.accountStatus === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700'
                  : profile.accountStatus === 'SUSPENDED' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'
                }`}>{accountStatus.label}</span>
              )}
              <span className="text-xs text-gray-400">#USR-{profile.id}</span>
            </div>
            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
              {profile.phone && <a href={`tel:${profile.phone}`} className="flex items-center gap-1 hover:text-blue-600"><Phone className="w-3.5 h-3.5" /> {profile.phone}</a>}
              {city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {city}</span>}
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Inscrit le {shortDate(profile.createdAt)}</span>
            </div>
            {worker.services.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {worker.services.map(s => (
                  <span key={s.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}><c.icon className={`w-4 h-4 ${c.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500">{c.label}</p>
                <p className="text-base font-bold text-gray-900 truncate">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs text-gray-400">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'missions' && (
          <div className="space-y-4">
            {data.reservationsTruncated && (
              <p className="text-xs text-gray-500">Affichage des {data.reservations.length} missions les plus récentes sur {stats.totalReservations}.</p>
            )}

            {/* Map of every mission and GPS trail */}
            <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[45vh] min-h-[300px]">
              <TrackMap missions={trackMissions} selectedId={selected} onSelect={setSelected} />
              <div className="absolute bottom-3 left-3 z-[500] bg-white/95 rounded-lg shadow border border-gray-200 px-3 py-2 text-[11px] text-gray-600 space-y-1">
                <p className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow" /> Lieu d&apos;intervention (couleur = statut)</p>
                <p className="flex items-center gap-1.5"><span className="w-4 border-t-[3px] border-blue-600" /> Trajet GPS du technicien</p>
              </div>
              {selected !== null && (
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 z-[500] bg-white/95 rounded-lg shadow border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Voir toutes les traces
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Mission list */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0 lg:max-h-[640px]">
                <div className="p-3 border-b border-gray-100 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Client, service, n°…"
                      className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'ALL' | ReservationStatus)}
                    className="w-full border border-gray-200 rounded-lg text-sm px-2 py-1.5">
                    <option value="ALL">Tous les statuts ({stats.totalReservations})</option>
                    {Object.entries(RESERVATION_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label} ({stats.byStatus[k as ReservationStatus] ?? 0})</option>
                    ))}
                  </select>
                </div>
                <div className="overflow-y-auto divide-y divide-gray-50">
                  {missions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Aucune mission</p>
                  ) : missions.map(m => {
                    const gps = m.tracking.filter(t => gpsOf(t)).length;
                    return (
                      <button key={m.id} onClick={() => setSelected(m.id)}
                        className={`w-full text-left px-3 py-2.5 transition-colors ${selected === m.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900 truncate">#{m.id} · {m.client?.name ?? `Client #${m.id}`}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {RESERVATION_STATUS[m.status]?.label ?? m.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{m.service?.name ?? 'Service'} · {shortDate(m.date)} {m.time}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                          {m.emergency && <span className="text-red-600 font-semibold">Urgence</span>}
                          <span>{m.tracking.length} événement(s)</span>
                          {gps > 0 && <span className="flex items-center gap-0.5 text-teal-600"><Navigation className="w-3 h-3" /> {gps} GPS</span>}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mission detail + timeline */}
              <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                {!selectedMission ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-gray-400">
                    <Navigation className="w-8 h-8 mb-2" />
                    <p className="text-sm">Sélectionnez une mission pour voir son historique complet et son trajet</p>
                  </div>
                ) : (
                  <MissionDetail mission={selectedMission} />
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'avis' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {data.reviews.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucun avis</p>
            ) : data.reviews.map(r => (
              <div key={r.id} className={`px-4 py-3 ${r.rating < 3 ? 'bg-red-50 shadow-[inset_4px_0_0_0_#dc2626]' : ''}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    {r.rating < 3 && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded"><AlertTriangle className="w-3 h-3" /> Avis négatif</span>}
                    <span className="text-sm text-gray-700">{r.client?.name ?? `Client #${r.userId}`}</span>
                  </div>
                  <span className="text-xs text-gray-400">{dateTime(r.createdAt)} · mission #{r.reservationId}</span>
                </div>
                {r.comment && <p className={`text-sm mt-1 ${r.rating < 3 ? 'text-red-900 font-medium' : 'text-gray-600'}`}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'paiements' && (
          <div className="space-y-3">
            {balance && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                <span>{balance.missions} mission(s) facturée(s)</span>
                <span>Frais générés : <b className="text-gray-900">{tnd(balance.feesGenerated)}</b></span>
                <span>Ajustements : <b className="text-gray-900">{tnd(balance.feeAdjustment)}</b></span>
                <span>Solde dû : <b className="text-orange-600">{tnd(balance.amountDue)}</b></span>
                <Link href="/dashboard/paiements" className="text-blue-600 hover:underline ml-auto">Modifier le solde →</Link>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {data.paymentLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Aucune modification du solde</p>
              ) : data.paymentLogs.map(l => (
                <div key={l.id} className="px-4 py-3 flex items-center gap-3 flex-wrap text-sm">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    l.action === 'ADD' ? 'bg-orange-100 text-orange-700' : l.action === 'REDUCE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{l.action === 'ADD' ? 'Ajout' : l.action === 'REDUCE' ? 'Réduction' : 'Remise à zéro'}</span>
                  <span className="text-gray-800">{l.action === 'ADD' ? '+' : '−'}{tnd(l.amount)}</span>
                  <span className="text-gray-400">{tnd(l.balanceBefore)} → {tnd(l.balanceAfter)}</span>
                  {l.note && <span className="text-gray-500">· {l.note}</span>}
                  <span className="ml-auto text-xs text-gray-400">{dateTime(l.createdAt)} · {l.adminInfo?.name ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'profil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> Profil professionnel</h2>
              <p className="text-gray-600 whitespace-pre-line">{worker.bio || <span className="text-gray-400">Pas de description</span>}</p>
              <dl className="grid grid-cols-2 gap-y-1.5 pt-2">
                <dt className="text-gray-500">Expérience</dt><dd>{worker.experience ? `${worker.experience} an(s)` : '—'}</dd>
                <dt className="text-gray-500">Tarif horaire</dt><dd>{tnd(worker.hourlyRate)}</dd>
                <dt className="text-gray-500">Missions terminées</dt><dd>{worker.jobsCompleted}</dd>
                <dt className="text-gray-500">Gains déclarés</dt><dd>{tnd(worker.totalEarnings ?? 0)}</dd>
                <dt className="text-gray-500">Position connue</dt>
                <dd>{worker.latitude !== null && worker.longitude !== null ? `${worker.latitude.toFixed(4)}, ${worker.longitude.toFixed(4)}` : '—'}</dd>
              </dl>
              {worker.skills && worker.skills.length > 0 && (
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {worker.skills.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 text-sm">
              <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><Wrench className="w-4 h-4" /> Zone et disponibilités</h2>
              <JsonBlock label="Zone d'intervention" value={worker.serviceArea} />
              <JsonBlock label="Disponibilités" value={worker.availability} />
              <JsonBlock label="Entreprise" value={worker.businessInfo} />
              <JsonBlock label="Certifications" value={worker.certifications} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  const empty = value === null || value === undefined || (typeof value === 'object' && Object.keys(value as object).length === 0);
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      {empty
        ? <p className="text-gray-400">—</p>
        : <pre className="text-xs bg-gray-50 rounded-lg p-2 overflow-x-auto text-gray-700">{JSON.stringify(value, null, 2)}</pre>}
    </div>
  );
}

function MissionDetail({ mission: m }: { mission: TechnicianMission }) {
  const timeline = buildTimeline(m);
  const loc = parseLocation(m.location);
  const address = (m.location as { address?: string } | null)?.address;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Mission #{m.id} · {m.service?.name ?? 'Service'}</h2>
          <p className="text-sm text-gray-500">{shortDate(m.date)} à {m.time} · {m.duration} min{m.emergency ? ' · urgence' : ''}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_BADGE[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {RESERVATION_STATUS[m.status]?.label ?? m.status}
        </span>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-gray-500 flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> Client</dt>
        <dd>{m.client?.name ?? '—'}{m.client?.phone && <a href={`tel:${m.client.phone}`} className="text-blue-600 ml-2">{m.client.phone}</a>}</dd>
        <dt className="text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Adresse</dt>
        <dd>{address ?? loc.city ?? '—'}</dd>
        <dt className="text-gray-500 flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Prix</dt>
        <dd>estimé {tnd(m.estimatedPrice)} · final {tnd(m.actualPrice)}</dd>
      </dl>
      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"><FileText className="w-3.5 h-3.5 inline mr-1 text-gray-400" />{m.description}</p>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Historique complet</h3>
        <ol className="relative border-l-2 border-gray-100 ml-2 space-y-3">
          {timeline.map(e => (
            <li key={e.key} className="ml-4">
              <span className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full border-2 border-white"
                style={{ background: e.gps ? '#14b8a6' : (STATUS_COLOR[e.status] ?? '#6b7280') }} />
              <p className="text-sm text-gray-800">
                {e.gps
                  ? <span className="flex items-center gap-1 text-teal-700"><Navigation className="w-3.5 h-3.5" /> {e.gps} position(s) GPS envoyée(s) — voir le trajet sur la carte</span>
                  : (EVENT_LABEL[e.status] ?? e.status)}
                {e.rebuilt && <span className="ml-1.5 text-[10px] text-gray-400" title="Reconstitué à partir des dates de la réservation">(reconstitué)</span>}
              </p>
              {e.note && e.note !== EVENT_LABEL[e.status] && <p className="text-xs text-gray-500">« {e.note} »</p>}
              <p className="text-[11px] text-gray-400">{dateTime(e.at)}</p>
            </li>
          ))}
        </ol>
      </div>

      {m.notes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Notes</h3>
          <ul className="space-y-1 text-sm">
            {m.notes.map(n => (
              <li key={n.id} className="text-gray-700">
                {n.internal && <span className="text-[10px] uppercase font-bold text-amber-700 mr-1">interne</span>}
                {n.content} <span className="text-xs text-gray-400">· {dateTime(n.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
