'use client';

import { Fragment, useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';

export interface TrackMission {
  id: number;
  label: string;
  color: string;
  site: [number, number] | null;     // where the job takes place
  trail: [number, number][];         // technician GPS points, in time order
}

const TUNISIA_CENTER: [number, number] = [35.4, 9.6];

function FitTo({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const key = coords.map(c => c.join(',')).join(';');
  useEffect(() => {
    if (coords.length === 0) return;
    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

interface TrackMapProps {
  missions: TrackMission[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

/** Every mission site plus the technician's GPS trail; the selected mission is drawn on top and framed. */
export default function TrackMap({ missions, selectedId, onSelect }: TrackMapProps) {
  const selected = missions.find(m => m.id === selectedId) ?? null;

  const focus = useMemo(() => {
    if (selected) return [...(selected.site ? [selected.site] : []), ...selected.trail];
    return missions.flatMap(m => [...(m.site ? [m.site] : []), ...m.trail]);
  }, [missions, selected]);

  // Unselected first so the selected mission is drawn above them
  const ordered = [...missions.filter(m => m.id !== selectedId), ...(selected ? [selected] : [])];

  return (
    <MapContainer center={TUNISIA_CENTER} zoom={7} scrollWheelZoom className="absolute inset-0 z-0">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" maxZoom={19} />
      <AutoResize />
      <FitTo coords={focus} />

      {ordered.map(m => {
        const active = m.id === selectedId;
        const dim = selectedId !== null && !active;
        return (
          <Fragment key={m.id}>
            {m.trail.length > 1 && (
              <Polyline positions={m.trail}
                pathOptions={{ color: active ? '#2563eb' : '#64748b', weight: active ? 5 : 3, opacity: dim ? 0.35 : 0.9, dashArray: active ? undefined : '6 6' }}
                eventHandlers={{ click: () => onSelect(m.id) }} />
            )}
            {m.trail.map((p, i) => (
              <CircleMarker key={i} center={p} radius={active ? 4 : 3}
                pathOptions={{ color: '#fff', weight: 1, fillColor: active ? '#2563eb' : '#64748b', fillOpacity: dim ? 0.35 : 1 }}>
                <Tooltip>{m.label} · position {i + 1}/{m.trail.length}</Tooltip>
              </CircleMarker>
            ))}
            {m.site && (
              <CircleMarker center={m.site} radius={active ? 10 : 7}
                pathOptions={{ color: '#fff', weight: 2, fillColor: m.color, fillOpacity: dim ? 0.4 : 1 }}
                eventHandlers={{ click: () => onSelect(m.id) }}>
                <Tooltip>{m.label}</Tooltip>
              </CircleMarker>
            )}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
