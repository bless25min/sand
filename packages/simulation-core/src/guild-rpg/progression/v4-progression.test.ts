import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildSkillItem, OwnedSkill, SkillComponent } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import type { RandomSource } from '../../rng/random-source';
import { createGuildProfile } from '../profile/create-profile';
import { startGuildQuest } from '../profile/start-quest';
import { dismantleSkill } from '../skills/dismantle-skill';
import { fuseSkills } from '../skills/fuse-skills';
import { replaceFusedComponent } from '../skills/replace-fused-component';
import { generateSkillDrop } from './generate-skill-drop';
import { migrateProfileV5 } from './migrate-profile-v5';
import { evaluateHuntChallenges } from './replay-progression';

class FixedRandom implements RandomSource {
  constructor(private readonly value: number) {}
  next() {
    return this.value;
  }
  nextInt(minimum: number, maximum: number) {
    return this.value < 0.5 ? minimum : maximum;
  }
}

const component = (id: string, element: SkillComponent['element']): SkillComponent => ({
  id: `${id}:component`,
  qualityRank: 3,
  formId: `${element}.stack.on_hit`,
  element,
  specializationId: 'stack',
  triggerId: 'on_hit',
  power: 3,
  layerStrength: 3,
  triggerAddition: 3,
  repeatCount: 2,
});

const owned = (id: string, element: SkillComponent['element']): OwnedSkill => ({
  id,
  name: id,
  stars: 1,
  components: [component(id, element)],
});

describe('version-five progression', () => {
  it('creates six heroes with six equipped skills and no character-level or Build gate', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);

    expect(profile.version).toBe(5);
    expect(profile.party).toHaveLength(6);
    expect(profile.defaultOrder).toEqual(['brann', 'lyra', 'elin', 'seph', 'lorne', 'kyro']);
    expect(profile.party.every((hero) => hero.skillIds.length === 6)).toBe(true);
    expect(profile.skillInventory.length).toBeGreaterThanOrEqual(36);
    expect(profile).not.toHaveProperty('selectedBuildId');
    expect(profile).not.toHaveProperty('loadouts');
    expect(profile.party.every((hero) => !('level' in hero) && !('experience' in hero))).toBe(true);
  });

  it('fuses two or three same-element skills and dismantles them without loss', () => {
    const source = [owned('fire-a', 'fire'), owned('fire-b', 'fire'), owned('fire-c', 'fire')];
    const twoStar = fuseSkills(source.slice(0, 2), 'fused-two', '雙星焚潮');
    const threeStar = fuseSkills(source, 'fused-three', '三星焚潮');

    expect(twoStar.stars).toBe(2);
    expect(threeStar.stars).toBe(3);
    expect(threeStar.components.map(({ id }) => id)).toEqual(
      source.map((skill) => skill.components[0].id),
    );
    expect(dismantleSkill(threeStar)).toEqual(source);
    expect(() => fuseSkills([source[0]!, owned('grass-a', 'grass')], 'bad', '錯誤融合')).toThrow(
      'same element',
    );
  });

  it('replaces exactly one fused component and returns the removed skill', () => {
    const original = fuseSkills(
      [owned('fire-a', 'fire'), owned('fire-b', 'fire')],
      'fused',
      '融合',
    );
    const replacement = owned('fire-c', 'fire');
    const result = replaceFusedComponent(original, 1, replacement);

    expect(result.skill.components.map(({ id }) => id)).toEqual([
      'fire-a:component',
      'fire-c:component',
    ]);
    expect(result.removedSkill.id).toBe('fire-b');
  });

  it('starts deterministic skill drops at atomic quality one', () => {
    const first = generateSkillDrop(
      {
        id: 'test-drop',
        elements: ['fire'],
        specializationIds: ['multistrike'],
        triggerIds: ['on_repeat_hit'],
      },
      7,
      GUILD_GAME_CONTENT,
      new FixedRandom(0),
    );
    const jackpot = generateSkillDrop(
      {
        id: 'test-drop',
        elements: ['fire'],
        specializationIds: ['multistrike'],
        triggerIds: ['on_repeat_hit'],
      },
      7,
      GUILD_GAME_CONTENT,
      new FixedRandom(1),
    );

    expect(first).toEqual(
      generateSkillDrop(
        {
          id: 'test-drop',
          elements: ['fire'],
          specializationIds: ['multistrike'],
          triggerIds: ['on_repeat_hit'],
        },
        7,
        GUILD_GAME_CONTENT,
        new FixedRandom(0),
      ),
    );
    expect(first.components[0]).toMatchObject({
      qualityRank: 1,
      power: 1,
      layerStrength: 1,
      triggerAddition: 1,
      repeatCount: 1,
    });
    expect(jackpot.components[0]).toMatchObject({
      qualityRank: 1,
      power: 1,
      layerStrength: 1,
      triggerAddition: 1,
      repeatCount: 1,
    });
  });

  it('migrates v1-v3 progress, adds three heroes, and converts levels into materials', () => {
    const legacy = {
      version: 3,
      leaderId: 'lyra',
      party: ['brann', 'lyra', 'elin'].map((definitionId, index) => ({
        definitionId,
        level: index + 2,
        experience: 20,
        equipment: {},
      })),
      inventory: [],
      materials: { hunter_sinew: 4 },
      gold: 777,
      unlockedQuestIds: ['border_pack', 'moonroad_pursuit'],
      questRecords: { border_pack: { clears: 3 } },
      nextLootSeed: 9,
      selectedBuildId: 'retaliation',
      loadouts: { retaliation: ['brann_guard', 'lyra_mark'] },
      completedChallengeIds: [],
      discoveredEquipmentIds: [],
      discoveredRuleIds: [],
      forgeSequence: 0,
      progressionEvents: [],
    };

    const migrated = migrateProfileV5(legacy, GUILD_GAME_CONTENT);

    expect(migrated.version).toBe(5);
    expect(migrated.party).toHaveLength(6);
    expect(migrated.gold).toBe(777);
    expect(migrated.unlockedQuestIds).toEqual(legacy.unlockedQuestIds);
    expect(migrated.questRecords.border_pack?.clears).toBe(3);
    expect(migrated.materials.hunter_sinew).toBe(4);
    expect(migrated.materials.legacy_essence).toBeGreaterThan(0);
    expect(
      migrated.skillInventory.some((skill: GuildSkillItem) => skill.id.includes('brann_guard')),
    ).toBe(true);
  });

  it('evaluates every hunt challenge from v4 relay events without combo or Build state', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const hunt = GUILD_GAME_CONTENT.hunts[0]!;
    const base = startGuildQuest(profile, hunt.questId, GUILD_GAME_CONTENT);
    const executionEnemyId =
      GUILD_GAME_CONTENT.challenges.find(
        (challenge) => challenge.huntId === hunt.id && challenge.kind === 'execution',
      )?.executionEnemyId ?? hunt.enemies.at(-1)!.enemyId;
    const threshold =
      GUILD_GAME_CONTENT.challenges.find(
        (challenge) => challenge.huntId === hunt.id && challenge.kind === 'overkill',
      )?.overkillThreshold ?? 1;
    const battle = {
      ...base,
      status: 'victory' as const,
      units: base.units.map((unit) => (unit.side === 'enemies' ? { ...unit, currentHp: 0 } : unit)),
      events: [
        ...base.events,
        { id: 1, kind: 'unit_defeated' as const, message: '擊破', targetId: executionEnemyId },
        {
          id: 2,
          kind: 'overkill' as const,
          message: 'OVERKILL',
          targetId: executionEnemyId,
          amount: threshold,
        },
        { id: 3, kind: 'relay' as const, message: 'RELAY ×6', amount: 6 },
      ],
      skillHistory: [
        { actorId: 'brann', skillId: 'a', element: 'fire' as const, roundIndex: 1 },
        { actorId: 'lyra', skillId: 'b', element: 'grass' as const, roundIndex: 1 },
        { actorId: 'elin', skillId: 'c', element: 'water' as const, roundIndex: 1 },
      ],
      roundIndex: 2,
    };

    expect(
      new Set(
        evaluateHuntChallenges(profile, battle, hunt, GUILD_GAME_CONTENT).map(({ kind }) => kind),
      ),
    ).toEqual(new Set(['one_command', 'overkill', 'build_route', 'execution']));
  });
});
