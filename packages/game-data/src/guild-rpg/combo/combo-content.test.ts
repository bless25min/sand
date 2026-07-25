import type { ComboContent } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { GUILD_COMBO_CONTENT } from './index';
import { GUILD_HUNTS } from './hunts';
import { validateComboContent } from './validate-content';

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
