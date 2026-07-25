import type {
  AdventurerRole,
  ComboRuntimeState,
  GuildEquipmentSlot,
  GuildItemRarity,
  GuildStatKey,
} from '@expedition/shared-types';

export const ROLE_LABEL: Readonly<Record<AdventurerRole, string>> = {
  vanguard: '重裝先鋒',
  ranger: '遊俠射手',
  cleric: '戰地牧師',
};

export const STAT_LABEL: Readonly<Record<GuildStatKey, string>> = {
  hp: '生命',
  attack: '攻擊',
  defense: '防禦',
  speed: '速度',
  healing: '治療',
};

export const SLOT_LABEL: Readonly<Record<GuildEquipmentSlot, string>> = {
  weapon: '武器',
  armor: '防具',
  accessory: '飾品',
};

export const RARITY_LABEL: Readonly<Record<GuildItemRarity, string>> = {
  common: '普通',
  uncommon: '精良',
  rare: '稀有',
  epic: '史詩',
  legendary: '傳說',
};

export function formatTime(milliseconds?: number) {
  if (milliseconds === undefined) return '—';
  return `${(milliseconds / 1_000).toFixed(1)} 秒`;
}

export type ComboEscalationStage = 'stack' | 'break' | 'overflow';

export function comboEscalationStage(runtime: ComboRuntimeState): ComboEscalationStage {
  if (runtime.metrics.annihilationOverflow > 0) return 'overflow';
  if (runtime.metrics.defeatedEnemyIds.length > 0) return 'break';
  return 'stack';
}

export const COMBO_STAGE_LABEL: Readonly<Record<ComboEscalationStage, string>> = {
  stack: 'STACK & COMMIT',
  break: 'ACCELERATE & BREAK',
  overflow: 'OVERFLOW & LOOT',
};
