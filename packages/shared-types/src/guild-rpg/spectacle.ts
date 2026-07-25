export const SPECTACLE_CUE_IDS = [
  'stack',
  'trigger',
  'block',
  'break',
  'hit',
  'heal',
  'ricochet',
  'kill',
  'overkill',
  'boss-execution',
  'annihilation',
  'loot',
  'chest',
  'legendary',
  'rule-online',
] as const;

export const SPECTACLE_MOTIF_IDS = ['ember', 'storm', 'radiance', 'command'] as const;

export type SpectacleCueId = (typeof SPECTACLE_CUE_IDS)[number];
export type SpectacleMotifId = (typeof SPECTACLE_MOTIF_IDS)[number];
export type HuntSpectacleBeat = 'opening' | 'execution' | 'annihilation';

export interface EnemySpectacleIdentity {
  family: string;
  role: 'skirmisher' | 'brute' | 'artillery' | 'guardian' | 'boss';
  palette: string;
  aura: string;
  defeat: string;
}

export interface HuntSpectacleCue {
  id: string;
  beat: HuntSpectacleBeat;
  cueId: SpectacleCueId;
  label: string;
  palette: string;
}
