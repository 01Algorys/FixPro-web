'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import { ShellContext } from '@/components/layout/shell';
import { adminApi } from '@/lib/api';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fixpro_admin_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);

    // Load sidebar badge asynchronously
    adminApi.getDashboardStats()
      .then(res => setPendingCount(res.data.pendingApprovals))
      .catch(() => {});
  }, [router]);

  // Close the mobile drawer after navigating
  useEffect(() => setSidebarOpen(false), [pathname]);

  const shell = useMemo(() => ({ openSidebar: () => setSidebarOpen(true) }), []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ShellContext.Provider value={shell}>
      <div className={`${jakarta.className} min-h-screen bg-[#f5f7fb] text-[#0b1533]`}>
        <Sidebar pendingCount={pendingCount} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64 min-h-screen flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </ShellContext.Provider>
  );
}
