'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { adminApi } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [revenue, setRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('fixpro_admin_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);

    // Load sidebar stats asynchronously
    adminApi.getDashboardStats()
      .then(res => {
        setRevenue(res.data.totalRevenue);
        setPendingCount(res.data.pendingApprovals);
      })
      .catch(() => {});
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar revenue={revenue} pendingCount={pendingCount} />
      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
