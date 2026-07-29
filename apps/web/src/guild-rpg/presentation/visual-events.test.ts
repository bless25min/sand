import type { GuildBattleEvent } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { projectVisualEvents } from './visual-events';

const events: readonly GuildBattleEvent[] = [
  {
    id: 10,
    kind: 'skill_cast',
    message: '布蘭施放熔火猛擊',
    actorId: 'brann',
    targetId: 'wolf_alpha',
    element: 'fire',
  },
  {
    id: 11,
    kind: 'damage',
    message: '造成 48 傷害',
    actorId: 'brann',
    targetId: 'wolf_alpha',
    amount: 48,
    element: 'fire',
    specializationId: 'blast',
    triggerId: 'target_burning',
  },
  {
    id: 12,
    kind: 'status_applied',
    message: '燃燒增加 6 層',
    actorId: 'brann',
    targetId: 'wolf_alpha',
    amount: 6,
    element: 'fire',
  },
  {
    id: 13,
    kind: 'bounce',
    message: '烈焰折返',
    actorId: 'brann',
    targetId: 'wolf_alpha',
    amount: 18,
    element: 'fire',
  },
  {
    id: 14,
    kind: 'finisher',
    message: '第六棒終結',
    actorId: 'kyro',
    targetId: 'wolf_alpha',
    amount: 324,
    element: 'fire',
  },
];

describe('visual battle events', () => {
  it('projects engine events into visual phases without using event prose as the headline', () => {
    const projected = projectVisualEvents(events, 4, false);

    expect(projected.map(({ phase }) => phase)).toEqual([
      'windup',
      'impact',
      'aftermath',
      'travel',
      'finisher',
    ]);
    expect(projected[1]).toMatchObject({
      headline: '重擊',
      detail: '造成 48 傷害',
      number: -48,
      polarity: 'damage',
      camera: 'punch',
      specializationId: 'blast',
      triggerId: 'target_burning',
    });
    expect(projected[2]).toMatchObject({
      headline: '燃燒疊層',
      status: 'burn',
      number: 6,
    });
    expect(projected[3]).toMatchObject({
      headline: '彈射折返',
      route: 'bounce',
    });
  });

  it('makes every relay strictly stronger and reserves the longest beat for the sixth finisher', () => {
    const impactPower = [1, 2, 3, 4, 5, 6].map(
      (relay) => projectVisualEvents(events.slice(1, 2), relay, false)[0]!.intensity,
    );
    const finisher = projectVisualEvents(events.slice(-1), 6, false)[0]!;

    expect(
      impactPower.every((power, index) => index === 0 || power > impactPower[index - 1]!),
    ).toBe(true);
    expect(finisher).toMatchObject({
      phase: 'finisher',
      headline: '全軍終結',
      intensity: 100,
    });
    expect(finisher.durationMs).toBeLessThanOrEqual(700);
  });

  it('keeps all semantic states in reduced motion while making them immediately inspectable', () => {
    const projected = projectVisualEvents(events, 6, true);

    expect(projected).toHaveLength(events.length);
    expect(projected.every(({ durationMs }) => durationMs === 0)).toBe(true);
    expect(projected.map(({ headline }) => headline)).toEqual([
      '熔火起手',
      '重擊',
      '燃燒疊層',
      '彈射折返',
      '全軍終結',
    ]);
  });

  it('presents overkill as accumulated power instead of negative damage', () => {
    const overkill = projectVisualEvents(
      [{ id: 15, kind: 'overkill', message: 'OVERKILL', amount: 15 }],
      6,
      false,
    )[0]!;

    expect(overkill).toMatchObject({
      headline: '過量殲滅',
      number: 15,
      phase: 'finisher',
    });
  });

  it('holds enemy damage, guard, and dodge long enough to read their distinct outcomes', () => {
    const enemyResults: readonly GuildBattleEvent[] = [
      {
        id: 20,
        kind: 'enemy_attack',
        message: '首領撲擊布蘭',
        actorId: 'wolf_alpha',
        targetId: 'brann',
        amount: 1,
      },
      {
        id: 21,
        kind: 'guard',
        message: '布蘭完全格擋',
        actorId: 'wolf_alpha',
        targetId: 'brann',
        amount: 0,
      },
      {
        id: 22,
        kind: 'dodge',
        message: '萊拉高速閃避',
        actorId: 'wolf_alpha',
        targetId: 'lyra',
        amount: 0,
      },
    ];
    const projected = projectVisualEvents(enemyResults, 1, false);

    expect(projected.map(({ durationMs }) => durationMs)).toEqual([320, 280, 300]);
    expect(projected.map(({ phase }) => phase)).toEqual(['impact', 'impact', 'aftermath']);
    expect(projected.map(({ number }) => number)).toEqual([-1, undefined, undefined]);
  });
});
