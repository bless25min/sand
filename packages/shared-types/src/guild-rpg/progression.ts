import type { SpectacleCueId, SpectacleMotifId } from './spectacle';

export type HuntChallengeKind = 'one_command' | 'overkill' | 'build_route' | 'execution';

export interface HuntChallengeDefinition {
  id: string;
  huntId: string;
  questId: string;
  name: string;
  description: string;
  kind: HuntChallengeKind;
  cueId: SpectacleCueId;
  rewardLabel: string;
  overkillThreshold?: number;
  requiredBuildId?: string;
  executionEnemyId?: string;
}

export type AscensionRoute = 'one_command' | 'signature' | 'overkill';

export interface AscensionDefinition {
  id: string;
  name: string;
  description: string;
  pressureMultiplier: number;
  signatureDamageMultiplier?: number;
  overkillDamageMultiplier?: number;
  route: AscensionRoute;
  routeLabel: string;
  cueId: SpectacleCueId;
  motif: SpectacleMotifId;
}

export type GuildCodexCategory = 'enemy' | 'equipment' | 'rule' | 'build' | 'zone' | 'challenge';

export interface GuildCodexEntry {
  id: string;
  category: GuildCodexCategory;
  refId: string;
  name: string;
  description: string;
}
