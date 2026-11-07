'use client';

import { useEffect } from 'react';
// The package's default build attaches itself to a global that bundlers don't provide
import GoogleMutant from 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs';
import { TileLayer, useMap } from 'react-leaflet';
import { useGoogleMaps } from '@/lib/googleMaps';

export type BaseLayer = 'plan' | 'satellite' | 'sombre';

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

const DARK_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1f2933' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aa5b1' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1f2933' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3e4c59' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1720' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

function GoogleLayer({ dark }: { dark: boolean }) {
  const map = useMap();
  useEffect(() => {
    const layer = new GoogleMutant({ type: 'roadmap', styles: dark ? DARK_STYLES : [] });
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, dark]);
  return null;
}

/**
 * Google Maps under the Leaflet layers, so the heatmap, markers and trails stay
 * as they are. Satellite keeps Esri's imagery: Google's stays blank in this layer.
 */
export default function BaseMap({ base = 'plan' }: { base?: BaseLayer }) {
  const google = useGoogleMaps();
  if (base !== 'satellite' && google === 'ready') return <GoogleLayer dark={base === 'sombre'} />;
  if (base !== 'satellite' && google === 'loading') return null;
  const tile = TILES[base];
  return <TileLayer key={base} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />;
}
