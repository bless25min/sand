import type { BattleUnit } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { projectUnitSpectacleState } from './unit-spectacle-state';

const ENEMY: BattleUnit = {
  id: 'alpha',
  name: 'Alpha',
  side: 'enemies',
  currentHp: 100,
  stats: { hp: 100, attack: 10, defense: 5, speed: 5, healing: 0 },
  threat: 0,
  gauge: 80,
  guarding: false,
  isLeader: false,
  skillIds: [],
};

describe('unit spectacle state', () => {
  it('prioritizes defeated and execution states over transient impact', () => {
    expect(
      projectUnitSpectacleState({
        unit: { ...ENEMY, currentHp: 0 },
        impact: { kind: 'hit', label: 'IMPACT', targetId: 'alpha' },
        executionOpen: true,
      }),
    ).toBe('defeated');
    expect(
      projectUnitSpectacleState({
        unit: ENEMY,
        impact: { kind: 'hit', label: 'IMPACT', targetId: 'alpha' },
        executionOpen: true,
      }),
    ).toBe('execution');
  });

  it('projects target impact, enemy pressure, and hero idle states', () => {
    expect(
      projectUnitSpectacleState({
        unit: ENEMY,
        impact: { kind: 'ricochet', label: 'RICOCHET', targetId: 'alpha' },
        executionOpen: false,
      }),
    ).toBe('hit');
    expect(
      projectUnitSpectacleState({
        unit: ENEMY,
        impact: { kind: 'stack', label: 'STACKING' },
        executionOpen: false,
      }),
    ).toBe('pressure');
    expect(
      projectUnitSpectacleState({
        unit: { ...ENEMY, id: 'hero', side: 'heroes', gauge: 0 },
        impact: { kind: 'stack', label: 'STACKING' },
        executionOpen: false,
      }),
    ).toBe('idle');
  });
});
