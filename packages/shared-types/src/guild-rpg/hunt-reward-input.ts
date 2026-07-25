import type { GuildBattleState } from './battle-state';
import type { HuntDefinition } from './hunt';
import type { GuildProfile } from './profile';

export interface HuntRewardInput {
  profile: GuildProfile;
  battle: GuildBattleState;
  hunt: HuntDefinition;
}
