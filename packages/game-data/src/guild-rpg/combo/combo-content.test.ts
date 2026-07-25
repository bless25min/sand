import type { ComboContent } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { GUILD_COMBO_CONTENT } from './index';
import { GUILD_HUNTS } from './hunts';
import { validateComboContent, validateHuntBossPhases } from './validate-content';

describe('combo content factory', () => {
  it('ships three valid anchor builds through the bounded vocabulary', () => {
    expect(validateComboContent(GUILD_COMBO_CONTENT)).toEqual([]);
    expect(GUILD_COMBO_CONTENT.builds.map((build) => build.id)).toEqual([
      'retaliation',
      'ricochet',
      'healing_overflow',
    ]);
    for (const build of GUILD_COMBO_CONTENT.builds) {
      expect(build.fantasy, build.id).not.toBe('');
      expect(build.payoffLabel, build.id).not.toBe('');
      expect(build.accent, build.id).not.toBe('');
      expect(build.signatureCardIds.length, build.id).toBeGreaterThanOrEqual(3);
      expect(
        build.signatureCardIds.every((cardId) => build.cardIds.includes(cardId)),
        build.id,
      ).toBe(true);
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
