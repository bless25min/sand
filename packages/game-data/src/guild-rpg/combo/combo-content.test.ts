import {
  SPECTACLE_CUE_IDS,
  SPECTACLE_MOTIF_IDS,
  type ComboContent,
  type HuntDefinition,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { GUILD_COMBO_CONTENT } from './index';
import { GUILD_HUNTS } from './hunts';
import { GUILD_GAME_CONTENT, GUILD_QUESTS, GUILD_ZONES } from '../index';
import {
  validateCampaignContent,
  validateComboContent,
  validateHuntBossPhases,
} from './validate-content';

describe('combo content factory', () => {
  it('ships four valid anchor builds through the bounded vocabulary', () => {
    expect(validateComboContent(GUILD_COMBO_CONTENT)).toEqual([]);
    expect(Object.keys(GUILD_COMBO_CONTENT.cards)).toHaveLength(16);
    expect(GUILD_COMBO_CONTENT.builds.map((build) => build.id)).toEqual([
      'retaliation',
      'ricochet',
      'healing_overflow',
      'command_storm',
    ]);
    for (const build of GUILD_COMBO_CONTENT.builds) {
      expect(build.fantasy, build.id).not.toBe('');
      expect(build.payoffLabel, build.id).not.toBe('');
      expect(build.accent, build.id).not.toBe('');
      expect(SPECTACLE_MOTIF_IDS, build.id).toContain(build.accent);
      expect(build.signatureCardIds.length, build.id).toBeGreaterThanOrEqual(3);
      expect(
        build.signatureCardIds.every((cardId) => build.cardIds.includes(cardId)),
        build.id,
      ).toBe(true);
      expect(build.defaultCardIds, build.id).toHaveLength(8);
      expect(new Set(build.defaultCardIds).size, build.id).toBe(8);
      expect(
        build.defaultCardIds.every((cardId) => build.cardIds.includes(cardId)),
        build.id,
      ).toBe(true);
      expect(
        build.signatureCardIds.every((cardId) => build.defaultCardIds.includes(cardId)),
        build.id,
      ).toBe(true);
    }
  });

  it('ships a complete four-zone campaign with exact release depth', () => {
    expect(validateCampaignContent(GUILD_GAME_CONTENT)).toEqual([]);
    expect(GUILD_ZONES).toHaveLength(4);
    expect(GUILD_QUESTS).toHaveLength(12);
    expect(GUILD_HUNTS).toHaveLength(12);
    expect(
      new Set(GUILD_QUESTS.flatMap((quest) => quest.enemies.map((enemy) => enemy.id))).size,
    ).toBe(18);
    expect(
      new Set(GUILD_HUNTS.flatMap((hunt) => (hunt.bossEnemyId ? [hunt.bossEnemyId] : []))).size,
    ).toBe(6);
    expect(GUILD_COMBO_CONTENT.builds).toHaveLength(4);
    expect(GUILD_GAME_CONTENT.challenges).toHaveLength(48);
    expect(GUILD_GAME_CONTENT.ascensions).toHaveLength(3);
    expect(new Set(GUILD_GAME_CONTENT.challenges.map((challenge) => challenge.id)).size).toBe(48);
    for (const hunt of GUILD_HUNTS) {
      expect(
        GUILD_GAME_CONTENT.challenges
          .filter((challenge) => challenge.huntId === hunt.id)
          .map((challenge) => challenge.kind)
          .sort(),
        hunt.id,
      ).toEqual(['build_route', 'execution', 'one_command', 'overkill']);
    }
    expect(new Set(GUILD_GAME_CONTENT.codexEntries.map((entry) => entry.category))).toEqual(
      new Set(['enemy', 'equipment', 'rule', 'build', 'zone', 'challenge']),
    );
  });

  it('keeps every zone ordered, traceable, and mechanically complete', () => {
    const questIds = GUILD_QUESTS.map((quest) => quest.id);
    const zoneQuestIds = GUILD_ZONES.flatMap((zone) => zone.questIds);

    expect(zoneQuestIds).toEqual(questIds);
    expect(new Set(zoneQuestIds).size).toBe(12);
    for (const zone of GUILD_ZONES) {
      expect(zone.questIds).toHaveLength(3);
      expect(zone.transitionLabel).not.toBe('');
      for (const questId of zone.questIds) {
        expect(GUILD_QUESTS.find((quest) => quest.id === questId)?.zoneId).toBe(zone.id);
      }
    }
  });

  it('authors traceable audiovisual identity for every card, rule, enemy, and hunt', () => {
    for (const card of Object.values(GUILD_COMBO_CONTENT.cards)) {
      expect(SPECTACLE_CUE_IDS, card.id).toContain(card.cueId);
    }
    for (const rule of Object.values(GUILD_COMBO_CONTENT.rules)) {
      expect(SPECTACLE_CUE_IDS, rule.id).toContain(rule.cueId);
    }
    for (const hunt of GUILD_HUNTS) {
      const spectacleCues = hunt.spectacleCues!;
      expect(
        spectacleCues.map((cue) => cue.beat),
        hunt.id,
      ).toEqual(['opening', 'execution', 'annihilation']);
      expect(new Set(spectacleCues.map((cue) => cue.id)).size, hunt.id).toBe(3);
      for (const cue of spectacleCues) {
        expect(SPECTACLE_CUE_IDS, `${hunt.id}:${cue.id}`).toContain(cue.cueId);
      }
      for (const enemy of hunt.enemies) {
        const identity = enemy.spectacle!;
        expect(identity.family, enemy.enemyId).not.toBe('');
        expect(identity.role, enemy.enemyId).not.toBe('');
        expect(identity.palette, enemy.enemyId).not.toBe('');
        expect(identity.aura, enemy.enemyId).not.toBe('');
        expect(identity.defeat, enemy.enemyId).not.toBe('');
      }
    }
  });

  it('gives every hunt readable counters, exclusive equipment, and an annihilation chest', () => {
    const buildIds = GUILD_COMBO_CONTENT.builds.map((build) => build.id).sort();

    for (const hunt of GUILD_HUNTS) {
      expect(hunt.annihilationChest, hunt.id).toBeDefined();
      expect(
        hunt.enemies.every(
          (enemy) =>
            (enemy.traits?.length ?? 0) > 0 &&
            enemy.equipment.length > 0 &&
            enemy.equipment.every(
              (item) =>
                item.recommendedBuildIds.length > 0 &&
                item.recommendedBuildIds.every((buildId) => buildIds.includes(buildId)),
            ),
        ),
        hunt.id,
      ).toBe(true);
      expect(
        hunt.annihilationChest?.recommendedBuildIds.every((buildId) => buildIds.includes(buildId)),
        hunt.id,
      ).toBe(true);
      const favoredBuildIds = [
        ...new Set(
          hunt.enemies.flatMap(
            (enemy) => enemy.traits?.flatMap((trait) => trait.counterBuildIds) ?? [],
          ),
        ),
      ].sort();
      expect(favoredBuildIds, hunt.id).toEqual(buildIds);
    }
  });

  it('declares a traceable wolf execution phase with valid enemy references', () => {
    const hunt = GUILD_HUNTS.find((candidate) => candidate.id === 'border-pack-hunt')!;
    const enemyIds = new Set(hunt.enemies.map((enemy) => enemy.enemyId));

    expect(hunt.bossPhases).toEqual([
      {
        id: 'alpha-execution',
        bossEnemyId: 'wolf_alpha',
        activateAfterEnemyIds: ['wolf_scout', 'wolf_hunter'],
        pressureLabel: '孤王處刑窗',
        cueId: 'wolf-alpha-execution',
      },
    ]);
    expect(
      hunt.bossPhases?.every(
        (phase) =>
          enemyIds.has(phase.bossEnemyId) &&
          phase.activateAfterEnemyIds.every((enemyId) => enemyIds.has(enemyId)),
      ),
    ).toBe(true);
    expect(validateHuntBossPhases(GUILD_HUNTS)).toEqual([]);
  });

  it('diagnoses duplicate, dangling, and silent boss phases', () => {
    const invalidHunt = {
      ...GUILD_HUNTS[0]!,
      bossPhases: [
        {
          id: 'broken',
          bossEnemyId: 'missing-boss',
          activateAfterEnemyIds: ['missing-guard'],
          pressureLabel: '壞處決窗',
          cueId: '',
        },
        {
          id: 'broken',
          bossEnemyId: GUILD_HUNTS[0]!.enemies[0]!.enemyId,
          activateAfterEnemyIds: [],
          pressureLabel: '重複處決窗',
          cueId: 'duplicate',
        },
      ],
    };

    expect(validateHuntBossPhases([invalidHunt]).map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        'duplicate_boss_phase',
        'unknown_boss_enemy',
        'unknown_phase_activator',
        'missing_boss_phase_cue',
      ]),
    );
  });

  it('diagnoses missing enemy spectacle and incomplete hunt beats', () => {
    const enemyWithSpectacle = GUILD_HUNTS[0]!.enemies[0]!;
    const enemyWithoutSpectacle = {
      enemyId: enemyWithSpectacle.enemyId,
      material: enemyWithSpectacle.material,
      equipment: enemyWithSpectacle.equipment,
      ...(enemyWithSpectacle.traits ? { traits: enemyWithSpectacle.traits } : {}),
    };
    const invalidHunt: HuntDefinition = {
      ...GUILD_HUNTS[0]!,
      spectacleCues: GUILD_HUNTS[0]!.spectacleCues!.slice(0, 2),
      enemies: [enemyWithoutSpectacle],
    };

    expect(validateHuntBossPhases([invalidHunt]).map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining(['missing_enemy_spectacle', 'incomplete_hunt_spectacle']),
    );
  });

  it('diagnoses unsupported grammar and missing graph references', () => {
    const invalid = {
      cards: {
        broken: {
          id: 'broken',
          ownerId: 'nobody',
          name: '壞卡',
          description: '壞卡',
          emitsTags: [],
          effects: [{ kind: 'teleport', target: 'void', amount: 1 }],
        },
      },
      rules: {
        broken: {
          id: 'broken',
          name: '壞規則',
          description: '壞規則',
          trigger: 'maybe',
          selector: 'void',
          effects: [{ kind: 'teleport' }],
          transforms: ['spiral'],
        },
      },
      builds: [
        {
          id: 'broken',
          name: '壞 Build',
          description: '壞 Build',
          cardIds: ['missing-card'],
          ruleIds: ['missing-rule'],
        },
      ],
    } as unknown as ComboContent;

    const codes = validateComboContent(invalid).map((diagnostic) => diagnostic.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'invalid_card_effect',
        'invalid_card_target',
        'invalid_trigger',
        'invalid_selector',
        'invalid_rule_effect',
        'invalid_transform',
        'unknown_card',
        'unknown_rule',
      ]),
    );
  });
});
