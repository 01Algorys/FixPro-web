'use client';

import TopBar from '@/components/layout/TopBar';
import { Construction } from 'lucide-react';

interface StubPageProps {
  title: string;
  subtitle?: string;
  breadcrumb: { label: string; href?: string }[];
  todo?: string;
}

export default function StubPage({ title, subtitle, breadcrumb, todo }: StubPageProps) {
  return (
    <>
      <TopBar breadcrumb={breadcrumb} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 flex flex-col items-center text-center gap-4">
          <Construction className="w-12 h-12 text-gray-300" />
          <div>
            <p className="text-gray-500 font-medium">Page en cours de développement</p>
            {todo && <p className="text-xs text-gray-400 mt-1 max-w-sm">{todo}</p>}
          </div>
        </div>
      </main>
    </>
  );
}
