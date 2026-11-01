'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, X, User as UserIcon, Phone, MapPin, CalendarDays, Clock,
  FileText, Wrench, Siren, Coins, ExternalLink, ImageOff,
} from 'lucide-react';
import type { Reservation, ReservationStatus } from '@/types';
import { categoryMeta, parseLocation } from './data';

// Shared pieces for the Interventions and Réservations pages

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#edf1f7] shadow-[0_2px_10px_rgba(15,40,90,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#eef2f8] ${className}`} />;
}

// ─── Status ─────────────────────────────────────────────────────────────────

export const STATUS: Record<ReservationStatus, { label: string; cls: string; dot: string }> = {
  PENDING:     { label: 'En attente',      cls: 'bg-[#fff4d6] text-[#a16207]', dot: '#f59e0b' },
  ACCEPTED:    { label: 'Confirmée',       cls: 'bg-[#e3f6ea] text-[#15803d]', dot: '#16a34a' },
  IN_PROGRESS: { label: 'En intervention', cls: 'bg-[#e6efff] text-[#1d4ed8]', dot: '#1d6ff2' },
  COMPLETED:   { label: 'Terminée',        cls: 'bg-[#efeafe] text-[#6d28d9]', dot: '#7c3aed' },
  CANCELLED:   { label: 'Annulée',         cls: 'bg-[#fde8e8] text-[#b91c1c]', dot: '#dc2626' },
  REJECTED:    { label: 'Refusée',         cls: 'bg-[#fde8e8] text-[#b91c1c]', dot: '#ef4444' },
  EXPIRED:     { label: 'Expirée',         cls: 'bg-[#f1f4f9] text-[#5b6680]', dot: '#94a3b8' },
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-[#f1f4f9] text-[#5b6680]' };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${s.cls}`}>{s.label}</span>;
}

// ─── People, services, places ───────────────────────────────────────────────

const AVATAR_TONES = ['#e8f0fe:#1d6ff2', '#fde8ef:#db2777', '#e3f6ea:#15803d', '#efeafe:#7c3aed', '#e0f2fe:#0369a1', '#fff1e0:#c2410c'];

export function Avatar({ name, src, size = 28 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  const [bg, fg] = AVATAR_TONES[name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length].split(':');
  return (
    <span
      className="rounded-full font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize: size * 0.42 }}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  );
}

export function ServiceIcon({ category, className = 'w-[18px] h-[18px]' }: { category?: string; className?: string }) {
  const meta = categoryMeta(category);
  if (!meta) return <Wrench className={`${className} text-[#64748b]`} />;
  return <meta.icon className={className} style={{ color: meta.color }} />;
}

/** Category label for a reservation, falling back to the service name */
export const serviceLabel = (r: Reservation, names: Record<string, string> = {}) => {
  const key = r.serviceInfo?.category;
  return (key && (names[key] || categoryMeta(key)?.label)) || r.serviceInfo?.name || 'Service';
};

/** "Address, City" for display, from the free-form location JSON */
export function placeOf(r: Reservation) {
  const loc = (r.location && typeof r.location === 'object' ? r.location : {}) as Record<string, unknown>;
  const parsed = parseLocation(r.location);
  const address = typeof loc.address === 'string' ? loc.address.trim() : '';
  const city = parsed.city;
  const line = address ? (city && !address.toLowerCase().includes(city.toLowerCase()) ? `${address}, ${city}` : address) : city || '—';
  return { line, city, lat: parsed.lat, lng: parsed.lng };
}

export const requestRef = (id: number) => `#DM-${String(id).padStart(4, '0')}`;

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// ─── Dropdown filter ────────────────────────────────────────────────────────

export function FilterSelect<T extends string>({
  icon: Icon, label, value, options, onChange,
}: { icon: React.ElementType; label: string; value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const current = options.find(o => o.key === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-[#e3e8f1] bg-white px-3 py-2 text-[12.5px] font-medium text-[#0b1533] hover:border-[#c9d3e3] shadow-[0_1px_2px_rgba(15,40,90,0.04)] transition-colors"
      >
        <Icon className="w-4 h-4 text-[#5b6680]" />
        <span className="whitespace-nowrap">{label} : {current?.label}</span>
        <ChevronDown className={`w-4 h-4 text-[#8a94ad] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-30 mt-1.5 max-h-72 min-w-full overflow-y-auto rounded-xl border border-[#edf1f7] bg-white p-1 shadow-[0_14px_40px_rgba(15,40,90,0.16)]">
          {options.map(o => (
            <li key={o.key}>
              <button
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] ${o.key === value ? 'bg-[#e8f0fe] font-semibold text-[#1d6ff2]' : 'hover:bg-[#f3f6fb]'}`}
              >
                <span className="flex-1">{o.label}</span>
                {o.key === value && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export function Pager({
  page, totalPages, onPage, perPage, onPerPage,
}: { page: number; totalPages: number; onPage: (p: number) => void; perPage: number; onPerPage: (n: number) => void }) {
  // 1 … p-1 p p+1 … last
  const pages: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1 || (page <= 3 && p <= 4) || (page >= totalPages - 2 && p >= totalPages - 3)) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btn = 'w-9 h-9 rounded-xl border text-[13px] font-semibold flex items-center justify-center transition-colors';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-[13px] text-[#33405a]">
        Afficher
        <select
          value={perPage}
          onChange={e => onPerPage(Number(e.target.value))}
          className="rounded-xl border border-[#e3e8f1] bg-white px-2.5 py-1.5 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1d6ff2]/20"
        >
          {[10, 20, 50].map(n => <option key={n} value={n}>{n} par page</option>)}
        </select>
      </label>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Page précédente" className={`${btn} border-[#e3e8f1] bg-white hover:bg-[#f3f6fb] disabled:opacity-40`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pages.map((p, i) => p === '…' ? (
            <span key={`gap-${i}`} className="w-6 text-center text-[#8a94ad]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`${btn} ${p === page ? 'border-[#1d6ff2] bg-[#1d6ff2] text-white' : 'border-[#e3e8f1] bg-white text-[#33405a] hover:bg-[#f3f6fb]'}`}
            >
              {p}
            </button>
          ))}
          <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Page suivante" className={`${btn} border-[#e3e8f1] bg-white hover:bg-[#f3f6fb] disabled:opacity-40`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Read-only details ──────────────────────────────────────────────────────
// Confirming, assigning and cancelling happen in the mobile app, so the panel only shows information.

function Row({ icon: Icon, label, children, action }: { icon: React.ElementType; label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-t border-[#edf1f7]">
      <Icon className="w-[18px] h-[18px] mt-0.5 text-[#5b6680] shrink-0" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-semibold text-[#5b6680]">{label}</p>
        <div className="text-[13px] text-[#0b1533]">{children}</div>
      </div>
      {action}
    </div>
  );
}

export function ReservationDetails({
  reservation: r, categoryNames, onClose,
}: { reservation: Reservation; categoryNames?: Record<string, string>; onClose: () => void }) {
  const place = placeOf(r);
  const mapUrl = place.lat !== null && place.lng !== null
    ? `https://www.google.com/maps?q=${place.lat},${place.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(place.line)}`;
  const images = r.images ?? [];
  const price = r.actualPrice ?? r.estimatedPrice;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-[15px] font-extrabold">Détail de la demande</h2>
        <button onClick={onClose} aria-label="Fermer" className="p-1.5 -mr-1.5 rounded-lg text-[#5b6680] hover:bg-[#f3f6fb]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 pb-5 overflow-y-auto">
        <div className="flex items-start gap-3 pb-3">
          <span className="w-12 h-12 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0">
            <ServiceIcon category={r.serviceInfo?.category} className="w-6 h-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[15px] font-bold leading-tight">{serviceLabel(r, categoryNames)}</p>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-0.5 text-[12.5px] text-[#5b6680] line-clamp-2">{r.serviceInfo?.name ?? ''}</p>
            <p className="mt-1 text-[11.5px] font-semibold text-[#8a94ad]">{requestRef(r.id)}</p>
          </div>
        </div>

        {r.emergency && (
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-[#fde8e8] px-3 py-2 text-[12.5px] font-semibold text-[#b91c1c]">
            <Siren className="w-4 h-4" /> Demande urgente
          </p>
        )}

        <Row
          icon={UserIcon}
          label="Client"
          action={r.userInfo?.phone ? (
            <a href={`tel:${r.userInfo.phone}`} aria-label="Appeler le client" className="p-2 rounded-xl border border-[#e3e8f1] text-[#1d6ff2] hover:bg-[#f2f7ff]">
              <Phone className="w-4 h-4" />
            </a>
          ) : undefined}
        >
          <p className="font-bold">{r.userInfo?.name ?? `Client #${r.userId}`}</p>
          {r.userInfo?.phone && <p className="text-[12px] text-[#5b6680]">{r.userInfo.phone}</p>}
        </Row>

        <Row
          icon={Wrench}
          label="Technicien"
          action={r.workerInfo?.phone ? (
            <a href={`tel:${r.workerInfo.phone}`} aria-label="Appeler le technicien" className="p-2 rounded-xl border border-[#e3e8f1] text-[#1d6ff2] hover:bg-[#f2f7ff]">
              <Phone className="w-4 h-4" />
            </a>
          ) : undefined}
        >
          <Link href={`/dashboard/techniciens/${r.workerId}`} className="font-bold hover:text-[#1d6ff2] hover:underline">
            {r.workerInfo?.name ?? `Technicien #${r.workerId}`}
          </Link>
        </Row>

        <Row
          icon={MapPin}
          label="Adresse"
          action={place.line !== '—' ? (
            <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl bg-[#e8f0fe] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#1d6ff2] hover:bg-[#dbe7fd]">
              <MapPin className="w-3.5 h-3.5" /> Voir sur la carte
            </a>
          ) : undefined}
        >
          {place.line}
        </Row>

        <Row icon={CalendarDays} label="Date de la demande">
          {fmtDay(r.createdAt)} à {fmtTime(r.createdAt)}
        </Row>

        <Row icon={Clock} label="Intervention prévue">
          {fmtDay(r.date)} à {r.time} · {r.duration} min
        </Row>

        {price !== null && price !== undefined && (
          <Row icon={Coins} label={r.actualPrice !== null ? 'Prix final' : 'Prix estimé'}>
            {price.toLocaleString('fr-FR')} DT
          </Row>
        )}

        <Row icon={FileText} label="Description">
          <p className="whitespace-pre-line">{r.description || '—'}</p>
          {r.cancellationReason && (
            <p className="mt-1.5 text-[12px] text-[#b91c1c]">Motif d&apos;annulation : {r.cancellationReason}</p>
          )}
        </Row>

        <div className="pt-3 border-t border-[#edf1f7]">
          <p className="text-[13px] font-bold">Photos ({images.length})</p>
          {images.length ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {images.map(src => (
                <a key={src} href={src} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-xl bg-[#eef2f8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  <ExternalLink className="absolute right-1.5 top-1.5 w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 drop-shadow" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-[12.5px] text-[#8a94ad]"><ImageOff className="w-4 h-4" /> Aucune photo jointe</p>
          )}
        </div>
      </div>
    </Card>
  );
}
