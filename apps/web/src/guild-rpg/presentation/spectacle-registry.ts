import {
  SPECTACLE_CUE_IDS,
  SPECTACLE_MOTIF_IDS,
  type ComboEvent,
  type HuntRewards,
  type QuestRewards,
  type SpectacleCueId,
  type SpectacleMotifId,
} from '@expedition/shared-types';

export interface SpectacleCueSpec {
  id: SpectacleCueId;
  label: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  hitStopMs: number;
  shakePx: number;
  flash: 'none' | 'soft' | 'hard';
  trail: 'none' | 'short' | 'arc' | 'burst';
  numberTone: 'none' | 'damage' | 'heal' | 'overkill';
  backdrop: 'none' | 'build' | 'execution' | 'annihilation' | 'reward';
}

export interface SpectacleMotif {
  id: SpectacleMotifId;
  label: string;
  primary: string;
  secondary: string;
  audioPitch: 'low' | 'mid' | 'high';
}

export const SPECTACLE_CUE_REGISTRY = {
  stack: cue('stack', 'STACK', 1, 0, 0, 'none', 'short', 'none', 'build'),
  trigger: cue('trigger', 'TRIGGER', 2, 40, 3, 'soft', 'arc', 'none', 'build'),
  block: cue('block', 'BLOCK', 2, 55, 4, 'soft', 'none', 'none', 'none'),
  break: cue('break', 'BREAK', 4, 110, 10, 'hard', 'burst', 'damage', 'execution'),
  hit: cue('hit', 'IMPACT', 2, 45, 5, 'soft', 'short', 'damage', 'none'),
  heal: cue('heal', 'RESTORE', 2, 30, 0, 'soft', 'arc', 'heal', 'build'),
  ricochet: cue('ricochet', 'RICOCHET', 3, 65, 7, 'hard', 'arc', 'damage', 'build'),
  kill: cue('kill', 'EXECUTED', 4, 125, 12, 'hard', 'burst', 'damage', 'execution'),
  overkill: cue('overkill', 'OVERKILL', 5, 150, 16, 'hard', 'burst', 'overkill', 'execution'),
  'boss-execution': cue(
    'boss-execution',
    'EXECUTION WINDOW',
    5,
    180,
    18,
    'hard',
    'burst',
    'none',
    'execution',
  ),
  annihilation: cue(
    'annihilation',
    'ANNIHILATION',
    5,
    180,
    18,
    'hard',
    'burst',
    'overkill',
    'annihilation',
  ),
  loot: cue('loot', 'LOOT RAIN', 2, 0, 0, 'soft', 'short', 'none', 'reward'),
  chest: cue('chest', 'BOSS CHEST', 4, 90, 7, 'hard', 'burst', 'none', 'reward'),
  legendary: cue('legendary', 'LEGENDARY', 5, 140, 10, 'hard', 'burst', 'none', 'reward'),
  'rule-online': cue('rule-online', 'RULE ONLINE', 3, 60, 4, 'soft', 'arc', 'none', 'build'),
} satisfies Readonly<Record<SpectacleCueId, SpectacleCueSpec>>;

export const SPECTACLE_MOTIFS = {
  ember: motif('ember', 'EMBER REPRISAL', '#ff6b35', '#ffcf70', 'low'),
  storm: motif('storm', 'STORM RICOCHET', '#59cfff', '#9a7dff', 'high'),
  radiance: motif('radiance', 'RADIANT OVERFLOW', '#fff1a8', '#ff8bd7', 'high'),
  command: motif('command', 'COMMAND ENGINE', '#d7e2f0', '#ef4335', 'mid'),
} satisfies Readonly<Record<SpectacleMotifId, SpectacleMotif>>;

const CUE_IDS = new Set<string>(SPECTACLE_CUE_IDS);

export function cueForComboEvent(event: ComboEvent): SpectacleCueId | undefined {
  if (event.cueId && CUE_IDS.has(event.cueId)) return event.cueId as SpectacleCueId;
  if (event.kind === 'card_played') return 'stack';
  if (event.kind === 'rule_triggered') return 'trigger';
  if (event.kind === 'shield') return 'block';
  if (event.kind === 'healing') return 'heal';
  if (event.kind === 'damage') return 'hit';
  if (event.kind === 'unit_defeated') return 'kill';
  if (event.kind === 'boss_phase') return 'boss-execution';
  if (event.kind === 'overkill' || event.kind === 'infinite_engine') return 'overkill';
  if (event.kind === 'victory') return 'annihilation';
  return undefined;
}

export function rewardSpectacleCues(rewards: QuestRewards): readonly SpectacleCueId[] {
  const cues: SpectacleCueId[] = ['loot'];
  if (!isHuntRewards(rewards)) return cues;
  if (rewards.axes.bossChest) cues.push('chest');
  if (rewards.items.some((item) => item.rarity === 'legendary')) cues.push('legendary');
  return cues;
}

function isHuntRewards(rewards: QuestRewards): rewards is HuntRewards {
  return 'huntId' in rewards && 'axes' in rewards;
}

function cue(
  id: SpectacleCueId,
  label: string,
  intensity: SpectacleCueSpec['intensity'],
  hitStopMs: number,
  shakePx: number,
  flash: SpectacleCueSpec['flash'],
  trail: SpectacleCueSpec['trail'],
  numberTone: SpectacleCueSpec['numberTone'],
  backdrop: SpectacleCueSpec['backdrop'],
): SpectacleCueSpec {
  return { id, label, intensity, hitStopMs, shakePx, flash, trail, numberTone, backdrop };
}

function motif(
  id: SpectacleMotifId,
  label: string,
  primary: string,
  secondary: string,
  audioPitch: SpectacleMotif['audioPitch'],
): SpectacleMotif {
  return { id, label, primary, secondary, audioPitch };
}
