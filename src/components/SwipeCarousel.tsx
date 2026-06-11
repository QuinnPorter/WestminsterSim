import { ReactNode } from 'react';
import { useSwipe } from './useSwipe';
import './SwipeCarousel.css';

interface SwipeCarouselProps {
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
  /** e.g. "3 / 8" */
  caption?: string;
}

/** swipe (or chevron-click) left/right to cycle options; children is the preview */
export function SwipeCarousel({ onPrev, onNext, children, caption }: SwipeCarouselProps) {
  const { handlers, offset } = useSwipe(onNext, onPrev);
  return (
    <div className="carousel">
      <button className="carousel-chevron" onClick={onPrev} aria-label="Previous">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 6 L9 12 L14.5 18" />
        </svg>
      </button>
      <div
        className="carousel-stage"
        {...handlers}
        style={{ transform: `translateX(${offset * 0.35}px)`, touchAction: 'pan-y' }}
      >
        {children}
        {caption && <div className="carousel-caption">{caption}</div>}
      </div>
      <button className="carousel-chevron" onClick={onNext} aria-label="Next">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 6 L15 12 L9.5 18" />
        </svg>
      </button>
    </div>
  );
}
