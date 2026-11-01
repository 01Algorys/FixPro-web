'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import { parseLocation, RESERVATION_STATUS, startOfDay, addDays } from '@/components/dashboard/data';
import type { ZoneReservation, ZoneTechnician } from '@/types';
import type { BaseLayer, MapPoint, MapTechnician } from '@/components/zones/ZonesMap';
import { Flame, MapPin, Wrench, Map as MapIcon, Satellite, Moon, CalendarDays, AlertCircle, X } from 'lucide-react';

// Leaflet touches `window`, so the map only renders in the browser
const ZonesMap = dynamic(() => import('@/components/zones/ZonesMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gray-100 animate-pulse" />,
});

type Preset = '7d' | '30d' | '90d' | 'month' | 'all' | 'custom';

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d',     label: '7 jours' },
  { key: '30d',    label: '30 jours' },
  { key: '90d',    label: '90 jours' },
  { key: 'month',  label: 'Ce mois' },
  { key: 'all',    label: 'Tout' },
  { key: 'custom', label: 'Personnalisé' },
];

const BASES: { key: BaseLayer; label: string; icon: React.ElementType }[] = [
  { key: 'plan',      label: 'Plan',      icon: MapIcon },
  { key: 'satellite', label: 'Satellite', icon: Satellite },
  { key: 'sombre',    label: 'Sombre',    icon: Moon },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b', ACCEPTED: '#22c55e', IN_PROGRESS: '#3b82f6', COMPLETED: '#6366f1',
  REJECTED: '#ef4444', CANCELLED: '#ef4444', EXPIRED: '#9ca3af',
};


const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function presetRange(p: Preset): { from: Date | null; to: Date | null } {
  const today = startOfDay(new Date());
  if (p === '7d')    return { from: addDays(today, -6), to: null };
  if (p === '30d')   return { from: addDays(today, -29), to: null };
  if (p === '90d')   return { from: addDays(today, -89), to: null };
  if (p === 'month') return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: null };
  return { from: null, to: null };
}

export default function ZonesPage() {
  const [preset, setPreset]   = useState<Preset>('30d');
  const [from, setFrom]       = useState(toInputDate(addDays(new Date(), -29)));
  const [to, setTo]           = useState(toInputDate(new Date()));
  const [status, setStatus]   = useState('ALL');
  const [category, setCategory] = useState('ALL');

  const [base, setBase]                 = useState<BaseLayer>('plan');
  const [showHeat, setShowHeat]         = useState(true);
  const [showPoints, setShowPoints]     = useState(false);
  const [showTechnicians, setShowTechs] = useState(true);

  const [categoryLabel, setCategoryLabel] = useState<Record<string, string>>({});
  const [reservations, setReservations] = useState<ZoneReservation[]>([]);
  const [technicians, setTechnicians]   = useState<ZoneTechnician[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const fetchZones = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (preset === 'custom') {
      if (from) params.startDate = new Date(`${from}T00:00:00`).toISOString();
      if (to)   params.endDate   = new Date(`${to}T23:59:59`).toISOString();
    } else {
      const r = presetRange(preset);
      if (r.from) params.startDate = r.from.toISOString();
    }
    if (status !== 'ALL') params.status = status;
    try {
      const res = await adminApi.getZones(params);
      setReservations(res.data.reservations);
      setTechnicians(res.data.technicians);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
    setLoading(false);
  }, [preset, from, to, status]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  useEffect(() => {
    adminApi.getCategories()
      .then(res => setCategoryLabel(Object.fromEntries(res.data.map(c => [c.key, c.name]))))
      .catch(() => {});
  }, []);

  // Resolve each booking's free-form location to coordinates (or a known city's centre)
  const located = useMemo(() => {
    const rows = category === 'ALL' ? reservations : reservations.filter(r => r.category === category);
    const points: (MapPoint & { city: string | null })[] = [];
    let unplaced = 0;
    for (const r of rows) {
      const loc = parseLocation(r.location);
      if (loc.lat === null || loc.lng === null) { unplaced++; continue; }
      points.push({
        id: r.id,
        lat: loc.lat,
        lng: loc.lng,
        city: loc.city,
        color: STATUS_COLOR[r.status] ?? '#6b7280',
        label: `Réservation #${r.id}${r.emergency ? ' · urgence' : ''}`,
        sub: `${new Date(r.date).toLocaleDateString('fr-FR')} · ${RESERVATION_STATUS[r.status]?.label ?? r.status}${r.category ? ` · ${categoryLabel[r.category] ?? r.category}` : ''}`,
      });
    }
    return { points, unplaced, total: rows.length };
  }, [reservations, category, categoryLabel]);

  const mapTechnicians: MapTechnician[] = useMemo(() => technicians.map(t => ({
    id: t.id,
    name: t.name,
    lat: t.lat,
    lng: t.lng,
    active: t.accountStatus === 'APPROVED',
    sub: `${t.jobsCompleted} mission(s) · ${t.averageRating.toFixed(1)}★${t.accountStatus !== 'APPROVED' ? ` · ${t.accountStatus}` : ''}`,
  })), [technicians]);

  const topCities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of located.points) {
      const key = p.city ?? 'Autre';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [located.points]);
  const maxCity = topCities[0]?.[1] ?? 1;

  const LayerToggle = ({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: React.ElementType; label: string }) => (
    <button onClick={onClick} aria-pressed={on} title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}>
      <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: "Zones d'intervention" }]} />
      <main className="p-4 sm:p-6 flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Zones d&apos;intervention</h1>
          <p className="text-gray-500 text-sm mt-1">Où ont lieu les interventions, et où sont les techniciens</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => setPreset(p.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  preset === p.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {p.label}
              </button>
            ))}
            {preset === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
                  className="border border-gray-200 rounded-lg text-xs px-2 py-1.5" aria-label="Du" />
                <span className="text-xs text-gray-400">→</span>
                <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)}
                  className="border border-gray-200 rounded-lg text-xs px-2 py-1.5" aria-label="Au" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="border border-gray-200 rounded-lg text-xs px-2 py-1.5">
              <option value="ALL">Tous les statuts</option>
              {Object.entries(RESERVATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="border border-gray-200 rounded-lg text-xs px-2 py-1.5">
              <option value="ALL">Tous les métiers</option>
              {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <span className="text-xs text-gray-500 ml-auto">
              {loading ? 'Chargement…' : `${located.points.length} intervention(s) sur la carte`}
              {!loading && located.unplaced > 0 && ` · ${located.unplaced} sans localisation`}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Map */}
          <div className="relative lg:flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[60vh] min-h-[360px] lg:h-[calc(100vh-260px)] lg:min-h-[520px]">
            <ZonesMap
              base={base}
              showHeat={showHeat}
              showPoints={showPoints}
              showTechnicians={showTechnicians}
              points={located.points}
              technicians={mapTechnicians}
            />

            {/* View controls, over the map */}
            <div className="absolute top-3 right-3 z-[500] flex flex-col items-end gap-2">
              <div className="flex bg-white/95 backdrop-blur rounded-lg shadow border border-gray-200 p-0.5">
                {BASES.map(b => (
                  <button key={b.key} onClick={() => setBase(b.key)} title={b.label}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                      base === b.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <b.icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{b.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-1.5 bg-white/95 backdrop-blur rounded-lg shadow border border-gray-200 p-1.5">
                <LayerToggle on={showHeat}        onClick={() => setShowHeat(v => !v)}   icon={Flame}  label="Chaleur" />
                <LayerToggle on={showPoints}      onClick={() => setShowPoints(v => !v)} icon={MapPin} label="Interventions" />
                <LayerToggle on={showTechnicians} onClick={() => setShowTechs(v => !v)}  icon={Wrench} label="Techniciens" />
              </div>
            </div>

            {showHeat && (
              <div className="absolute bottom-3 left-3 z-[500] bg-white/95 backdrop-blur rounded-lg shadow border border-gray-200 px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-500 mb-1">Densité d&apos;interventions</p>
                <div className="h-2 w-36 rounded-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#22c55e,#eab308,#f97316,#dc2626)' }} />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>faible</span><span>forte</span></div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <aside className="lg:w-72 shrink-0 space-y-4">
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Interventions</p>
                <p className="text-xl font-bold text-gray-900">{located.total}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Techniciens localisés</p>
                <p className="text-xl font-bold text-gray-900">{technicians.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Zones actives</p>
                <p className="text-xl font-bold text-gray-900">{topCities.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Zones les plus demandées</h2>
              {topCities.length === 0 ? (
                <p className="text-xs text-gray-400">Aucune intervention sur la période</p>
              ) : (
                <ul className="space-y-2.5">
                  {topCities.map(([city, count]) => (
                    <li key={city}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{city}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full" style={{ width: `${(count / maxCity) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showPoints && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Légende</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(RESERVATION_STATUS).map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[k] }} /> {v.label}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-700 bg-white" /> Technicien
                  </span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
