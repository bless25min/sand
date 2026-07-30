import type { GuildProfile } from '@expedition/shared-types';

import type { GuildPage, GuildRpgState, SkillWorkspace } from './reducer';
import type { FirstHuntCoachStep } from './tutorial';

export const GUILD_SESSION_KEY = 'expedition:guild-rpg:session:v1';

const GUILD_PAGES = new Set<GuildPage>(['quest', 'party', 'skills', 'equipment']);
const SKILL_WORKSPACES = new Set<SkillWorkspace>(['loadout', 'fusion']);
const TUTORIAL_STEPS = new Set<FirstHuntCoachStep>([
  'start_hunt',
  'select_target',
  'relay_1',
  'relay_2',
  'relay_3',
  'relay_4',
  'relay_5',
  'relay_6',
  'collect_reward',
  'equip_loot',
  'forge_loot',
  'inspect_skills',
  'equip_skill',
  'fuse_skill',
  'equip_fused',
  'replay',
  'complete',
]);

export type GuildSessionSnapshot = Pick<
  GuildRpgState,
  | 'page'
  | 'skillWorkspace'
  | 'tutorialStep'
  | 'selectedHeroId'
  | 'selectedSkillSlot'
  | 'lastFusedSkillId'
  | 'tutorialSkillId'
>;

interface StoredGuildSessionSnapshot extends GuildSessionSnapshot {
  version: 1;
}

const optionalSkillId = (value: unknown, profile: GuildProfile) =>
  typeof value === 'string' && profile.skillInventory.some(({ id }) => id === value)
    ? value
    : undefined;

export function serializeGuildSessionSnapshot(state: GuildRpgState): string {
  const snapshot: StoredGuildSessionSnapshot = {
    version: 1,
    page: state.page,
    skillWorkspace: state.skillWorkspace,
    tutorialStep: state.tutorialStep,
    selectedHeroId: state.selectedHeroId,
    selectedSkillSlot: state.selectedSkillSlot,
    ...(state.lastFusedSkillId ? { lastFusedSkillId: state.lastFusedSkillId } : {}),
    ...(state.tutorialSkillId ? { tutorialSkillId: state.tutorialSkillId } : {}),
  };
  return JSON.stringify(snapshot);
}

export function parseGuildSessionSnapshot(
  serialized: string | null,
  profile: GuildProfile,
): GuildSessionSnapshot | undefined {
  if (!serialized) return undefined;
  try {
    const value: unknown = JSON.parse(serialized);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
    const record = value as Record<string, unknown>;
    if (
      record.version !== 1 ||
      typeof record.page !== 'string' ||
      !GUILD_PAGES.has(record.page as GuildPage) ||
      typeof record.skillWorkspace !== 'string' ||
      !SKILL_WORKSPACES.has(record.skillWorkspace as SkillWorkspace) ||
      typeof record.tutorialStep !== 'string' ||
      !TUTORIAL_STEPS.has(record.tutorialStep as FirstHuntCoachStep) ||
      typeof record.selectedHeroId !== 'string' ||
      !profile.party.some(({ definitionId }) => definitionId === record.selectedHeroId) ||
      !Number.isInteger(record.selectedSkillSlot) ||
      Number(record.selectedSkillSlot) < 0 ||
      Number(record.selectedSkillSlot) >= 6
    ) {
      return undefined;
    }
    const lastFusedSkillId = optionalSkillId(record.lastFusedSkillId, profile);
    const tutorialSkillId = optionalSkillId(record.tutorialSkillId, profile);
    return {
      page: record.page as GuildPage,
      skillWorkspace: record.skillWorkspace as SkillWorkspace,
      tutorialStep: record.tutorialStep as FirstHuntCoachStep,
      selectedHeroId: record.selectedHeroId,
      selectedSkillSlot: Number(record.selectedSkillSlot),
      ...(lastFusedSkillId ? { lastFusedSkillId } : {}),
      ...(tutorialSkillId ? { tutorialSkillId } : {}),
    };
  } catch {
    return undefined;
  }
}
