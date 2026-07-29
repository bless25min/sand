import { describe, expect, it } from 'vitest';

import { createCombatMotion } from './combat-motion-plan';

describe('combat motion plan', () => {
  it('makes every later relay lunge farther than the previous relay', () => {
    const offsets = [1, 2, 3, 4, 5, 6].map(
      (relay) =>
        createCombatMotion({
          side: 'heroes',
          state: 'acting',
          phase: 'travel',
          relay,
          progress: 0.5,
          finisher: relay === 6,
        }).x,
    );

    expect(offsets.every((offset, index) => index === 0 || offset > offsets[index - 1]!)).toBe(
      true,
    );
  });

  it('gives hit enemies recoil and lifts the whole party into the sixth finisher', () => {
    const hit = createCombatMotion({
      side: 'enemies',
      state: 'hit',
      phase: 'impact',
      relay: 4,
      progress: 0.35,
      finisher: false,
    });
    const finisherHero = createCombatMotion({
      side: 'heroes',
      state: 'idle',
      phase: 'finisher',
      relay: 6,
      progress: 0.5,
      finisher: true,
    });

    expect(hit.x).toBeGreaterThan(12);
    expect(Math.abs(hit.rotation)).toBeGreaterThan(0);
    expect(finisherHero.y).toBeLessThan(-8);
    expect(finisherHero.scale).toBeGreaterThan(1);
  });

  it('makes every relay recoil harder and turns the sixth hit into a major knockback', () => {
    const recoils = [1, 2, 3, 4, 5, 6].map(
      (relay) =>
        createCombatMotion({
          side: 'enemies',
          state: 'hit',
          phase: 'impact',
          relay,
          progress: 0.5,
          finisher: relay === 6,
        }).x,
    );

    expect(recoils.every((offset, index) => index === 0 || offset > recoils[index - 1]!)).toBe(
      true,
    );
    expect(recoils[5]).toBeGreaterThan(50);
  });

  it('gives all six hero weapons a distinct casting posture and travel distance', () => {
    const weapons = ['shield', 'bow', 'staff', 'flask', 'tome', 'blades'] as const;
    const motions = weapons.map((weapon) =>
      createCombatMotion({
        side: 'heroes',
        state: 'acting',
        phase: 'travel',
        relay: 4,
        progress: 0.5,
        finisher: false,
        weapon,
      }),
    );
    const signatures = motions.map(
      ({ x, y, scale, rotation }) =>
        `${x.toFixed(2)}:${y.toFixed(2)}:${scale.toFixed(3)}:${rotation.toFixed(3)}`,
    );

    expect(new Set(signatures).size).toBe(weapons.length);
    expect(motions[5]!.x).toBeGreaterThan(motions[0]!.x);
    expect(motions[2]!.y).toBeLessThan(motions[1]!.y);
    expect(Math.abs(motions[3]!.rotation)).toBeGreaterThan(Math.abs(motions[4]!.rotation));
  });
});
