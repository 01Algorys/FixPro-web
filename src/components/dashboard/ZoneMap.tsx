'use client';

import { useWidth } from '@/components/dashboard/charts';

export interface ZonePoint {
  label: string;
  count: number;
  lat: number;
  lng: number;
}

const TILE = 256;
const TUNIS = { lat: 36.8065, lng: 10.1815 };

// Web-Mercator world pixel coordinates at zoom z
const toPx = (lat: number, lng: number, z: number) => {
  const scale = TILE * 2 ** z;
  const s = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale,
  };
};

/**
 * Small static map built from OpenStreetMap tiles, with one bubble per zone.
 * Picks the closest zoom (≤ 12) that keeps every point inside the frame.
 */
export default function ZoneMap({ points, height = 210, unplaced = 0 }: { points: ZonePoint[]; height?: number; unplaced?: number }) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const max = Math.max(1, ...points.map(p => p.count));

  let z = 11;
  let center = toPx(TUNIS.lat, TUNIS.lng, z);
  if (width > 0 && points.length) {
    for (z = 12; z > 4; z--) {
      const px = points.map(p => toPx(p.lat, p.lng, z));
      const xs = px.map(p => p.x);
      const ys = px.map(p => p.y);
      if (Math.max(...xs) - Math.min(...xs) <= width * 0.7 && Math.max(...ys) - Math.min(...ys) <= height * 0.62) {
        center = { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 };
        break;
      }
    }
    if (points.length === 1) {
      z = 11;
      center = toPx(points[0].lat, points[0].lng, z);
    }
  }

  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const tiles: { x: number; y: number }[] = [];
  if (width > 0) {
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx++) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height) / TILE); ty++) tiles.push({ x: tx, y: ty });
    }
  }

  return (
    <div ref={ref} className="relative overflow-hidden rounded-xl bg-[#dbe9f7]" style={{ height }}>
      {tiles.map(t => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${t.x}-${t.y}`}
          src={`https://tile.openstreetmap.org/${z}/${t.x}/${t.y}.png`}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute max-w-none select-none [filter:saturate(0.55)_brightness(1.04)]"
          style={{ left: t.x * TILE - left, top: t.y * TILE - top, width: TILE, height: TILE }}
        />
      ))}
      <div className="absolute inset-0 bg-[#1d6ff2]/[0.06] pointer-events-none" />

      {width > 0 && points.map(p => {
        const pos = toPx(p.lat, p.lng, z);
        const size = 24 + (p.count / max) * 10;
        return (
          <div
            key={p.label}
            className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: pos.x - left, top: pos.y - top }}
          >
            <span className="absolute w-12 h-12 rounded-full bg-[#1d6ff2]/25 blur-md" />
            <span
              className="relative rounded-full bg-[#1d6ff2] ring-[3px] ring-white shadow-lg text-white text-[12px] font-bold flex items-center justify-center tabular-nums"
              style={{ width: size, height: size }}
            >
              {p.count}
            </span>
            <span className="relative mt-1 px-1.5 rounded bg-white/85 text-[11px] font-semibold text-[#0b1533] whitespace-nowrap">{p.label}</span>
          </div>
        );
      })}

      {!points.length && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-lg bg-white/90 px-3 py-1.5 text-[12px] font-medium text-[#4b5672] shadow-sm">Aucune demande localisée</span>
        </div>
      )}
      {unplaced > 0 && (
        <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-[#4b5672] shadow-sm">
          +{unplaced} sans localisation
        </span>
      )}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-1 bottom-1 rounded bg-white/80 px-1 text-[9px] text-[#4b5672]"
      >
        © OpenStreetMap
      </a>
    </div>
  );
}
