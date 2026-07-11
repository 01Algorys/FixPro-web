'use client';

import TopBar from '@/components/layout/TopBar';
import { Settings, ExternalLink } from 'lucide-react';

export default function ParametresPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

  return (
    <>
      <TopBar breadcrumb={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Paramètres' }]} />
      <main className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 text-sm mt-1">Configuration de l&apos;application</p>
        </div>

        <div className="max-w-xl space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Configuration API</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">URL de l&apos;API</span>
                <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">{apiUrl}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Version Dashboard</span>
                <span className="text-gray-700">1.0.0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">Santé du backend</span>
                <a href={apiUrl.replace('/api', '/health')} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                  Vérifier <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Configuration via variable d&apos;environnement</p>
            <p className="text-xs">Modifiez <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> dans le fichier <code className="bg-amber-100 px-1 rounded">.env.local</code> pour changer l&apos;URL du backend.</p>
          </div>
        </div>
      </main>
    </>
  );
}
