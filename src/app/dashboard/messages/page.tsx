'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquareText, MessagesSquare, Activity, CalendarRange, Image as ImageIcon, Search, RefreshCw, ArrowLeft,
  Eye, Filter, CalendarDays, ChevronUp, ImageOff, Wrench, User as UserIcon, Info,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAccess } from '@/components/layout/shell';
import { adminApi } from '@/lib/api';
import type { ChatMessage, ChatSenderRole, Conversation, ConversationStats, ConversationThread, Pagination } from '@/types';
import { Card, Skeleton, StatusBadge, Avatar, FilterSelect, Pager, requestRef, fmtDay, fmtTime } from '@/components/dashboard/kit';
import DocumentViewer, { type ViewerImage } from '@/components/dashboard/DocumentViewer';

type StatusKey = 'ALL' | 'ONGOING' | 'COMPLETED' | 'CLOSED';
type PeriodKey = 'ALL' | 'TODAY' | '7D' | '30D';

const STATUS_FILTERS: { key: StatusKey; label: string; query: string }[] = [
  { key: 'ALL',       label: 'Toutes',     query: '' },
  { key: 'ONGOING',   label: 'En cours',   query: 'ACCEPTED,IN_PROGRESS' },
  { key: 'COMPLETED', label: 'Terminées',  query: 'COMPLETED' },
  { key: 'CLOSED',    label: 'Annulées',   query: 'CANCELLED,REJECTED,EXPIRED' },
];
const PERIODS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: 'ALL',   label: 'Toute la période', days: null },
  { key: 'TODAY', label: "Aujourd'hui",      days: 0 },
  { key: '7D',    label: '7 derniers jours', days: 6 },
  { key: '30D',   label: '30 derniers jours', days: 29 },
];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sinceDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return ymd(d);
};

const ROLE_LABEL: Record<ChatSenderRole, string> = { client: 'Client', technician: 'Technicien', system: 'Système', other: 'Autre' };
const ROLE_BADGE: Record<ChatSenderRole, string> = {
  client: 'bg-[#e8f0fe] text-[#1d4ed8]',
  technician: 'bg-[#e3f6ea] text-[#15803d]',
  system: 'bg-[#f1f4f9] text-[#5b6680]',
  other: 'bg-[#f1f4f9] text-[#5b6680]',
};

/** "14:32", "Hier", "lun.", or "12/10/2026" for the list */
function shortWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (ymd(d) === ymd(now)) return fmtTime(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (ymd(d) === ymd(yesterday)) return 'Hier';
  if (now.getTime() - d.getTime() < 6 * 24 * 3600 * 1000) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return fmtDay(iso);
}

const dayHeading = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());

function StatCard({ icon: Icon, color, bg, value, label }: { icon: React.ElementType; color: string; bg: string; value: number | undefined; label: string }) {
  return (
    <Card className="p-3.5 flex items-center gap-3">
      <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon className="w-[22px] h-[22px]" style={{ color }} strokeWidth={2.1} />
      </span>
      <div className="min-w-0">
        <div className="text-[22px] font-extrabold leading-none tabular-nums">
          {value === undefined ? <Skeleton className="h-6 w-10" /> : value.toLocaleString('fr-FR')}
        </div>
        <p className="mt-1 text-[12px] font-medium text-[#33405a] leading-tight">{label}</p>
      </div>
    </Card>
  );
}

// ─── List ───────────────────────────────────────────────────────────────────

function preview(c: Conversation) {
  const m = c.lastMessage;
  if (!m) return '—';
  const who = m.senderRole === 'client' ? 'Client : ' : m.senderRole === 'technician' ? 'Technicien : ' : '';
  return `${who}${m.type === 'image' ? '📷 Photo' : m.content}`;
}

function ConversationRow({ c, active, onOpen }: { c: Conversation; active: boolean; onOpen: () => void }) {
  const client = c.client?.name ?? `Client #${c.client?.id ?? '?'}`;
  const tech = c.technician?.name ?? `Technicien #${c.technician?.id ?? '?'}`;
  return (
    <button
      onClick={onOpen}
      aria-current={active}
      className={`w-full text-left flex gap-3 px-4 py-3.5 border-b border-[#edf1f7] transition-colors ${active ? 'bg-[#f2f7ff] shadow-[inset_3px_0_0_#1d6ff2]' : 'hover:bg-[#fafbfd]'}`}
    >
      <span className="relative w-11 h-11 shrink-0">
        <span className="absolute left-0 top-0"><Avatar name={client} src={c.client?.avatar} size={32} /></span>
        <span className="absolute right-0 bottom-0 ring-2 ring-white rounded-full"><Avatar name={tech} src={c.technician?.avatar} size={26} /></span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13.5px] font-bold text-[#0b1533]">{client} <span className="font-normal text-[#8a94ad]">↔</span> {tech}</span>
          <span className="shrink-0 text-[11.5px] text-[#8a94ad]">{shortWhen(c.lastMessageAt)}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[12px] text-[#5b6680]">
          <span className="truncate">{c.service?.name ?? 'Service'} · {requestRef(c.reservationId)}</span>
        </span>
        <span className="mt-1 block truncate text-[12.5px] text-[#33405a]">{preview(c)}</span>
        <span className="mt-1.5 flex items-center gap-2">
          {c.status && <StatusBadge status={c.status} />}
          <span className="text-[11.5px] text-[#8a94ad]">{c.messageCount} message{c.messageCount > 1 ? 's' : ''}</span>
          {c.photoCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-[#8a94ad]"><ImageIcon className="w-3.5 h-3.5" /> {c.photoCount}</span>
          )}
        </span>
      </span>
    </button>
  );
}

// ─── Thread ─────────────────────────────────────────────────────────────────

function Bubble({ m, name, onPhoto, photoBroken, onPhotoError, onPhotoLoad }: {
  m: ChatMessage; name: string; onPhoto: () => void; photoBroken: boolean; onPhotoError: () => void; onPhotoLoad: () => void;
}) {
  if (m.senderRole === 'system') {
    return (
      <p className="mx-auto my-2 max-w-[80%] rounded-full bg-[#f1f4f9] px-3 py-1 text-center text-[11.5px] text-[#5b6680]">
        {m.content}
      </p>
    );
  }
  const right = m.senderRole === 'technician';
  return (
    <div className={`flex ${right ? 'justify-end' : 'justify-start'} my-1.5`}>
      <div className={`max-w-[78%] ${right ? 'items-end' : 'items-start'} flex flex-col`}>
        <span className={`mb-1 flex items-center gap-1.5 text-[11px] ${right ? 'flex-row-reverse' : ''}`}>
          <span className={`rounded-full px-1.5 py-0.5 font-semibold ${ROLE_BADGE[m.senderRole]}`}>{ROLE_LABEL[m.senderRole]}</span>
          <span className="font-semibold text-[#33405a]">{name}</span>
        </span>
        {m.type === 'image' ? (
          m.imageUrl && !photoBroken ? (
            <button onClick={onPhoto} className="block overflow-hidden rounded-2xl border border-[#e3e8f1] bg-[#eef2f8]" aria-label="Agrandir la photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.imageUrl} alt="Photo envoyée dans la conversation" onError={onPhotoError} onLoad={onPhotoLoad} className="block max-h-64 w-auto max-w-full object-cover hover:opacity-95" />
            </button>
          ) : (
            <span className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d5dcea] px-3 py-2.5 text-[12.5px] text-[#8a94ad]">
              <ImageOff className="w-4 h-4" /> Photo indisponible
            </span>
          )
        ) : (
          <p className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug ${
            right ? 'rounded-tr-md bg-[#1d6ff2] text-white' : 'rounded-tl-md bg-[#f1f4f9] text-[#0b1533]'
          }`}>
            {m.content}
          </p>
        )}
        <span className="mt-0.5 text-[10.5px] text-[#8a94ad]">{fmtTime(m.createdAt)}</span>
      </div>
    </div>
  );
}

function ThreadPanel({ reservationId, onBack }: { reservationId: number; onBack: () => void }) {
  const { can } = useAccess();
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [error, setError] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [broken, setBroken] = useState<Set<number>>(new Set());
  const [loadedAt, setLoadedAt] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  // Stay on the newest message while photos load, unless the admin scrolled up
  const stickToBottom = useRef(true);
  const toBottom = useCallback(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, []);

  const load = useCallback(() => {
    setError('');
    setBroken(new Set());
    adminApi.getConversation(reservationId)
      .then(res => {
        setThread(res.data);
        setLoadedAt(Date.now());
        stickToBottom.current = true;
        requestAnimationFrame(toBottom);
      })
      .catch(e => setError(e.message));
  }, [reservationId, toBottom]);

  useEffect(() => {
    setThread(null);
    load();
  }, [load]);

  const loadOlder = () => {
    if (!thread?.messages.length) return;
    stickToBottom.current = false;
    setLoadingOlder(true);
    adminApi.getConversation(reservationId, thread.messages[0].id)
      .then(res => setThread(t => t && ({ ...t, messages: [...res.data.messages, ...t.messages], hasMore: res.data.hasMore })))
      .catch(e => setError(e.message))
      .finally(() => setLoadingOlder(false));
  };

  const r = thread?.reservation;
  const nameOf = (m: ChatMessage) =>
    m.senderRole === 'client' ? r?.client.name ?? 'Client' : m.senderRole === 'technician' ? r?.technician.name ?? 'Technicien' : '—';

  const photos = useMemo(() => (thread?.messages ?? []).filter(m => m.type === 'image' && m.imageUrl), [thread]);
  const viewerImages: ViewerImage[] = photos.map(m => ({
    id: m.id,
    url: m.imageUrl as string,
    label: `${nameOf(m)} · ${fmtDay(m.createdAt)} à ${fmtTime(m.createdAt)}`,
    badge: { label: ROLE_LABEL[m.senderRole], cls: ROLE_BADGE[m.senderRole] },
  }));
  // Photo links last a few minutes: past that, fetch fresh ones before opening
  const openPhoto = (id: number) => {
    const stale = thread && Date.now() - loadedAt > (thread.photoLinkSeconds - 30) * 1000;
    if (stale) {
      load();
      return;
    }
    setViewer(photos.findIndex(p => p.id === id));
  };

  return (
    <Card className="flex flex-col min-h-[560px] lg:h-[calc(100vh-260px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-[#edf1f7] px-4 py-3.5">
        <button onClick={onBack} className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-[#5b6680] hover:bg-[#f3f6fb]" aria-label="Retour à la liste">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {r ? (
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-extrabold">{r.service?.name ?? 'Service'}</h2>
              <StatusBadge status={r.status} />
              <span className="text-[12px] font-semibold text-[#8a94ad]">{requestRef(r.id)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#33405a]">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#1d4ed8]" /> <b>{r.client.name ?? `Client #${r.client.id}`}</b>
                {r.client.phone && <a href={`tel:${r.client.phone}`} className="text-[#5b6680] hover:underline">{r.client.phone}</a>}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#15803d]" />
                {can('technicians') ? (
                  <Link href={`/dashboard/techniciens/${r.technician.id}`} className="font-bold hover:text-[#1d6ff2] hover:underline">{r.technician.name ?? `Technicien #${r.technician.id}`}</Link>
                ) : (
                  <b>{r.technician.name ?? `Technicien #${r.technician.id}`}</b>
                )}
                {r.technician.phone && <a href={`tel:${r.technician.phone}`} className="text-[#5b6680] hover:underline">{r.technician.phone}</a>}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#5b6680]">
                <CalendarDays className="w-3.5 h-3.5" /> Prévue le {fmtDay(r.date)} à {r.time}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-72" /></div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#f1f4f9] px-2.5 py-1 text-[11.5px] font-semibold text-[#5b6680]">
            <Eye className="w-3.5 h-3.5" /> Lecture seule
          </span>
          <button onClick={load} className="p-2 rounded-xl border border-[#e3e8f1] text-[#5b6680] hover:bg-[#f3f6fb]" aria-label="Actualiser la conversation">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scroller}
        onScroll={e => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto px-4 py-3 bg-[#fcfdff]"
      >
        {error && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#fde2e2] bg-[#fff6f6] px-4 py-3 text-[13px] text-[#b91c1c]">
            {error}
            <button onClick={load} className="inline-flex items-center gap-1.5 font-semibold hover:underline"><RefreshCw className="w-4 h-4" /> Réessayer</button>
          </div>
        )}
        {thread?.photosUnavailable && (
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-[#fff4d6] px-3 py-2 text-[12.5px] text-[#a16207]">
            <Info className="w-4 h-4" /> Les photos ne peuvent pas être affichées pour le moment (stockage indisponible).
          </p>
        )}
        {!thread && !error && (
          <div className="space-y-4 py-2">
            <Skeleton className="h-10 w-2/3" /><Skeleton className="h-10 w-1/2 ml-auto" /><Skeleton className="h-24 w-1/3" /><Skeleton className="h-10 w-3/5 ml-auto" />
          </div>
        )}
        {thread?.hasMore && (
          <div className="mb-2 flex justify-center">
            <button onClick={loadOlder} disabled={loadingOlder} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e8f1] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#33405a] hover:bg-[#f3f6fb] disabled:opacity-50">
              <ChevronUp className="w-4 h-4" /> {loadingOlder ? 'Chargement…' : 'Messages précédents'}
            </button>
          </div>
        )}
        {thread && thread.messages.length === 0 && (
          <p className="py-12 text-center text-[13px] text-[#8a94ad]">Aucun message dans cette conversation.</p>
        )}
        {thread?.messages.map((m, i) => {
          const prev = thread.messages[i - 1];
          const newDay = !prev || ymd(new Date(prev.createdAt)) !== ymd(new Date(m.createdAt));
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="my-3 flex items-center gap-3 text-[11.5px] font-semibold text-[#8a94ad]">
                  <span className="h-px flex-1 bg-[#edf1f7]" /> {dayHeading(m.createdAt)} <span className="h-px flex-1 bg-[#edf1f7]" />
                </div>
              )}
              <Bubble
                m={m}
                name={nameOf(m)}
                onPhoto={() => openPhoto(m.id)}
                photoBroken={broken.has(m.id)}
                onPhotoError={() => setBroken(b => new Set(b).add(m.id))}
                onPhotoLoad={toBottom}
              />
            </Fragment>
          );
        })}
      </div>

      {thread && (
        <div className="flex items-center justify-between gap-3 border-t border-[#edf1f7] px-4 py-2.5 text-[12px] text-[#8a94ad]">
          <span>{thread.totalMessages} message{thread.totalMessages > 1 ? 's' : ''} · {photos.length} photo{photos.length > 1 ? 's' : ''}</span>
          <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Les participants ne voient pas votre consultation.</span>
        </div>
      )}

      {viewer !== null && viewer >= 0 && (
        <DocumentViewer images={viewerImages} startIndex={viewer} onClose={() => setViewer(null)} />
      )}
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [rows, setRows] = useState<Conversation[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusKey>('ALL');
  const [period, setPeriod] = useState<PeriodKey>('ALL');
  const [photosOnly, setPhotosOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [opened, setOpened] = useState<number | null>(null);

  // Open the conversation named in the address (?c=<reservation id>)
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('c'));
    if (Number.isInteger(id) && id > 0) setOpened(id);
  }, []);

  const open = (id: number | null) => {
    setOpened(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('c', String(id));
    else url.searchParams.delete('c');
    window.history.replaceState(null, '', url);
  };

  // Search as you type, once typing pauses
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    const days = PERIODS.find(p => p.key === period)?.days;
    adminApi.getConversations({
      search: query || undefined,
      status: STATUS_FILTERS.find(s => s.key === status)?.query || undefined,
      photos: photosOnly,
      from: days === null || days === undefined ? undefined : sinceDays(days),
      page,
      limit: perPage,
    })
      .then(res => {
        setRows(res.data.conversations);
        setPagination(res.data.pagination);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [query, status, period, photosOnly, page, perPage]);

  useEffect(load, [load]);

  useEffect(() => {
    adminApi.getConversationStats().then(res => setStats(res.data)).catch(() => {});
  }, []);

  const filtered = query || status !== 'ALL' || period !== 'ALL' || photosOnly;

  return (
    <>
      <TopBar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Heading */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex w-11 h-11 rounded-xl bg-[#e8f0fe] items-center justify-center shrink-0">
              <MessageSquareText className="w-6 h-6 text-[#1d6ff2]" strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Messages</h1>
              <p className="mt-0.5 text-[13px] text-[#6b7590]">Les conversations entre clients et techniciens, une par réservation. Consultation uniquement.</p>
            </div>
          </div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <StatCard icon={MessagesSquare} color="#1d6ff2" bg="#e6efff" value={stats?.conversations} label="Conversations" />
          <StatCard icon={Activity} color="#16a34a" bg="#e3f6ea" value={stats?.activeToday} label="Actives aujourd'hui" />
          <StatCard icon={CalendarRange} color="#0284c7" bg="#e0f2fe" value={stats?.activeWeek} label="Actives sur 7 jours" />
          <StatCard icon={MessageSquareText} color="#7c3aed" bg="#efeafe" value={stats?.messages} label="Messages échangés" />
          <StatCard icon={ImageIcon} color="#d97706" bg="#fff4d6" value={stats?.photos} label="Photos envoyées" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
          {/* List */}
          <Card className={`flex flex-col overflow-hidden lg:h-[calc(100vh-260px)] min-h-[560px] ${opened ? 'hidden lg:flex' : 'flex'}`}>
            <div className="space-y-2.5 border-b border-[#edf1f7] p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a94ad]" />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Client, technicien, service, #DM-0012, mot du message…"
                  className="w-full rounded-xl border border-[#e3e8f1] bg-white py-2 pl-9 pr-3 text-[13px] placeholder:text-[#8a94ad] focus:outline-none focus:ring-4 focus:ring-[#1d6ff2]/10 focus:border-[#1d6ff2]/50"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect icon={Filter} label="Statut" value={status} options={STATUS_FILTERS} onChange={v => { setStatus(v); setPage(1); }} />
                <FilterSelect icon={CalendarDays} label="Activité" value={period} options={PERIODS} onChange={v => { setPeriod(v); setPage(1); }} />
                <button
                  onClick={() => { setPhotosOnly(v => !v); setPage(1); }}
                  aria-pressed={photosOnly}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-colors ${
                    photosOnly ? 'border-[#1d6ff2] bg-[#e8f0fe] text-[#1d6ff2]' : 'border-[#e3e8f1] bg-white text-[#0b1533] hover:border-[#c9d3e3]'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" /> Avec photos
                </button>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto transition-opacity ${loading && rows ? 'opacity-60' : ''}`}>
              {failed && (
                <div className="m-3 flex items-center justify-between gap-3 rounded-xl border border-[#fde2e2] bg-[#fff6f6] px-4 py-3 text-[13px] text-[#b91c1c]">
                  Impossible de charger les conversations.
                  <button onClick={load} className="inline-flex items-center gap-1.5 font-semibold hover:underline"><RefreshCw className="w-4 h-4" /> Réessayer</button>
                </div>
              )}
              {!rows && !failed && Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-[#edf1f7]">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-5/6" /></div>
                </div>
              ))}
              {rows?.length === 0 && (
                <p className="px-6 py-14 text-center text-[13px] text-[#8a94ad]">
                  {filtered ? 'Aucune conversation ne correspond à ces filtres.' : 'Aucune conversation pour le moment.'}
                </p>
              )}
              {rows?.map(c => (
                <ConversationRow key={c.reservationId} c={c} active={c.reservationId === opened} onOpen={() => open(c.reservationId)} />
              ))}
            </div>

            {pagination && pagination.total > 0 && (
              <div className="border-t border-[#edf1f7] p-3">
                <p className="mb-2 text-[12px] text-[#8a94ad]">{pagination.total} conversation{pagination.total > 1 ? 's' : ''}</p>
                <Pager page={page} totalPages={pagination.totalPages} onPage={setPage} perPage={perPage} onPerPage={n => { setPerPage(n); setPage(1); }} />
              </div>
            )}
          </Card>

          {/* Thread */}
          <div className={opened ? 'block' : 'hidden lg:block'}>
            {opened ? (
              <ThreadPanel key={opened} reservationId={opened} onBack={() => open(null)} />
            ) : (
              <Card className="flex h-full min-h-[560px] flex-col items-center justify-center p-8 text-center">
                <span className="w-14 h-14 rounded-2xl bg-[#e8f0fe] flex items-center justify-center">
                  <MessagesSquare className="w-7 h-7 text-[#1d6ff2]" />
                </span>
                <p className="mt-4 text-[15px] font-bold">Choisissez une conversation</p>
                <p className="mt-1 max-w-xs text-[13px] text-[#6b7590]">
                  Vous verrez tous les messages et photos échangés pour la réservation. Les participants ne sont pas prévenus.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
