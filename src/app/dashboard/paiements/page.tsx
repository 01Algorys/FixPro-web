'use client';

import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { TechnicianPayment, PaymentStats, PaymentLog, PaymentAction, Pagination } from '@/types';
import {
  Wallet, Users, Briefcase, Coins, Search, ChevronLeft, ChevronRight, RefreshCw,
  AlertCircle, X, Plus, Minus, RotateCcw, History, ArrowUp, ArrowDown, ArrowUpDown, Pencil,
} from 'lucide-react';

const tnd = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} TND`;

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ACTION_META: Record<PaymentAction, { label: string; cls: string; icon: React.ElementType }> = {
  ADD:    { label: 'Ajout',          cls: 'bg-orange-100 text-orange-700', icon: Plus },
  REDUCE: { label: 'Réduction',      cls: 'bg-green-100 text-green-700',   icon: Minus },
  RESET:  { label: 'Remise à zéro',  cls: 'bg-blue-100 text-blue-700',     icon: RotateCcw },
};

type SortField = 'name' | 'missions' | 'feesGenerated' | 'amountDue' | 'lastPaymentAt';

// ── Avatar ─────────────────────────────────────────────────────────────────
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

function ActionBadge({ action }: { action: PaymentAction }) {
  const meta = ACTION_META[action];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
      <meta.icon className="w-3 h-3" /> {meta.label}
    </span>
  );
}

// ── Adjust balance modal ────────────────────────────────────────────────────
interface AdjustModalProps {
  tech: TechnicianPayment;
  onDone: () => void;
  onClose: () => void;
}

function AdjustModal({ tech, onDone, onClose }: AdjustModalProps) {
  const [action, setAction] = useState<PaymentAction>('REDUCE');
  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const value = parseFloat(amount.replace(',', '.'));
  const preview =
    action === 'RESET' ? 0
    : !Number.isFinite(value) ? tech.amountDue
    : action === 'ADD' ? tech.amountDue + value
    : tech.amountDue - value;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (action !== 'RESET' && (!Number.isFinite(value) || value <= 0)) {
      setError('Saisissez un montant supérieur à 0');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateTechnicianBalance(tech.id, {
        action,
        ...(action !== 'RESET' ? { amount: value } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      setSaving(false);
    }
  };

  const tabs: { action: PaymentAction; label: string; icon: React.ElementType }[] = [
    { action: 'REDUCE', label: 'Réduire',         icon: Minus },
    { action: 'ADD',    label: 'Ajouter',         icon: Plus },
    { action: 'RESET',  label: 'Remettre à zéro', icon: RotateCcw },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Modifier le solde de {tech.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {tech.missions} mission(s) · solde actuel <span className="font-semibold text-gray-700">{tnd(tech.amountDue)}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
            {tabs.map(t => (
              <button
                key={t.action}
                type="button"
                onClick={() => setAction(t.action)}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  action === t.action ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {action !== 'RESET' ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant (TND)</label>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {action === 'REDUCE' && (
                <p className="text-[11px] text-gray-400 mt-1">Par exemple un paiement reçu du technicien.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Le solde de {tnd(tech.amountDue)} sera remis à zéro. Les prochaines missions seront à nouveau comptées.
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (facultatif)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={500}
              placeholder="ex : paiement en espèces"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-500">Nouveau solde</span>
            <span className={`font-semibold ${preview < 0 ? 'text-red-600' : 'text-gray-900'}`}>{tnd(Math.round(preview * 100) / 100)}</span>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">
            Annuler
          </button>
          <button type="submit" disabled={saving || (action === 'RESET' && tech.amountDue === 0)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

// ── History modal (one technician) ──────────────────────────────────────────
function HistoryModal({ tech, onClose }: { tech: TechnicianPayment; onClose: () => void }) {
  const [logs, setLogs]       = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getPaymentLogs({ limit: 100 }, tech.id)
      .then(res => setLogs(res.data.logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tech.id]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Historique — {tech.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {tech.missions} mission(s) × frais = {tnd(tech.feesGenerated)} · ajustements {tnd(tech.feeAdjustment)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucune modification enregistrée</p>
          ) : logs.map(l => (
            <div key={l.id} className="px-5 py-3 flex items-start gap-3">
              <ActionBadge action={l.action} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  {l.action === 'ADD' ? '+' : '−'}{tnd(l.amount)}
                  <span className="text-gray-400"> · {tnd(l.balanceBefore)} → {tnd(l.balanceAfter)}</span>
                </p>
                {l.note && <p className="text-xs text-gray-500 mt-0.5 truncate">{l.note}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">{formatDateTime(l.createdAt)}</p>
                <p className="text-[11px] text-gray-400">par {l.adminInfo?.name ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PaiementsPage() {
  const [stats, setStats]           = useState<PaymentStats | null>(null);
  const [rows, setRows]             = useState<TechnicianPayment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('ALL');
  const [sortBy, setSortBy]       = useState<SortField>('amountDue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage]           = useState(1);

  const [recentLogs, setRecentLogs] = useState<PaymentLog[]>([]);
  const [adjusting, setAdjusting]   = useState<TechnicianPayment | null>(null);
  const [historyOf, setHistoryOf]   = useState<TechnicianPayment | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10, sortBy, sortOrder, status };
      if (search) params.search = search;
      const res = await adminApi.getTechnicianPayments(params);
      setRows(res.data.technicians);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
    setLoading(false);
  }, [page, sortBy, sortOrder, status, search]);

  const fetchSummary = useCallback(() => {
    adminApi.getPaymentStats().then(res => setStats(res.data)).catch(() => {});
    adminApi.getPaymentLogs({ limit: 8 }).then(res => setRecentLogs(res.data.logs)).catch(() => {});
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const handleAdjusted = () => {
    setAdjusting(null);
    fetchRows();
    fetchSummary();
  };

  const SortHeader = ({ field, label, align = 'left' }: { field: SortField; label: string; align?: 'left' | 'right' }) => {
    const active = sortBy === field;
    const Icon = !active ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th className={`text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap text-${align}`}>
        <button onClick={() => handleSort(field)}
          className={`inline-flex items-center gap-1 hover:text-gray-800 ${active ? 'text-gray-800' : ''}`}>
          {label} <Icon className="w-3 h-3" />
        </button>
      </th>
    );
  };

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end   = Math.min(pagination.page * pagination.limit, pagination.total);

  const cards = [
    { label: 'Total dû',               value: stats ? tnd(stats.totalDue) : '—',                icon: Wallet,    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Techniciens à régler',   value: stats ? `${stats.techniciansWithDue} / ${stats.totalTechnicians}` : '—', icon: Users, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Missions facturées',     value: stats ? `${stats.totalMissions}` : '—',           icon: Briefcase, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',
      hint: stats ? `${tnd(stats.feePerMission)} par mission · ${tnd(stats.totalFeesGenerated)} générés` : undefined },
    { label: 'Réglé ce mois',          value: stats ? tnd(stats.collectedThisMonth) : '—',      icon: Coins,     color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100',
      hint: stats ? `${tnd(stats.collectedTotal)} au total` : undefined },
  ];

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Paiements' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-500 text-sm mt-1">Frais de mission dus par les techniciens</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="p-0.5 hover:text-red-900"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map(c => (
            <div key={c.label} className={`bg-white rounded-xl shadow-sm border ${c.border} p-4`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="text-xl font-bold text-gray-900 truncate">{c.value}</p>
                </div>
              </div>
              {c.hint && <p className="text-[11px] text-gray-400 mt-2">{c.hint}</p>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher un technicien..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="ALL">Tous les soldes</option>
              <option value="DUE">Solde à régler</option>
              <option value="CLEAR">À jour</option>
            </select>
            <button onClick={() => { setSearch(''); setStatus('ALL'); setSortBy('amountDue'); setSortOrder('desc'); setPage(1); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <SortHeader field="name" label="Technicien" />
                  <SortHeader field="missions" label="Missions" align="right" />
                  <SortHeader field="feesGenerated" label="Frais générés" align="right" />
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">Ajustements</th>
                  <SortHeader field="amountDue" label="Solde dû" align="right" />
                  <SortHeader field="lastPaymentAt" label="Dernière modif." />
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-12 text-sm">Aucun technicien trouvé</td></tr>
                ) : rows.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} avatar={t.avatar} id={t.id} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.phone ?? t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{t.missions}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">{tnd(t.feesGenerated)}</td>
                    <td className={`px-4 py-3 text-sm text-right whitespace-nowrap ${t.feeAdjustment < 0 ? 'text-green-600' : t.feeAdjustment > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {t.feeAdjustment > 0 ? '+' : ''}{tnd(t.feeAdjustment)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.amountDue > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {tnd(t.amountDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {t.lastPaymentAt ? formatDateTime(t.lastPaymentAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setAdjusting(t)} title="Modifier le solde"
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Modifier
                        </button>
                        <button onClick={() => setHistoryOf(t)} title="Historique"
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {pagination.total === 0 ? 'Aucun résultat' : `Affichage de ${start} à ${end} sur ${pagination.total} techniciens`}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">{pagination.page} / {Math.max(1, pagination.totalPages)}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent changes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Dernières modifications</h2>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune modification enregistrée</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentLogs.map(l => (
                <div key={l.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                  <ActionBadge action={l.action} />
                  <p className="text-sm text-gray-800 flex-1 min-w-[180px]">
                    <span className="font-medium">{l.workerInfo?.name ?? `Technicien #${l.workerId}`}</span>
                    <span className="text-gray-500"> · {l.action === 'ADD' ? '+' : '−'}{tnd(l.amount)} ({tnd(l.balanceBefore)} → {tnd(l.balanceAfter)})</span>
                    {l.note && <span className="text-gray-400"> · {l.note}</span>}
                  </p>
                  <p className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(l.createdAt)} · {l.adminInfo?.name ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {adjusting && (
        <AdjustModal tech={adjusting} onDone={handleAdjusted} onClose={() => setAdjusting(null)} />
      )}
      {historyOf && (
        <HistoryModal tech={historyOf} onClose={() => setHistoryOf(null)} />
      )}
    </>
  );
}
