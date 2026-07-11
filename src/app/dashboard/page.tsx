'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { adminApi } from '@/lib/api';
import type { DashboardStats } from '@/types';
import {
  Users, Wrench, Calendar, CheckCircle, TrendingUp, Clock, AlertCircle,
} from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, bg, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value.toLocaleString('fr-TN')}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble de la plateforme FixPro</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Particuliers" value={stats.totalUsers}
                icon={Users} color="text-blue-600" bg="bg-blue-50"
                sub="Clients inscrits" />
              <StatCard label="Techniciens actifs" value={stats.totalWorkers}
                icon={Wrench} color="text-purple-600" bg="bg-purple-50"
                sub="Comptes approuvés" />
              <StatCard label="Total réservations" value={stats.totalReservations}
                icon={Calendar} color="text-orange-600" bg="bg-orange-50" />
              <StatCard label="Réservations terminées" value={stats.completedReservations}
                icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatCard label="Revenus totaux (TND)" value={stats.totalRevenue.toLocaleString('fr-TN', { minimumFractionDigits: 0 })}
                icon={TrendingUp} color="text-teal-600" bg="bg-teal-50"
                sub="Réservations complétées" />
              <StatCard label="Nouveaux utilisateurs (mois)" value={stats.newUsersThisMonth}
                icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
              <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">En attente d&apos;approbation</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.pendingApprovals}</p>
                  {stats.pendingApprovals > 0 && (
                    <a href="/dashboard/techniciens" className="text-xs text-orange-600 font-medium mt-1 block hover:underline">
                      Voir les demandes →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {stats.pendingApprovals > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">{stats.pendingApprovals} technicien{stats.pendingApprovals > 1 ? 's' : ''}</span>
                  {' '}en attente d&apos;approbation.{' '}
                  <a href="/dashboard/techniciens" className="underline font-medium">Gérer les demandes</a>
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">Impossible de charger les statistiques.</p>
        )}
      </main>
    </>
  );
}
