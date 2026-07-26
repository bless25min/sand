import type {
  EnemySpectacleIdentity,
  GuildEquipmentSlot,
  GuildStatKey,
  HuntDefinition,
  HuntEnemyRewards,
  HuntEnemyTrait,
  HuntEquipmentDefinition,
  QuestDefinition,
  SpectacleCueId,
} from '@expedition/shared-types';

export function equipment(
  id: string,
  name: string,
  slot: GuildEquipmentSlot,
  mainStat: GuildStatKey,
  baseValue: number,
  recommendedBuildIds: readonly string[],
  ruleIds: readonly string[] = [],
): HuntEquipmentDefinition {
  return {
    id,
    name,
    slot,
    mainStat,
    baseValue,
    recommendedBuildIds,
    ...(ruleIds.length ? { ruleIds } : {}),
  };
}

export function quest(input: QuestDefinition): QuestDefinition {
  return input;
}

interface HuntEnemyInput {
  enemyId: string;
  spectacle: EnemySpectacleIdentity;
  traits: readonly HuntEnemyTrait[];
  material: HuntEnemyRewards['material'];
  equipment: readonly HuntEquipmentDefinition[];
}

export function huntEnemy(input: HuntEnemyInput): HuntEnemyRewards {
  return input;
}

interface HuntCueInput {
  cueId: SpectacleCueId;
  label: string;
  palette: string;
}

interface HuntInput extends Omit<
  HuntDefinition,
  'spectacleCues' | 'enemies' | 'annihilationChest'
> {
  cues: {
    opening: HuntCueInput;
    execution: HuntCueInput;
    annihilation: HuntCueInput;
  };
  enemies: readonly HuntEnemyRewards[];
  annihilationChest: HuntEquipmentDefinition;
}

export function hunt({ cues, ...input }: HuntInput): HuntDefinition {
  return {
    ...input,
    spectacleCues: [
      { id: `${input.id}-opening`, beat: 'opening', ...cues.opening },
      { id: `${input.id}-execution`, beat: 'execution', ...cues.execution },
      { id: `${input.id}-annihilation`, beat: 'annihilation', ...cues.annihilation },
    ],
  };
}
