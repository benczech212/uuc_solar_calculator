// Background worker: paints-by-numbers for the slider tracks. Sampling every slider
// takes a few hundred model runs, so it happens here instead of on the page's thread.
import { calculateRoi } from './utils';
import { goalByKey, sliderTrack, GoalKey, TrackRequest } from './goals';
import { SolarParams } from './types';

export interface TrackJob { seq: number; params: SolarParams; goalKey: GoalKey; sliders: TrackRequest[] }
export interface TrackResult { seq: number; tracks: Record<string, number[]> }

self.onmessage = (e: MessageEvent<TrackJob>) => {
  const { seq, params, goalKey, sliders } = e.data;
  const goal = goalByKey(goalKey);
  const base = goal.value(calculateRoi(params), params);
  const tracks: Record<string, number[]> = {};
  for (const s of sliders) tracks[s.key] = sliderTrack(params, goal, s, base);
  (self as unknown as Worker).postMessage({ seq, tracks } satisfies TrackResult);
};
