import React from 'react';
import { SolarParams } from '../types';
import { Goal, GoalKey, TrackRequest } from '../goals';
import type { TrackJob, TrackResult } from '../goalWorker';

interface TrackCtx {
  tracks: Record<string, number[]>;
  goal: Goal | null;
  register: (r: TrackRequest) => () => void;
}

// Sliders register their range here and read back their painted track.
export const TrackContext = React.createContext<TrackCtx>({ tracks: {}, goal: null, register: () => () => {} });

// Keeps one worker busy with the latest settings. While it works, newer requests
// replace older ones, so a fast drag only costs the final position.
export function useGoalTracks(params: SolarParams, goal: Goal): TrackCtx {
  const [tracks, setTracks] = React.useState<Record<string, number[]>>({});
  const [rangesVersion, setRangesVersion] = React.useState(0);
  const ranges = React.useRef(new Map<string, TrackRequest>());
  const worker = React.useRef<Worker | null>(null);
  const busy = React.useRef(false);
  const queued = React.useRef<TrackJob | null>(null);
  const seq = React.useRef(0);

  React.useEffect(() => {
    let w: Worker;
    try {
      w = new Worker(new URL('../goalWorker.ts', import.meta.url), { type: 'module' });
    } catch {
      return; // no workers: tracks stay plain
    }
    w.onmessage = (e: MessageEvent<TrackResult>) => {
      if (e.data.seq === seq.current) setTracks(e.data.tracks);
      busy.current = false;
      if (queued.current) { busy.current = true; w.postMessage(queued.current); queued.current = null; }
    };
    worker.current = w;
    return () => { w.terminate(); worker.current = null; };
  }, []);

  React.useEffect(() => {
    const w = worker.current;
    if (!w) return;
    const job: TrackJob = { seq: ++seq.current, params, goalKey: goal.key as GoalKey, sliders: [...ranges.current.values()] };
    if (busy.current) queued.current = job;
    else { busy.current = true; w.postMessage(job); }
  }, [params, goal, rangesVersion]);

  const register = React.useCallback((r: TrackRequest) => {
    const prev = ranges.current.get(r.key);
    if (!prev || prev.min !== r.min || prev.max !== r.max) {
      ranges.current.set(r.key, r);
      setRangesVersion(v => v + 1);
    }
    return () => { ranges.current.delete(r.key); };
  }, []);

  return React.useMemo(() => ({ tracks, goal, register }), [tracks, goal, register]);
}

// Slate at no change, blending to green (better) or red (worse) with the size of the change.
export function gainColor(gain: number, scale: number) {
  const t = Math.pow(Math.min(1, Math.abs(gain) / scale), 0.6);
  const from = [51, 65, 85];
  const to = gain >= 0 ? [16, 185, 129] : [244, 63, 94];
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
