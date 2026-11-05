'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BadgeCheck, CheckCircle, FileCheck2, RefreshCw, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { VerificationDocuments } from '@/types';

const LABELS: Record<string, string> = {
  CIN_FRONT: 'CIN, recto',
  CIN_BACK: 'CIN, verso',
  SELFIE: 'Selfie avec la CIN',
  PROOF: "Preuve d'activité",
};

const BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'À vérifier', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Validé', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Refusé', cls: 'bg-red-100 text-red-700' },
};

// Identity documents sent at sign-up. Files are private: links last 10 minutes,
// so they are fetched when this card opens and on "Actualiser".
export default function TechnicianDocuments({ userId, pending, onApproved }: { userId: number; pending: boolean; onApproved: () => void }) {
  const [data, setData] = useState<VerificationDocuments | null>(null);
  const [error, setError] = useState('');
  const [refusing, setRefusing] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError('');
    adminApi.getUserDocuments(userId)
      .then(res => setData(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Impossible de charger les documents'));
  }, [userId]);

  useEffect(load, [load]);

  const refuse = async (documentId: number) => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await adminApi.rejectUserDocument(userId, documentId, reason.trim());
      setRefusing(null);
      setReason('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du refus');
    }
    setBusy(false);
  };

  const approve = async () => {
    setBusy(true);
    try {
      await adminApi.approveUser(userId);
      onApproved();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'approbation");
    }
    setBusy(false);
  };

  const documents = data?.documents ?? [];

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><FileCheck2 className="w-4 h-4" /> Documents de vérification</h2>
          {data && !data.complete && (
            <p className="text-xs text-amber-700 mt-0.5">
              {data.missing.length > 0 ? `Manquants : ${data.missing.map(t => LABELS[t] ?? t).join(', ')}` : 'En attente du nouvel envoi par le technicien'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          {pending && (
            <button
              onClick={approve}
              disabled={busy || !data?.complete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <BadgeCheck className="w-4 h-4" /> Approuver le compte
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {data && documents.length === 0 ? (
        <p className="text-sm text-gray-500">
          {pending ? "Aucun document reçu pour l'instant." : 'Aucun document : ce compte a été approuvé sans documents.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {documents.map(doc => {
            const badge = BADGE[doc.status];
            return (
              <div key={doc.id} className="border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer" title="Ouvrir en grand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={doc.url} alt={LABELS[doc.type] ?? doc.type} className="w-full h-36 object-cover bg-gray-100" />
                  </a>
                ) : <div className="h-36 bg-gray-100" />}
                <div className="p-2.5 space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{LABELS[doc.type] ?? doc.type}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${badge.cls}`}>{badge.label}</span>
                  </div>
                  {doc.rejectionReason && doc.status === 'REJECTED' && (
                    <p className="text-xs text-red-700">{doc.rejectionReason}</p>
                  )}
                  {pending && doc.status === 'PENDING' && (refusing === doc.id ? (
                    <div className="space-y-1.5">
                      <input
                        autoFocus
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        maxLength={300}
                        placeholder="Motif (vu par le technicien)"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => refuse(doc.id)} disabled={busy || !reason.trim()} className="flex-1 px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-md disabled:opacity-50">Refuser</button>
                        <button onClick={() => { setRefusing(null); setReason(''); }} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded-md">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setRefusing(doc.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                      <XCircle className="w-3.5 h-3.5" /> Refuser ce document
                    </button>
                  ))}
                  {doc.status === 'APPROVED' && <p className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Vérifié</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
