'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';

export type BaseLayer = 'plan' | 'satellite' | 'sombre';

export interface MapPoint {
  id: number;
  lat: number;
  lng: number;
  label: string;
  sub: string;
  color: string;
}

export interface MapTechnician {
  id: number;
  name: string;
  lat: number;
  lng: number;
  sub: string;
  active: boolean;
}

const TILES: Record<BaseLayer, { url: string; attribution: string; maxZoom: number }> = {
  plan: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri',
    maxZoom: 18,
  },
  sombre: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  },
};

const TUNISIA_CENTER: [number, number] = [35.4, 9.6];

function HeatLayer({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const layer = L.heatLayer(points.map(([lat, lng]) => [lat, lng, 1]), {
      radius: 28,
      blur: 22,
      minOpacity: 0.35,
      maxZoom: 13,
      gradient: { 0.2: '#3b82f6', 0.45: '#22c55e', 0.65: '#eab308', 0.85: '#f97316', 1: '#dc2626' },
    });
    // leaflet.heat throws if it draws on a 0-height canvas, so wait until the map has a size
    const addWhenSized = () => {
      const size = map.getSize();
      if (size.x > 0 && size.y > 0 && !map.hasLayer(layer)) layer.addTo(map);
    };
    addWhenSized();
    map.on('resize', addWhenSized);
    return () => {
      map.off('resize', addWhenSized);
      layer.remove();
    };
  }, [map, points]);
  return null;
}

// Zoom to the data whenever the filtered set changes
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const key = coords.length ? `${coords.length}:${coords[0]}:${coords[coords.length - 1]}` : '';
  useEffect(() => {
    if (coords.length === 0) return;
    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

// Leaflet measures its container once; re-measure when the responsive layout resizes it
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

interface ZonesMapProps {
  base: BaseLayer;
  showHeat: boolean;
  showPoints: boolean;
  showTechnicians: boolean;
  points: MapPoint[];
  technicians: MapTechnician[];
}

export default function ZonesMap({ base, showHeat, showPoints, showTechnicians, points, technicians }: ZonesMapProps) {
  const tile = TILES[base];
  const heatCoords = useMemo(() => points.map(p => [p.lat, p.lng] as [number, number]), [points]);
  const allCoords = useMemo(
    () => [...heatCoords, ...(showTechnicians ? technicians.map(t => [t.lat, t.lng] as [number, number]) : [])],
    [heatCoords, technicians, showTechnicians]
  );

  return (
    <MapContainer center={TUNISIA_CENTER} zoom={7} scrollWheelZoom className="absolute inset-0 z-0">
      <TileLayer key={base} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
      <AutoResize />
      <FitBounds coords={allCoords} />

      {showHeat && <HeatLayer points={heatCoords} />}

      {showPoints && points.map(p => (
        <CircleMarker key={`r${p.id}`} center={[p.lat, p.lng]} radius={5}
          pathOptions={{ color: '#fff', weight: 1, fillColor: p.color, fillOpacity: 0.9 }}>
          <Tooltip>
            <span className="font-semibold">{p.label}</span><br />{p.sub}
          </Tooltip>
        </CircleMarker>
      ))}

      {showTechnicians && technicians.map(t => (
        <CircleMarker key={`t${t.id}`} center={[t.lat, t.lng]} radius={9}
          pathOptions={{ color: t.active ? '#1d4ed8' : '#9ca3af', weight: 3, fillColor: '#fff', fillOpacity: 1 }}>
          <Tooltip>
            <span className="font-semibold">{t.name}</span><br />{t.sub}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
