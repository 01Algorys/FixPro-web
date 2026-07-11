'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { User, UserStats, Pagination, AccountStatus } from '@/types';
import {
  Users, Wrench, UserPlus, Activity, Download, RefreshCw,
  Search, ChevronLeft, ChevronRight, Eye, MoreVertical,
  CheckCircle, XCircle, Clock, Shield,
} from 'lucide-react';

// ── Stat card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; count: number; delta: number;
  icon: React.ElementType; color: string; bg: string;
}
function StatCard({ label, count, delta, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{count.toLocaleString('fr-TN')}</p>
        <p className={`text-xs mt-0.5 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% depuis le mois dernier
        </p>
      </div>
    </div>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  if (role === 'WORKER') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
      <Wrench className="w-3 h-3" /> Technicien
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <Users className="w-3 h-3" /> Particulier
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Actif
    </span>
  );
  if (status === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Inactif
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> En attente
    </span>
  );
}

function VerifBadge({ verified }: { verified: boolean }) {
  if (verified) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle className="w-3 h-3" /> Vérifié
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
      <Clock className="w-3 h-3" /> En attente
    </span>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> Approuvé
    </span>
  );
  if (status === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> Refusé
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
      <Clock className="w-3 h-3" /> En attente
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ user }: { user: User }) {
  if (user.avatar) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
  );
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500'];
  const bg = colors[user.id % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
      {user.name[0]?.toUpperCase()}
    </div>
  );
}

// ── Action dropdown menu ───────────────────────────────────────────────────
interface ActionMenuProps {
  user: User;
  pos: { top: number; left: number };
  loading: boolean;
  onStatusChange: (userId: number, status: AccountStatus) => void;
  onClose: () => void;
}

function ActionMenu({ user, pos, loading, onStatusChange, onClose }: ActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Slight delay so the click that opened the menu doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  // Adjust if menu would overflow the bottom of the viewport
  const menuHeight = 220;
  const top = pos.top + menuHeight > window.innerHeight ? pos.top - menuHeight - 8 : pos.top;

  const items: {
    label: string;
    icon: React.ElementType;
    colorClass: string;
    status: AccountStatus;
    hide: boolean;
  }[] = [
    {
      label: 'Activer le compte',
      icon: CheckCircle,
      colorClass: 'text-green-700 hover:bg-green-50',
      status: 'APPROVED',
      hide: user.accountStatus === 'APPROVED',
    },
    {
      label: 'Mettre en attente',
      icon: Clock,
      colorClass: 'text-orange-600 hover:bg-orange-50',
      status: 'PENDING_APPROVAL',
      hide: user.accountStatus === 'PENDING_APPROVAL',
    },
    {
      label: 'Désactiver le compte',
      icon: XCircle,
      colorClass: 'text-red-600 hover:bg-red-50',
      status: 'REJECTED',
      hide: user.accountStatus === 'REJECTED',
    },
  ];

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top, left: pos.left, zIndex: 9999 }}
      className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in slide-in-from-top-1 duration-100"
    >
      {/* User info header */}
      <div className="px-3 py-2 border-b border-gray-100 mb-1">
        <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>

      {/* View */}
      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <Eye className="w-4 h-4 text-gray-400" /> Voir les détails
      </button>

      <div className="border-t border-gray-100 my-1" />

      {/* Status changes */}
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        Changer le statut
      </p>

      {items.filter(item => !item.hide).map(item => (
        <button
          key={item.status}
          disabled={loading}
          onClick={() => { onStatusChange(user.id, item.status); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${item.colorClass}`}
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <item.icon className="w-4 h-4" />
          }
          {item.label}
        </button>
      ))}

      {/* Worker-specific shortcut label */}
      {user.role === 'WORKER' && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <div className="px-3 py-1.5 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-gray-400" />
            <p className="text-[10px] text-gray-400">
              Approbation actuelle :&nbsp;
              <span className="font-medium text-gray-600">
                {user.accountStatus === 'APPROVED' ? 'Approuvé' : user.accountStatus === 'REJECTED' ? 'Refusé' : 'En attente'}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function UtilisateursPage() {
  const [users, setUsers]             = useState<User[]>([]);
  const [stats, setStats]             = useState<UserStats | null>(null);
  const [pagination, setPagination]   = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Dropdown menu state
  const [openMenu, setOpenMenu]       = useState<{ user: User; pos: { top: number; left: number } } | null>(null);

  // Filters
  const [search, setSearch]           = useState('');
  const [role, setRole]               = useState('ALL');
  const [status, setStatus]           = useState('ALL');
  const [isVerified, setIsVerified]   = useState('ALL');
  const [startDate, setStartDate]     = useState('');
  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(10);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search)             params.search     = search;
      if (role !== 'ALL')     params.role       = role;
      if (status !== 'ALL')   params.status     = status;
      if (isVerified !== 'ALL') params.isVerified = isVerified;
      if (startDate)          params.startDate  = startDate;

      const res = await adminApi.getUsers(params);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [search, role, status, isVerified, startDate, page, limit]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    adminApi.getUserStats().then(res => setStats(res.data)).catch(() => {});
  }, []);

  const resetFilters = () => {
    setSearch(''); setRole('ALL'); setStatus('ALL');
    setIsVerified('ALL'); setStartDate(''); setPage(1);
  };

  const handleStatusChange = async (userId: number, newStatus: AccountStatus) => {
    setActionLoading(userId);
    setOpenMenu(null);
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, accountStatus: newStatus } : u
      ));
    } catch (err) {
      console.error('Status update failed', err);
    }
    setActionLoading(null);
  };

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, user: User) => {
    if (openMenu?.user.id === user.id) { setOpenMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({
      user,
      pos: { top: rect.bottom + 4, left: rect.right - 224 }, // 224 = w-56
    });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end   = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Utilisateurs' }]} />
      <main className="p-6 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez tous les utilisateurs de la plateforme</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" /> Exporter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Ajouter un utilisateur
            </button>
          </div>
        </div>

        {/* Stat cards */}
        {stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Utilisateurs totaux" count={stats.total.count} delta={stats.total.delta}
              icon={Users} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Particuliers" count={stats.particuliers.count} delta={stats.particuliers.delta}
              icon={Users} color="text-green-600" bg="bg-green-50" />
            <StatCard label="Techniciens" count={stats.techniciens.count} delta={stats.techniciens.delta}
              icon={Wrench} color="text-purple-600" bg="bg-purple-50" />
            <StatCard label="Nouveaux ce mois" count={stats.newThisMonth.count} delta={stats.newThisMonth.delta}
              icon={UserPlus} color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="Utilisateurs actifs" count={stats.actifs.count} delta={stats.actifs.delta}
              icon={Activity} color="text-teal-600" bg="bg-teal-50" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">Rôle</label>
              <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="ALL">Tous les rôles</option>
                <option value="USER">Particulier</option>
                <option value="WORKER">Technicien</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">Statut</label>
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="ALL">Tous les statuts</option>
                <option value="APPROVED">Actif</option>
                <option value="PENDING_APPROVAL">En attente</option>
                <option value="REJECTED">Inactif</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">Vérification</label>
              <select value={isVerified} onChange={e => { setIsVerified(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="ALL">Tous</option>
                <option value="true">Vérifié</option>
                <option value="false">Non vérifié</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">Date d&apos;inscription</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            <button onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Utilisateur', 'Rôle', 'Téléphone', 'Email', 'Ville', 'Statut', 'Vérification', 'Approbation', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-gray-400 py-12 text-sm">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">#USR-{user.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>

                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {user.phone ?? '—'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(user.location as { city?: string } | null)?.city ?? '—'}
                    </td>

                    {/* Statut — optimistically updated */}
                    <td className="px-4 py-3">
                      {actionLoading === user.id
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                            <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Mise à jour…
                          </span>
                        : <StatusBadge status={user.accountStatus} />
                      }
                    </td>

                    <td className="px-4 py-3"><VerifBadge verified={user.isVerified} /></td>

                    {/* Approbation */}
                    <td className="px-4 py-3">
                      {user.role === 'WORKER' ? (
                        <div className="flex flex-col gap-1.5">
                          <ApprovalBadge status={user.accountStatus} />
                          {user.accountStatus === 'PENDING_APPROVAL' && (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={actionLoading === user.id}
                                onClick={() => handleStatusChange(user.id, 'APPROVED')}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                              >
                                {actionLoading === user.id
                                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <CheckCircle className="w-3 h-3" />
                                }
                                Approuver
                              </button>
                              <button
                                disabled={actionLoading === user.id}
                                onClick={() => handleStatusChange(user.id, 'REJECTED')}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                              >
                                {actionLoading === user.id
                                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <XCircle className="w-3 h-3" />
                                }
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={e => toggleMenu(e, user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            openMenu?.user.id === user.id
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {pagination.total === 0 ? 'Aucun résultat' : `Affichage de ${start} à ${end} sur ${pagination.total} utilisateurs`}
            </p>

            <div className="flex items-center gap-2">
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} par page</option>)}
              </select>

              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.page <= 1}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                  const tp = pagination.totalPages;
                  const cp = pagination.page;
                  const pages: (number | -1)[] = [];
                  if (tp <= 7) { for (let x = 1; x <= tp; x++) pages.push(x); }
                  else {
                    pages.push(1);
                    if (cp > 3) pages.push(-1);
                    const s = Math.max(2, cp - 1), e2 = Math.min(tp - 1, cp + 1);
                    for (let x = s; x <= e2; x++) pages.push(x);
                    if (cp < tp - 2) pages.push(-1);
                    pages.push(tp);
                  }
                  return pages.map((pp, i) =>
                    pp < 0
                      ? <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                      : <button key={pp} onClick={() => setPage(pp)}
                          className={`w-8 h-8 text-xs rounded-lg transition-colors ${pp === pagination.page ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-200'}`}>
                          {pp}
                        </button>
                  );
                })()}

                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed-position action dropdown — renders outside table overflow */}
      {openMenu && (
        <ActionMenu
          user={openMenu.user}
          pos={openMenu.pos}
          loading={actionLoading === openMenu.user.id}
          onStatusChange={handleStatusChange}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </>
  );
}
