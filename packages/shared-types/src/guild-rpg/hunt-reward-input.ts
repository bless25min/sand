import type { GuildBattleState } from './battle-state';
import type { EquipmentAffixDefinition } from './equipment';
import type { HuntDefinition } from './hunt';
import type { GuildProfile } from './profile';
import type { GuildGameContent } from './content';

export interface HuntRewardInput {
  profile: GuildProfile;
  battle: GuildBattleState;
  hunt: HuntDefinition;
  equipmentAffixes: readonly EquipmentAffixDefinition[];
  content?: GuildGameContent;
}
