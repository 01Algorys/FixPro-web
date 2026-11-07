import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

// 'off': no key, or Google refused it. The maps then use OpenStreetMap.
export type GoogleMapsStatus = 'loading' | 'ready' | 'off';

declare global {
  interface Window {
    gm_authFailure?: () => void;
    fixproGoogleMapsReady?: () => void;
  }
}

let status: GoogleMapsStatus = 'loading';
let started = false;
const listeners = new Set<(next: GoogleMapsStatus) => void>();

const setStatus = (next: GoogleMapsStatus) => {
  status = next;
  listeners.forEach(listener => listener(next));
};

// The key lives on the backend and is only given to logged-in admins
const load = async () => {
  try {
    const { data } = await adminApi.getMapsConfig();
    if (!data.googleMapsApiKey) return setStatus('off');

    window.gm_authFailure = () => setStatus('off');
    window.fixproGoogleMapsReady = () => setStatus('ready');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(data.googleMapsApiKey)}&loading=async&callback=fixproGoogleMapsReady&language=fr&region=TN`;
    script.async = true;
    script.onerror = () => setStatus('off');
    document.head.appendChild(script);
  } catch {
    setStatus('off');
  }
};

/** Loads Google Maps once for the whole dashboard. */
export function useGoogleMaps() {
  const [current, setCurrent] = useState(status);
  useEffect(() => {
    listeners.add(setCurrent);
    setCurrent(status);
    if (!started) {
      started = true;
      load();
    }
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);
  return current;
}
