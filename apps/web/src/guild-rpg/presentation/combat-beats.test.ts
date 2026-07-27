import type { GuildBattleEvent } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { advanceCombatPlayback, createCombatBeats, relayPresentation } from './combat-beats';

const events: readonly GuildBattleEvent[] = [
  {
    id: 1,
    kind: 'skill_cast',
    message: '布蘭施放熔火猛擊',
    actorId: 'brann',
    targetId: 'wolf',
    skillId: 'brann_burn',
    element: 'fire',
  },
  {
    id: 2,
    kind: 'damage',
    message: '造成 38 傷害',
    actorId: 'brann',
    targetId: 'wolf',
    amount: 38,
    element: 'fire',
  },
  {
    id: 3,
    kind: 'status_applied',
    message: '燃燒增加 4 層',
    actorId: 'brann',
    targetId: 'wolf',
    amount: 4,
    element: 'fire',
  },
  {
    id: 4,
    kind: 'bounce',
    message: '火焰彈射',
    actorId: 'brann',
    targetId: 'wolf_guard',
    amount: 12,
    element: 'fire',
  },
  {
    id: 5,
    kind: 'relay',
    message: '接力提升至 3',
    actorId: 'brann',
    amount: 3,
  },
];

describe('combat beat presentation', () => {
  it('projects traceable battle events into ordered visible beats', () => {
    expect(createCombatBeats(events, 3)).toEqual([
      expect.objectContaining({
        id: '1:cast',
        kind: 'cast',
        actorId: 'brann',
        targetId: 'wolf',
        relay: 3,
        visual: expect.objectContaining({
          phase: 'windup',
          headline: '熔火起手',
        }),
      }),
      expect.objectContaining({
        id: '2:hit',
        kind: 'hit',
        amount: 38,
        visual: expect.objectContaining({ headline: '重擊', number: -38 }),
      }),
      expect.objectContaining({ id: '3:status', kind: 'status', amount: 4 }),
      expect.objectContaining({ id: '4:chain', kind: 'chain', targetId: 'wolf_guard' }),
      expect.objectContaining({ id: '5:relay', kind: 'relay', relay: 3 }),
    ]);
  });

  it('strictly escalates all six relays and gives the sixth a finisher treatment', () => {
    const stages = [1, 2, 3, 4, 5, 6].map(relayPresentation);

    expect(
      stages
        .map(({ visualPower }) => visualPower)
        .every((power, index, values) => index === 0 || power > values[index - 1]!),
    ).toBe(true);
    expect(stages[0]).toMatchObject({ relay: 1, finisher: false, label: '接力 1 / 6' });
    expect(stages[5]).toMatchObject({ relay: 6, finisher: true, label: '終結 6 / 6' });
  });

  it('keeps reduced-motion timing discrete without delaying interaction for seconds', () => {
    const beats = createCombatBeats(events, 4, true);

    expect(beats).toHaveLength(events.length);
    expect(beats.every(({ delayMs }) => delayMs === 0)).toBe(true);
  });

  it('holds input through the final visible beat before completing playback', () => {
    const beats = createCombatBeats(events.slice(0, 2), 2);

    expect(advanceCombatPlayback(beats, 0)).toEqual({ index: 1, complete: false });
    expect(advanceCombatPlayback(beats, 1)).toEqual({ index: 1, complete: true });
  });
});
