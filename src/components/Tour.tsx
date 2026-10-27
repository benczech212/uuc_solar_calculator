import React from 'react';
import { X } from 'lucide-react';
import { cn, btn } from './ui';

export interface TourStep {
  target?: string;    // element id to spotlight; none = centred card
  title: string;
  body: string;
  before?: () => void; // e.g. open a section or switch screens first
}

const TOUR_KEY = 'UUC_SOLAR_TOUR_DONE';

// First visit only: localStorage can be unavailable (private mode, blocked storage),
// in which case we don't show the tour automatically rather than show it every time.
export function shouldAutoStartTour() {
  try { return !localStorage.getItem(TOUR_KEY); } catch { return false; }
}
function markTourDone() {
  try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* storage blocked: nothing to remember */ }
}

// A step-by-step walkthrough: dims the page, outlines one element at a time, and
// explains it in a card next to it.
export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [i, setI] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const step = steps[i];
  const last = i === steps.length - 1;

  const finish = React.useCallback(() => { markTourDone(); onClose(); }, [onClose]);

  React.useEffect(() => {
    step.before?.();
    let raf = 0;
    const t = setTimeout(() => {
      const el = step.target ? document.getElementById(step.target) : null;
      // Tall elements scroll to the top so their start shows; others are centred.
      el?.scrollIntoView({ behavior: 'smooth', block: el.offsetHeight > window.innerHeight * 0.5 ? 'start' : 'center' });
      // Track the element while it scrolls into place and if the layout shifts.
      const track = () => {
        setRect(el ? el.getBoundingClientRect() : null);
        raf = requestAnimationFrame(track);
      };
      track();
    }, 120);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [i]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' && !last) setI(n => n + 1);
      if (e.key === 'ArrowLeft' && i > 0) setI(n => n - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [i, last, finish]);

  const pad = 6;
  const vw = window.innerWidth, vh = window.innerHeight;
  const cardW = Math.min(360, vw - 32);
  const cardH = cardRef.current?.offsetHeight ?? 220;
  let cardStyle: React.CSSProperties = { left: (vw - cardW) / 2, top: vh / 2, transform: 'translateY(-50%)', width: cardW };
  if (rect && vw >= 640) {
    // Below the element if it fits, else above, else beside it, else pinned to the bottom corner.
    const left = Math.max(16, Math.min(rect.left, vw - cardW - 16));
    const sideTop = Math.max(16, Math.min(rect.top, vh - cardH - 16));
    if (rect.bottom + 12 + cardH < vh - 8) cardStyle = { width: cardW, left, top: rect.bottom + 12 };
    else if (rect.top - 12 - cardH > 8) cardStyle = { width: cardW, left, top: rect.top - 12 - cardH };
    else if (rect.right + 16 + cardW < vw - 8) cardStyle = { width: cardW, left: rect.right + 16, top: sideTop };
    else if (rect.left - 16 - cardW > 8) cardStyle = { width: cardW, left: rect.left - 16 - cardW, top: sideTop };
    else cardStyle = { width: cardW, right: 16, bottom: 16 };
  } else if (rect) {
    cardStyle = { left: 16, right: 16, bottom: 16, width: 'auto' };
  }

  return (
    <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-label="How the calculator works">
      {rect ? (
        <div
          className="fixed rounded-xl ring-2 ring-amber-400 pointer-events-none transition-all duration-200"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgba(2,6,23,0.72)' }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(2,6,23,0.72)]" />
      )}
      <div ref={cardRef} className="fixed bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-3" style={cardStyle}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-amber-400">Step {i + 1} of {steps.length}</p>
            <h2 className="text-base font-semibold text-white">{step.title}</h2>
          </div>
          <button type="button" onClick={finish} className="text-slate-400 hover:text-white" aria-label="Close the tour"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{step.body}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex gap-1" aria-hidden>
            {steps.map((_, n) => <span key={n} className={cn('w-1.5 h-1.5 rounded-full', n === i ? 'bg-amber-400' : 'bg-slate-600')} />)}
          </div>
          <div className="flex gap-2">
            {i > 0
              ? <button type="button" onClick={() => setI(i - 1)} className={cn(btn.base, btn.ghost, 'py-1.5')}>Back</button>
              : <button type="button" onClick={finish} className={cn(btn.base, btn.ghost, 'py-1.5')}>Skip</button>}
            {last
              ? <button type="button" onClick={finish} className={cn(btn.base, btn.primary, 'py-1.5')}>Start using it</button>
              : <button type="button" onClick={() => setI(i + 1)} className={cn(btn.base, btn.primary, 'py-1.5')}>{i === 0 ? 'Show me' : 'Next'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
