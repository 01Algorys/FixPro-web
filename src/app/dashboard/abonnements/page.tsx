'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type {
  TechnicianSubscription, SubscriptionStats, SubscriptionLog, SubscriptionAction, SubscriptionState, Pagination,
} from '@/types';
import {
  CheckCircle, Clock, AlertTriangle, CircleSlash, PauseCircle, Coins, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, AlertCircle, Plus, Pencil, History, PlayCircle, ArrowUpDown,
} from 'lucide-react';

const tnd = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} TND`;
const longDate = (d: string | Date) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTime = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Same calendar-month rule as the backend (31 Jan + 1 month = end of February)
const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
};

const STATE_META: Record<SubscriptionState, { label: string; row: string; chip: string; dot: string; icon: React.ElementType }> = {
  ACTIVE:  { label: 'À jour',      row: 'shadow-[inset_4px_0_0_0_#16a34a]',                  chip: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  icon: CheckCircle },
  SOON:    { label: 'Bientôt dû',  row: 'bg-orange-50/60 shadow-[inset_4px_0_0_0_#f97316]',  chip: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', icon: Clock },
  EXPIRED: { label: 'Expiré',      row: 'bg-red-50/70 shadow-[inset_4px_0_0_0_#dc2626]',     chip: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    icon: AlertTriangle },
  NONE:    { label: 'Jamais payé', row: 'bg-red-50/40 shadow-[inset_4px_0_0_0_#f87171]',     chip: 'bg-red-50 text-red-600 border border-red-200', dot: 'bg-red-300', icon: CircleSlash },
};

const ACTION_LABEL: Record<SubscriptionAction, { label: string; cls: string }> = {
  EXTEND:     { label: 'Mois ajoutés',   cls: 'bg-green-100 text-green-700' },
  REDUCE:     { label: 'Mois retirés',   cls: 'bg-orange-100 text-orange-700' },
  SET_DATE:   { label: 'Date modifiée',  cls: 'bg-blue-100 text-blue-700' },
  SUSPEND:    { label: 'Suspendu',       cls: 'bg-gray-200 text-gray-700' },
  REACTIVATE: { label: 'Réactivé',       cls: 'bg-teal-100 text-teal-700' },
};

function dueText(t: Pick<TechnicianSubscription, 'state' | 'daysLeft'>) {
  if (t.state === 'NONE') return 'Aucun paiement enregistré';
  const d = t.daysLeft ?? 0;
  if (t.state === 'EXPIRED') return d === 0 ? "Expiré aujourd'hui" : `Expiré depuis ${Math.abs(d)} j`;
  if (d <= 0) return "Expire aujourd'hui";
  return `${t.state === 'SOON' ? 'Expire dans' : 'Encore'} ${d} j`;
}

function logSummary(l: SubscriptionLog) {
  const range = l.endsBefore || l.endsAfter
    ? ` · ${l.endsBefore ? longDate(l.endsBefore) : '—'} → ${l.endsAfter ? longDate(l.endsAfter) : '—'}` : '';
  if (l.action === 'EXTEND') return `+${l.months} mois${l.amount !== null ? ` · ${tnd(l.amount)} reçus` : ''}${range}`;
  if (l.action === 'REDUCE') return `−${l.months} mois${range}`;
  if (l.action === 'SET_DATE') return `Fin fixée au ${l.endsAfter ? longDate(l.endsAfter) : '—'}`;
  return l.action === 'SUSPEND' ? 'Compte suspendu' : 'Compte réactivé';
}

function Avatar({ name, avatar, id }: { name: string; avatar: string | null; id: number }) {
  if (avatar) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
  );
  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500'];
  return (
    <div className={`w-9 h-9 rounded-full ${colors[id % colors.length]} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Action modal: add months, correct, suspend, reactivate ──────────────────
type Mode = 'EXTEND' | 'CORRECT' | 'SUSPEND' | 'REACTIVATE';

function ActionModal({ tech, mode, onDone, onClose }: { tech: TechnicianSubscription; mode: Mode; onDone: () => void; onClose: () => void }) {
  const [months, setMonths]   = useState(1);
  const [amount, setAmount]   = useState('');
  const [note, setNote]       = useState('');
  const [correct, setCorrect] = useState<'REDUCE' | 'SET_DATE'>(tech.subscriptionEndsAt ? 'REDUCE' : 'SET_DATE');
  const [date, setDate]       = useState(() => (tech.subscriptionEndsAt ?? new Date().toISOString()).slice(0, 10));
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const now = new Date();
  const current = tech.subscriptionEndsAt ? new Date(tech.subscriptionEndsAt) : null;
  const preview =
    mode === 'EXTEND' ? addMonths(current && current > now ? current : now, months)
    : mode === 'CORRECT' && correct === 'REDUCE' && current ? addMonths(current, -months)
    : mode === 'CORRECT' && correct === 'SET_DATE' && date ? new Date(`${date}T23:59:59`)
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const n = note.trim() || undefined;
    let body: Parameters<typeof adminApi.updateSubscription>[1];
    if (mode === 'EXTEND') {
      const value = amount.trim() === '' ? undefined : Number(amount.replace(',', '.'));
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) { setError('Montant invalide'); return; }
      body = { action: 'EXTEND', months, amount: value, note: n };
    } else if (mode === 'CORRECT') {
      body = correct === 'REDUCE' ? { action: 'REDUCE', months, note: n } : { action: 'SET_DATE', date, note: n };
    } else {
      body = { action: mode, note: n };
    }
    setSaving(true);
    try {
      await adminApi.updateSubscription(tech.id, body);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSaving(false);
    }
  };

  const title = {
    EXTEND: `Ajouter des mois · ${tech.name}`,
    CORRECT: `Corriger l'abonnement · ${tech.name}`,
    SUSPEND: `Suspendre ${tech.name}`,
    REACTIVATE: `Réactiver ${tech.name}`,
  }[mode];

  const monthPicker = (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de mois</label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {[1, 3, 6, 12].map(m => (
          <button key={m} type="button" onClick={() => setMonths(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${months === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
            {m} mois
          </button>
        ))}
        <input type="number" min={1} max={36} value={months} onChange={e => setMonths(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
          className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" aria-label="Autre nombre de mois" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fin actuelle : {current ? longDate(current) : 'aucun abonnement'} · {dueText(tech)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {mode === 'EXTEND' && (
            <>
              {monthPicker}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Montant reçu (TND, facultatif)</label>
                <input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="ex : 30"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <p className="text-[11px] text-gray-400">
                {current && current > now
                  ? "L'abonnement est encore en cours : les mois s'ajoutent à la date de fin actuelle."
                  : "L'abonnement est expiré ou n'existe pas : les mois commencent aujourd'hui."}
              </p>
            </>
          )}

          {mode === 'CORRECT' && (
            <>
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
                {(['REDUCE', 'SET_DATE'] as const).map(c => (
                  <button key={c} type="button" disabled={c === 'REDUCE' && !current} onClick={() => setCorrect(c)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md disabled:opacity-40 ${correct === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    {c === 'REDUCE' ? 'Retirer des mois' : 'Fixer la date de fin'}
                  </button>
                ))}
              </div>
              {correct === 'REDUCE' ? monthPicker : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nouvelle date de fin</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              )}
            </>
          )}

          {mode === 'SUSPEND' && (
            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              Le technicien ne pourra plus se connecter ni recevoir de réservations jusqu&apos;à sa réactivation.
            </p>
          )}
          {mode === 'REACTIVATE' && (
            <p className="text-sm text-gray-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
              Le technicien pourra de nouveau se connecter et recevoir des réservations.
              {tech.state !== 'ACTIVE' && tech.state !== 'SOON' && " Son abonnement n'est pas à jour : pensez à ajouter des mois s'il a payé."}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (facultatif)</label>
            <input value={note} onChange={e => setNote(e.target.value)} maxLength={500}
              placeholder={mode === 'SUSPEND' ? 'ex : abonnement impayé depuis 2 mois' : 'ex : paiement en espèces'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          {preview && (
            <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-500">Nouvelle date de fin</span>
              <span className="font-semibold text-gray-900">{longDate(preview)}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50">Annuler</button>
          <button type="submit" disabled={saving}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
              mode === 'SUSPEND' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
            {mode === 'SUSPEND' ? 'Suspendre' : mode === 'REACTIVATE' ? 'Réactiver' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

function LogRow({ l, showName }: { l: SubscriptionLog; showName?: boolean }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_LABEL[l.action].cls}`}>{ACTION_LABEL[l.action].label}</span>
      <p className="text-sm text-gray-800 flex-1 min-w-[200px]">
        {showName && <span className="font-medium">{l.workerInfo?.name ?? `Technicien #${l.workerId}`} · </span>}
        <span className="text-gray-600">{logSummary(l)}</span>
        {l.note && <span className="text-gray-400"> · {l.note}</span>}
      </p>
      <p className="text-xs text-gray-400 whitespace-nowrap">{dateTime(l.createdAt)} · {l.adminInfo?.name ?? '—'}</p>
    </div>
  );
}

function HistoryModal({ tech, onClose }: { tech: TechnicianSubscription; onClose: () => void }) {
  const [logs, setLogs]       = useState<SubscriptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminApi.getSubscriptionLogs({ limit: 100 }, tech.id)
      .then(res => setLogs(res.data.logs)).catch(() => {}).finally(() => setLoading(false));
  }, [tech.id]);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Historique de l&apos;abonnement — {tech.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tech.subscriptionEndsAt ? `Fin : ${longDate(tech.subscriptionEndsAt)}` : 'Aucun abonnement'} · {dueText(tech)}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto divide-y divide-gray-50">
          {loading ? <div className="p-5"><div className="h-10 bg-gray-100 rounded animate-pulse" /></div>
            : logs.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">Aucune modification enregistrée</p>
            : logs.map(l => <LogRow key={l.id} l={l} />)}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AbonnementsPage() {
  const [stats, setStats]           = useState<SubscriptionStats | null>(null);
  const [rows, setRows]             = useState<TechnicianSubscription[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [recent, setRecent]         = useState<SubscriptionLog[]>([]);

  const [search, setSearch]       = useState('');
  const [state, setState]         = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage]           = useState(1);

  const [action, setAction]       = useState<{ tech: TechnicianSubscription; mode: Mode } | null>(null);
  const [historyOf, setHistoryOf] = useState<TechnicianSubscription | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15, state, sortOrder };
      if (search) params.search = search;
      const res = await adminApi.getSubscriptions(params);
      setRows(res.data.technicians);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
    setLoading(false);
  }, [page, state, sortOrder, search]);

  const fetchSummary = useCallback(() => {
    adminApi.getSubscriptionStats().then(res => setStats(res.data)).catch(() => {});
    adminApi.getSubscriptionLogs({ limit: 8 }).then(res => setRecent(res.data.logs)).catch(() => {});
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const onDone = () => {
    setAction(null);
    fetchRows();
    fetchSummary();
  };

  const filterBy = (s: string) => { setState(s); setPage(1); };

  const cards = [
    { key: 'ACTIVE',    label: 'À jour',                          value: stats?.active,    icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
    { key: 'SOON',      label: `Bientôt dû (≤ ${stats?.soonDays ?? 7} j)`, value: stats?.soon, icon: Clock,   color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { key: 'EXPIRED',   label: 'Expirés',                         value: stats?.expired,   icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200' },
    { key: 'NONE',      label: 'Jamais payé',                     value: stats?.none,      icon: CircleSlash,  color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-100' },
    { key: 'SUSPENDED', label: 'Suspendus',                       value: stats?.suspended, icon: PauseCircle,  color: 'text-gray-600',   bg: 'bg-gray-100',  border: 'border-gray-200' },
  ];

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Abonnements' }]} />
      <main className="p-4 sm:p-6 flex-1 min-w-0">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
            <p className="text-gray-500 text-sm mt-1">
              Gérés manuellement : ajoutez des mois quand un technicien paie. Un abonnement expiré ne suspend pas le compte automatiquement.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-2.5 flex items-center gap-3">
            <Coins className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-[11px] text-gray-500">Encaissé ce mois</p>
              <p className="text-base font-bold text-gray-900">{stats ? tnd(stats.collectedThisMonth) : '—'}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* State cards double as filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {cards.map(c => (
            <button key={c.key} onClick={() => filterBy(state === c.key ? 'ALL' : c.key)}
              className={`text-left bg-white rounded-xl shadow-sm border p-3 transition-shadow hover:shadow ${state === c.key ? `${c.border} ring-2 ring-offset-1 ring-blue-500/30` : 'border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}><c.icon className={`w-4 h-4 ${c.color}`} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 truncate">{c.label}</p>
                  <p className="text-xl font-bold text-gray-900">{c.value ?? '—'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher un technicien..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <select value={state} onChange={e => filterBy(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2">
            <option value="ALL">Tous</option>
            <option value="EXPIRED">Expirés</option>
            <option value="NONE">Jamais payé</option>
            <option value="SOON">Bientôt dû</option>
            <option value="ACTIVE">À jour</option>
            <option value="SUSPENDED">Suspendus</option>
          </select>
          <button onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <ArrowUpDown className="w-3.5 h-3.5" /> {sortOrder === 'asc' ? 'Les plus urgents d’abord' : 'Les plus à jour d’abord'}
          </button>
          <button onClick={() => { setSearch(''); setState('ALL'); setSortOrder('asc'); setPage(1); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Technicien', 'Fin de l’abonnement', 'Échéance', 'Compte', 'Dernière modif.', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                )) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-12 text-sm">Aucun technicien</td></tr>
                ) : rows.map(t => {
                  const meta = STATE_META[t.state];
                  const suspended = t.accountStatus === 'SUSPENDED';
                  return (
                    <tr key={t.id} className={meta.row}>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/techniciens/${t.id}`} className="flex items-center gap-3 group">
                          <Avatar name={t.name} avatar={t.avatar} id={t.id} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 truncate">{t.name}</p>
                            <p className="text-xs text-gray-400 truncate">{t.phone ?? t.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {t.subscriptionEndsAt ? longDate(t.subscriptionEndsAt) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.chip}`}>
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} /> {dueText(t)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {suspended
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white"><PauseCircle className="w-3 h-3" /> Suspendu</span>
                          : <span className="text-xs text-gray-500">Actif</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.lastChangeAt ? dateTime(t.lastChangeAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setAction({ tech: t, mode: 'EXTEND' })}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md">
                            <Plus className="w-3.5 h-3.5" /> Mois
                          </button>
                          <button onClick={() => setAction({ tech: t, mode: 'CORRECT' })} title="Corriger"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          {suspended ? (
                            <button onClick={() => setAction({ tech: t, mode: 'REACTIVATE' })} title="Réactiver"
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"><PlayCircle className="w-4 h-4" /></button>
                          ) : (
                            <button onClick={() => setAction({ tech: t, mode: 'SUSPEND' })} title="Suspendre"
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><PauseCircle className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => setHistoryOf(t)} title="Historique"
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"><History className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">{pagination.total} technicien(s)</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-gray-600 px-2">{pagination.page} / {Math.max(1, pagination.totalPages)}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Recent changes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Dernières modifications</h2>
          </div>
          {recent.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Aucune modification enregistrée</p>
            : <div className="divide-y divide-gray-50">{recent.map(l => <LogRow key={l.id} l={l} showName />)}</div>}
        </div>
      </main>

      {action && <ActionModal tech={action.tech} mode={action.mode} onDone={onDone} onClose={() => setAction(null)} />}
      {historyOf && <HistoryModal tech={historyOf} onClose={() => setHistoryOf(null)} />}
    </>
  );
}
