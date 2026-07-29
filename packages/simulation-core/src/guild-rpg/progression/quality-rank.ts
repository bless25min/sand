import type { GuildItemRarity, QualityRank } from '@expedition/shared-types';

export const QUALITY_RANK_BY_RARITY: Readonly<Record<GuildItemRarity, QualityRank>> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

export function clampQualityRank(value: number): QualityRank {
  return Math.max(1, Math.min(5, Math.trunc(value))) as QualityRank;
}
