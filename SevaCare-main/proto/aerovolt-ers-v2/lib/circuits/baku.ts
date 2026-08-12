import { CircuitSegment } from './types';

export const BAKU_SEGMENTS: CircuitSegment[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `baku_seg_${i}`,
  name: `Baku Segment ${i + 1}`,
  startDistance_m: i * 300,
  endDistance_m: (i + 1) * 300,
  type: i % 4 === 0 ? 'STRAIGHT' : 'CORNER',
  length_m: 300,
  optimalHarvestMode: i % 3 === 0
}));
