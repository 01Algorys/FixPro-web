'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface ViewerImage {
  id: number;
  url: string;
  label: string;
  badge: { label: string; cls: string };
}

const WHEEL_PAUSE_MS = 400;

// Full-screen viewer. Slides sit in a horizontal snap scroller, so trackpads and
// touch screens scroll natively; a mouse wheel and the keyboard move one at a time.
export default function DocumentViewer({ images, startIndex, onClose }: { images: ViewerImage[]; startIndex: number; onClose: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const lastWheel = useRef(0);
  const [index, setIndex] = useState(startIndex);

  const goTo = useCallback((target: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: target * el.clientWidth, behavior });
  }, []);

  useLayoutEffect(() => goTo(startIndex, 'auto'), [goTo, startIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === 'ArrowRight') goTo(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, index, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || Math.abs(e.deltaY) < 10) return;
    const now = Date.now();
    if (now - lastWheel.current < WHEEL_PAUSE_MS) return;
    lastWheel.current = now;
    goTo(index + Math.sign(e.deltaY));
  };

  const closeOnBackdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const current = images[index] ?? images[0];
  const arrow = 'absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20';

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Documents de vérification" className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-medium truncate">{current.label}</p>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${current.badge.cls}`}>{current.badge.label}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-white/70 tabular-nums">{index + 1} / {images.length}</span>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scroller}
          onScroll={onScroll}
          onWheel={onWheel}
          className="h-full flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map(image => (
            <div key={image.id} onClick={closeOnBackdrop} className="w-full h-full shrink-0 snap-center flex items-center justify-center px-4 sm:px-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.label} className="max-w-full max-h-full object-contain" />
            </div>
          ))}
        </div>
        {index > 0 && (
          <button onClick={() => goTo(index - 1)} aria-label="Document précédent" className={`${arrow} left-3`}><ChevronLeft className="w-6 h-6" /></button>
        )}
        {index < images.length - 1 && (
          <button onClick={() => goTo(index + 1)} aria-label="Document suivant" className={`${arrow} right-3`}><ChevronRight className="w-6 h-6" /></button>
        )}
      </div>

      <div className="flex justify-center gap-2 p-3">
        {images.map((image, i) => (
          <button
            key={image.id}
            onClick={() => goTo(i)}
            aria-label={image.label}
            aria-current={i === index}
            className={`rounded-md overflow-hidden ring-2 ${i === index ? 'ring-white' : 'ring-transparent opacity-60 hover:opacity-100'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="w-16 h-12 object-cover" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
