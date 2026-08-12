export interface CircuitSegment {
  id: string;
  name: string;
  startDistance_m: number;
  endDistance_m: number;
  type: 'STRAIGHT' | 'CORNER' | 'DRS_ZONE';
  length_m: number;
  optimalHarvestMode: boolean;
}
