import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import {
  calculateHuntRewards,
  chooseNextAdventurer,
  createGuildProfile,
  createSeededRandom,
  previewSkillOutcome,
  previewForgeEquipmentItem,
  projectBattlePlayback,
  resolveSkill,
  startGuildQuest,
  type ResolveSkillInput,
  type ForgeAction,
  type ForgeOptions,
  type SkillEngineContent,
} from '@expedition/simulation-core';
import type { GuildBattleState, GuildProfile } from '@expedition/shared-types';
export { projectBattlePlayback };
export {
  createFirstHuntCoach,
  GUILD_PREFERENCES_KEY,
  GUILD_RPG_ACTION_TYPES,
  GUILD_SAVE_KEY,
  createGuildSession,
  createGuildSessionController,
  getGuildProfileValidationIssues,
  loadGuildSession,
  parseGuildSave,
  reduceGuildSession,
  storeGuildSession,
} from '@expedition/guild-session-core';
export {
  closeLootDetail,
  compilePresentation,
  createCinematicBeatPlan,
  createComboTrack,
  createCommandLens,
  createGuildShellModel,
  createLootLayout,
  createPartyPageModel,
  createQuestPageModel,
  formatComboCue,
  formatTriggerCue,
  playPresentationSequence,
  reduceCommandSelection,
  resolveBattleFormation,
  resolveBattleLayout,
  resolveDesignResolution,
  resolveGuildShellLayout,
  resolveRouteVisual,
} from '@expedition/presentation-core';

export interface RuntimeSkillInput {
  profile: GuildProfile;
  battle: GuildBattleState;
  actorId: string;
  skillId: string;
  targetId: string;
}

const createSkillContent = (profile: GuildProfile): SkillEngineContent => ({
  skills: Object.fromEntries(profile.skillInventory.map((skill) => [skill.id, skill])),
  elements: GUILD_GAME_CONTENT.elements,
  specializations: GUILD_GAME_CONTENT.skillSpecializations,
  triggers: GUILD_GAME_CONTENT.triggerConditions,
  forms: GUILD_GAME_CONTENT.skillForms,
  hunts: GUILD_GAME_CONTENT.hunts,
});

const toResolveInput = (input: RuntimeSkillInput): ResolveSkillInput => ({
  battle: input.battle,
  actorId: input.actorId,
  skillId: input.skillId,
  targetId: input.targetId,
  content: createSkillContent(input.profile),
});

export const createProfile = () => createGuildProfile(GUILD_GAME_CONTENT);

export const startQuest = (profile: GuildProfile, questId: string) =>
  startGuildQuest(profile, questId, GUILD_GAME_CONTENT);

export const chooseNextHero = (battle: GuildBattleState, actorId: string): GuildBattleState => {
  if (!battle.roundOrder) throw new Error('Battle has no round order.');
  const livingHeroIds = battle.units
    .filter(({ side, currentHp }) => side === 'heroes' && currentHp > 0)
    .map(({ id }) => id);
  return {
    ...battle,
    roundOrder: chooseNextAdventurer(battle.roundOrder, actorId, livingHeroIds),
  };
};

export const previewSkill = (input: RuntimeSkillInput) =>
  previewSkillOutcome(toResolveInput(input));

export const resolveAction = (input: RuntimeSkillInput) => resolveSkill(toResolveInput(input));

export const previewForge = (
  profile: GuildProfile,
  itemId: string,
  forgeAction: ForgeAction,
  options?: ForgeOptions,
) => previewForgeEquipmentItem(profile, itemId, forgeAction, GUILD_GAME_CONTENT, options);

export const calculateRewards = (profile: GuildProfile, battle: GuildBattleState) => {
  if (battle.status !== 'victory') return undefined;
  const hunt = GUILD_GAME_CONTENT.hunts.find(({ questId }) => questId === battle.questId);
  if (!hunt) throw new Error(`No hunt content for quest ${battle.questId}`);
  return calculateHuntRewards(
    {
      profile,
      battle,
      hunt,
      equipmentAffixes: GUILD_GAME_CONTENT.equipmentAffixes,
      content: GUILD_GAME_CONTENT,
    },
    createSeededRandom(`${battle.seed}:hunt-loot`),
  );
};

export const runtimeContent = GUILD_GAME_CONTENT;
