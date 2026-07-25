import type { BattleUnit, HuntRewards } from '@expedition/shared-types';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BattleUnitCard } from './BattleUnitCard';
import { CombatSpectacleLayers } from './CombatSpectacleLayers';
import { RewardSpectacleLayers } from './RewardSpectacleLayers';

const ENEMY: BattleUnit = {
  id: 'alpha',
  name: 'Alpha',
  side: 'enemies',
  currentHp: 50,
  stats: { hp: 100, attack: 10, defense: 5, speed: 5, healing: 0 },
  threat: 0,
  gauge: 90,
  guarding: false,
  isLeader: false,
  skillIds: [],
};

describe('combat spectacle layers', () => {
  it('renders bounded hit-stop, flash, trails, numbers, and execution backdrop metadata', () => {
    const markup = renderToStaticMarkup(
      <CombatSpectacleLayers
        impact={{ kind: 'overkill', label: 'OVERKILL +99', targetId: 'alpha', amount: 99 }}
        motif="ember"
        enemyIdentity={{
          family: 'greyfang',
          role: 'boss',
          palette: 'blood-amber',
          aura: 'moon-howl',
          defeat: 'fang-shatter',
        }}
        huntCue={{
          id: 'border-pack-erased',
          beat: 'annihilation',
          cueId: 'annihilation',
          label: 'Pack erased',
          palette: 'gold-fang',
        }}
      />,
    );

    expect(markup).toContain('data-spectacle-cue="overkill"');
    expect(markup).toContain('data-intensity="5"');
    expect(markup).toContain('gr-spectacle__backdrop');
    expect(markup).toContain('gr-spectacle__flash');
    expect(markup.match(/class="gr-spectacle__trail"/g)).toHaveLength(3);
    expect(markup).toContain('gr-spectacle__number');
    expect(markup).toContain('OVERKILL +99');
    expect(markup).toContain('--spectacle-primary:#ff6b35');
    expect(markup).toContain('--enemy-palette:blood-amber');
    expect(markup).toContain('data-hunt-palette="gold-fang"');
  });

  it('exposes unit state and enemy identity without changing battle ownership', () => {
    const markup = renderToStaticMarkup(
      <BattleUnitCard
        unit={ENEMY}
        selected={false}
        impact={{ kind: 'hit', label: 'IMPACT 50', targetId: 'alpha', amount: 50 }}
        sensation={{
          id: 'alpha',
          pressureLabel: '即將攻擊',
          guardedByNames: [],
          counteredByCurrentBuild: true,
          identity: {
            family: 'greyfang',
            role: 'boss',
            palette: 'blood-amber',
            aura: 'moon-howl',
            defeat: 'fang-shatter',
          },
        }}
      />,
    );

    expect(markup).toContain('data-unit-state="hit"');
    expect(markup).toContain('data-enemy-family="greyfang"');
    expect(markup).toContain('data-enemy-role="boss"');
    expect(markup).toContain('--enemy-palette:blood-amber');
  });
});

describe('reward spectacle layers', () => {
  it('renders loot, chest, and legendary reveals as distinct layers', () => {
    const rewards = {
      questId: 'border_pack',
      huntId: 'greyfang_border',
      successful: true,
      experience: 100,
      gold: 200,
      clearMs: 500,
      materials: [],
      axes: {
        multiKill: 3,
        chainWipe: true,
        annihilation: true,
        perfectAnnihilation: true,
        bossChest: true,
        quantityMultiplier: 3,
        individualOverkill: {},
        sharedOverflow: 99,
        totalOverkill: 99,
      },
      items: [
        {
          id: 'legend',
          baseId: 'legend-base',
          name: 'Legend',
          slot: 'weapon',
          rarity: 'legendary',
          mainStat: { stat: 'attack', value: 99 },
          affixes: [],
          sellValue: 99,
          sourceEnemyId: 'alpha',
          qualityScore: 999,
          jackpot: true,
          recommendedBuildIds: [],
        },
      ],
    } as HuntRewards;
    const markup = renderToStaticMarkup(<RewardSpectacleLayers rewards={rewards} />);

    expect(markup).toContain('data-reward-cues="loot chest legendary"');
    expect(markup).toContain('data-reward-cue="chest"');
    expect(markup).toContain('data-reward-cue="legendary"');
  });
});
