'use client';

import { useEffect, useId, useRef, useState } from 'react';

/** Tracks an element's rendered width so SVG charts can draw at 1:1 pixels (no stretched text). */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

const fmt = (n: number) => n.toLocaleString('fr-FR');

/** Smallest "nice" axis maximum (1, 2, 2.5, 5 × 10^k) at or above `v`. */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= v) return m * pow;
  return 10 * pow;
}

// ─── Sparkline ──────────────────────────────────────────────────────────────

export function Sparkline({ values, color, className = '' }: { values: number[]; color: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const w = 120;
  const h = 56;
  const max = Math.max(...values, 0);
  const pts = values.map((v, i) => [
    values.length > 1 ? (i / (values.length - 1)) * w : w / 2,
    max > 0 ? h - 4 - (v / max) * (h - 10) : h - 4,
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#spark-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── Line chart ─────────────────────────────────────────────────────────────

export interface Series {
  name: string;
  color: string;
  values: number[];
}

export function LineChart({ labels, series, height = 230 }: { labels: string[]; series: Series[]; height?: number }) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, '');

  const pad = { top: 10, right: 12, bottom: 28, left: 30 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap(s => s.values)));
  // Whole-number steps for small counts, five steps otherwise
  const steps = max <= 5 ? max : 5;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => (max / steps) * i);
  const n = labels.length;
  const x = (i: number) => pad.left + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  // Thin out x labels so they never collide (~70px each)
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 70))));

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left) / box.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block" role="img" aria-label={series.map(s => s.name).join(', ')}>
          <defs>
            <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series[0]?.color} stopOpacity=".18" />
              <stop offset="100%" stopColor={series[0]?.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map(t => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e8edf5" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[#6b7590] text-[11px] tabular-nums">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}

          {labels.map((l, i) => (i % every === 0 || i === n - 1) && (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-[#6b7590] text-[11px]">{l}</text>
          ))}

          {series[0] && (
            <path
              d={`${series[0].values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`}
              fill={`url(#area-${gid})`}
            />
          )}
          {series.map(s => (
            <path
              key={s.name}
              d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {series.map(s => s.values.map((v, i) => (
            <circle key={`${s.name}-${i}`} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3.5} fill={s.color} stroke="#fff" strokeWidth="2" />
          )))}

          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#94a3b8" strokeDasharray="3 3" />}

          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-[170px] rounded-xl bg-[#0b1533] px-3.5 py-2.5 text-white shadow-xl"
          style={{
            left: Math.min(Math.max(x(hover) - 85, 0), Math.max(0, width - 180)),
          }}
        >
          <p className="text-[12px] font-semibold text-blue-100">{labels[hover]}</p>
          {series.map(s => (
            <p key={s.name} className="mt-1 flex items-center gap-2 text-[12px]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-white/80">{s.name}</span>
              <span className="font-bold tabular-nums">{fmt(s.values[hover])}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Donut ──────────────────────────────────────────────────────────────────

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices, centerLabel, size = 170 }: { slices: Slice[]; centerLabel: string; size?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const stroke = Math.round(size * 0.15);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const visible = slices.filter(s => s.value > 0);
  // 2px surface gap between segments, only when there is more than one
  const gap = visible.length > 1 ? 2 : 0;

  let offset = 0;
  const arcs = slices.map((s, i) => {
    const len = total ? (s.value / total) * c : 0;
    const arc = { i, s, len: Math.max(0, len - gap), offset };
    offset += len;
    return arc;
  });

  const shown = hover !== null ? slices[hover] : null;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={centerLabel}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f8" strokeWidth={stroke} />
        {arcs.filter(a => a.s.value > 0).map(a => (
          <circle
            key={a.s.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.s.color}
            strokeWidth={hover === a.i ? stroke + 4 : stroke}
            strokeDasharray={`${a.len} ${c - a.len}`}
            strokeDashoffset={-a.offset}
            className="transition-[stroke-width] cursor-pointer"
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[24px] font-extrabold leading-none tabular-nums">{fmt(shown ? shown.value : total)}</span>
        <span className="mt-1 text-[11px] text-[#6b7590] max-w-[80px] leading-tight">{shown ? shown.label : centerLabel}</span>
      </div>
    </div>
  );
}
