import { useRef, useState } from 'react';

interface SwipeHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
}

/** horizontal swipe detection with live drag offset for visual feedback */
export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 40
): { handlers: SwipeHandlers; offset: number } {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  const handlers: SwipeHandlers = {
    onPointerDown: (e) => {
      startX.current = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      if (startX.current === null) return;
      setOffset(Math.max(-80, Math.min(80, e.clientX - startX.current)));
    },
    onPointerUp: (e) => {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      startX.current = null;
      setOffset(0);
      if (dx <= -threshold) onSwipeLeft();
      else if (dx >= threshold) onSwipeRight();
    },
    onPointerCancel: () => {
      startX.current = null;
      setOffset(0);
    },
  };

  return { handlers, offset };
}
