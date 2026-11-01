'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { User, Pagination, AccountStatus, Service } from '@/types';
import {
  Wrench, CheckCircle, XCircle, Clock, Search, ChevronLeft, ChevronRight,
  Eye, Star, RefreshCw, AlertCircle, MoreVertical, Shield,
  PauseCircle, Ban, Trash2, Plus, X,
} from 'lucide-react';

const STATUS_LABEL: Record<AccountStatus, string> = {
  APPROVED: 'Approuvé',
  PENDING_APPROVAL: 'En attente',
  REJECTED: 'Refusé',
  SUSPENDED: 'Suspendu (impayé)',
  BANNED: 'Banni',
};

// ── Badges ─────────────────────────────────────────────────────────────────
function ApprovalBadge({ status }: { status: string }) {
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> Approuvé
    </span>
  );
  if (status === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> Refusé
    </span>
  );
  if (status === 'SUSPENDED') return (
    <span title="Abonnement impayé" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
      <PauseCircle className="w-3 h-3" /> Suspendu
    </span>
  );
  if (status === 'BANNED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
      <Ban className="w-3 h-3" /> Banni
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
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
  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500'];
  const bg = colors[user.id % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
      {user.name[0]?.toUpperCase()}
    </div>
  );
}

// ── Action dropdown ─────────────────────────────────────────────────────────
interface ActionMenuProps {
  user: User;
  pos: { top: number; left: number };
  loading: boolean;
  onStatusChange: (userId: number, status: AccountStatus) => void;
  onDelete: (user: User) => void;
  onClose: () => void;
}

function ActionMenu({ user, pos, loading, onStatusChange, onDelete, onClose }: ActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const menuHeight = 360;
  const top = pos.top + menuHeight > window.innerHeight ? pos.top - menuHeight - 8 : pos.top;

  const items: { label: string; icon: React.ElementType; colorClass: string; status: AccountStatus; hide: boolean }[] = [
    {
      label: user.accountStatus === 'SUSPENDED' || user.accountStatus === 'BANNED'
        ? 'Réactiver le compte'
        : 'Approuver le compte',
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
      label: 'Refuser le compte',
      icon: XCircle,
      colorClass: 'text-red-600 hover:bg-red-50',
      status: 'REJECTED',
      hide: user.accountStatus === 'REJECTED',
    },
    {
      label: 'Suspendre (abonnement impayé)',
      icon: PauseCircle,
      colorClass: 'text-gray-700 hover:bg-gray-100',
      status: 'SUSPENDED',
      hide: user.accountStatus === 'SUSPENDED',
    },
    {
      label: 'Bannir',
      icon: Ban,
      colorClass: 'text-red-700 hover:bg-red-50',
      status: 'BANNED',
      hide: user.accountStatus === 'BANNED',
    },
  ];

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top, left: pos.left, zIndex: 9999 }}
      className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1"
    >
      <div className="px-3 py-2 border-b border-gray-100 mb-1">
        <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>

      <Link href={`/dashboard/techniciens/${user.id}`} onClick={onClose}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <Eye className="w-4 h-4 text-gray-400" /> Voir les détails
      </Link>

      <div className="border-t border-gray-100 my-1" />
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

      <div className="border-t border-gray-100 my-1" />
      <button
        disabled={loading}
        onClick={() => { onClose(); onDelete(user); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" /> Supprimer le compte
      </button>

      <div className="border-t border-gray-100 my-1" />
      <div className="px-3 py-1.5 flex items-center gap-1.5">
        <Shield className="w-3 h-3 text-gray-400" />
        <p className="text-[10px] text-gray-400">
          Statut actuel :&nbsp;
          <span className="font-medium text-gray-600">
            {STATUS_LABEL[user.accountStatus]}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Manage services modal ───────────────────────────────────────────────────
interface ServicesModalProps {
  user: User;
  allServices: Service[];
  loadingServices: boolean;
  saving: boolean;
  onSave: (userId: number, serviceIds: number[]) => void;
  onClose: () => void;
}

function ServicesModal({ user, allServices, loadingServices, saving, onSave, onClose }: ServicesModalProps) {
  const [selected, setSelected] = useState<number[]>(user.worker?.services ?? []);

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Services de {user.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Sélectionnez les services que ce technicien propose</p>
        </div>

        <div className="px-5 py-3 overflow-y-auto flex-1">
          {loadingServices ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : allServices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun service disponible</p>
          ) : (
            <div className="space-y-1">
              {allServices.map(service => (
                <label
                  key={service.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(service.id)}
                    onChange={() => toggle(service.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                  />
                  <span className="flex-1 text-sm text-gray-700">{service.name}</span>
                  <span className="text-xs text-gray-400">{service.category}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(user.id, selected)}
            disabled={saving || loadingServices}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create technician modal ─────────────────────────────────────────────────
interface CreateTechnicianModalProps {
  allServices: Service[];
  loadingServices: boolean;
  onCreated: () => void;
  onClose: () => void;
}

function CreateTechnicianModal({ allServices, loadingServices, onCreated, onClose }: CreateTechnicianModalProps) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [services, setServices] = useState<number[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const toggle = (id: number) => {
    setServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.createTechnician({
        name, email, password, services,
        ...(phone ? { phone } : {}),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Ajouter un technicien</h2>
            <p className="text-xs text-gray-400 mt-0.5">Le compte est créé directement approuvé</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
            <input required minLength={2} value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 …" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe *</label>
            <input required minLength={8} type="text" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="8 caractères minimum" className={inputCls} />
            <p className="text-[11px] text-gray-400 mt-1">À communiquer au technicien pour sa première connexion.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Services</label>
            {loadingServices ? (
              <div className="h-16 bg-gray-100 rounded animate-pulse" />
            ) : allServices.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun service disponible</p>
            ) : (
              <div className="border border-gray-100 rounded-lg max-h-40 overflow-y-auto">
                {allServices.map(service => (
                  <label key={service.id} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={services.includes(service.id)}
                      onChange={() => toggle(service.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                    />
                    <span className="flex-1 text-sm text-gray-700">{service.name}</span>
                    <span className="text-xs text-gray-400">{service.category}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
            Créer le technicien
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function TechniciensPage() {
  const [workers, setWorkers]             = useState<User[]>([]);
  const [pagination, setPagination]       = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [openMenu, setOpenMenu]           = useState<{ user: User; pos: { top: number; left: number } } | null>(null);

  const [servicesUser, setServicesUser]     = useState<User | null>(null);
  const [allServices, setAllServices]       = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [creating, setCreating]             = useState(false);
  const [pageError, setPageError]           = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage]     = useState(1);

  const [pendingCount, setPendingCount]   = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10, role: 'WORKER' };
      if (search)           params.search = search;
      if (status !== 'ALL') params.status = status;
      const res = await adminApi.getUsers(params);
      setWorkers(res.data.users);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  useEffect(() => {
    Promise.all([
      adminApi.getUsers({ role: 'WORKER', status: 'PENDING_APPROVAL', limit: 1 }),
      adminApi.getUsers({ role: 'WORKER', status: 'APPROVED',         limit: 1 }),
      adminApi.getUsers({ role: 'WORKER', status: 'REJECTED',         limit: 1 }),
      adminApi.getUsers({ role: 'WORKER', status: 'SUSPENDED',        limit: 1 }),
    ]).then(([p, a, r, s]) => {
      setPendingCount(p.data.pagination.total);
      setApprovedCount(a.data.pagination.total);
      setRejectedCount(r.data.pagination.total);
      setSuspendedCount(s.data.pagination.total);
    }).catch(() => {});
  }, [workers]);

  const handleStatusChange = async (userId: number, newStatus: AccountStatus) => {
    setActionLoading(userId);
    setOpenMenu(null);
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      setWorkers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: newStatus } : u));
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Échec de la mise à jour du statut');
    }
    setActionLoading(null);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${user.name} ? Cette action est irréversible.`)) return;
    setActionLoading(user.id);
    try {
      await adminApi.deleteUser(user.id);
      await fetchWorkers();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Échec de la suppression');
    }
    setActionLoading(null);
  };

  const loadServices = async () => {
    if (allServices.length > 0) return;
    setLoadingServices(true);
    try {
      const res = await adminApi.getServices({ limit: 100 });
      setAllServices(res.data.services);
    } catch (err) {
      console.error('Failed to load services', err);
    }
    setLoadingServices(false);
  };

  const openCreateModal = () => {
    setCreating(true);
    loadServices();
  };

  const handleCreated = () => {
    setCreating(false);
    fetchWorkers();
  };

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, user: User) => {
    if (openMenu?.user.id === user.id) { setOpenMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({ user, pos: { top: rect.bottom + 4, left: rect.right - 224 } });
  };

  const openServicesModal = (user: User) => {
    setServicesUser(user);
    loadServices();
  };

  const handleSaveServices = async (userId: number, serviceIds: number[]) => {
    setSavingServices(true);
    try {
      await adminApi.updateWorkerServices(userId, serviceIds);
      setWorkers(prev => prev.map(u => u.id === userId
        ? { ...u, worker: u.worker ? { ...u.worker, services: serviceIds } : u.worker }
        : u
      ));
      setServicesUser(null);
    } catch (err) {
      console.error('Failed to save services', err);
    }
    setSavingServices(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const start = (pagination.page - 1) * 10 + 1;
  const end   = Math.min(pagination.page * 10, pagination.total);

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Techniciens' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Techniciens</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez les comptes techniciens et les demandes d&apos;approbation</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter un technicien
          </button>
        </div>

        {pageError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{pageError}</span>
            <button onClick={() => setPageError('')} className="p-0.5 hover:text-red-900"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Action requise
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Approuvés</p>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Refusés</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <PauseCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Suspendus (impayés)</p>
                <p className="text-2xl font-bold text-gray-900">{suspendedCount}</p>
              </div>
            </div>
          </div>
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
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING_APPROVAL">En attente d&apos;approbation</option>
              <option value="APPROVED">Approuvés</option>
              <option value="REJECTED">Refusés</option>
              <option value="SUSPENDED">Suspendus (impayés)</option>
              <option value="BANNED">Bannis</option>
            </select>
            <button onClick={() => { setSearch(''); setStatus('ALL'); setPage(1); }}
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
                  {['Technicien', 'Email', 'Téléphone', 'Ville', 'Note', 'Jobs', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : workers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-400 py-12 text-sm">
                      Aucun technicien trouvé
                    </td>
                  </tr>
                ) : workers.map(w => (
                  <tr key={w.id} className={`hover:bg-gray-50/50 transition-colors ${w.accountStatus === 'PENDING_APPROVAL' ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={w} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{w.name}</p>
                          <p className="text-xs text-gray-400">#USR-{w.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{w.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{w.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(w.location as { city?: string } | null)?.city ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {w.worker ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{w.worker.averageRating.toFixed(1)}</span>
                          <span className="text-gray-400">({w.worker.totalReviews})</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {w.worker?.jobsCompleted ?? 0}
                    </td>

                    {/* Approbation */}
                    <td className="px-4 py-3">
                      {actionLoading === w.id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                          <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Mise à jour…
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <ApprovalBadge status={w.accountStatus} />
                          {w.accountStatus === 'PENDING_APPROVAL' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStatusChange(w.id, 'APPROVED')}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Approuver
                              </button>
                              <button
                                onClick={() => handleStatusChange(w.id, 'REJECTED')}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(w.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/techniciens/${w.id}`} title="Voir les détails"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openServicesModal(w)}
                          title="Modifier les services"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        <button
                          onClick={e => toggleMenu(e, w)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            openMenu?.user.id === w.id
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

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {pagination.total === 0 ? 'Aucun résultat' : `Affichage de ${start} à ${end} sur ${pagination.total} techniciens`}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg ${p === pagination.page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {openMenu && (
        <ActionMenu
          user={openMenu.user}
          pos={openMenu.pos}
          loading={actionLoading === openMenu.user.id}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onClose={() => setOpenMenu(null)}
        />
      )}

      {creating && (
        <CreateTechnicianModal
          allServices={allServices}
          loadingServices={loadingServices}
          onCreated={handleCreated}
          onClose={() => setCreating(false)}
        />
      )}

      {servicesUser && (
        <ServicesModal
          user={servicesUser}
          allServices={allServices}
          loadingServices={loadingServices}
          saving={savingServices}
          onSave={handleSaveServices}
          onClose={() => setServicesUser(null)}
        />
      )}
    </>
  );
}
