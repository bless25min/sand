import { describe, expect, it } from 'vitest';

import { createFirstHuntCoach, isFirstHuntCoachFocus, TUTORIAL_STEPS } from './first-hunt-coach';

describe('complete RPG onboarding coach', () => {
  it('teaches the first hunt through six real relay actions before configuration', () => {
    expect(TUTORIAL_STEPS).toEqual([
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
      'replay',
      'complete',
    ]);
    for (const step of TUTORIAL_STEPS.slice(0, -1)) {
      const coach = createFirstHuntCoach('active', step);
      expect(coach?.focusId, step).toBeTruthy();
      expect(coach?.message, step).not.toBe('');
      expect(coach).not.toHaveProperty('onNext');
    }
  });

  it('names the acting hero, relay count, and six immediately available skills', () => {
    expect(createFirstHuntCoach('active', 'relay_1', { heroName: '布蘭' })).toMatchObject({
      title: '第 1 棒：布蘭',
      focusId: 'battle:skill',
    });
    expect(createFirstHuntCoach('active', 'relay_1', { heroName: '布蘭' })?.message).toContain(
      '六個技能',
    );
  });

  it('keeps a usable combat action focused after six relays until victory exists', () => {
    expect(
      createFirstHuntCoach('active', 'collect_reward', { battleStatus: 'active' }),
    ).toMatchObject({
      title: '自由接力，殲滅剩餘敵人',
      focusId: 'battle:skill',
    });
    expect(
      createFirstHuntCoach('active', 'collect_reward', { battleStatus: 'victory' }),
    ).toMatchObject({
      title: '接力完成，收下戰利品',
      focusId: 'battle:collect',
    });
    expect(
      isFirstHuntCoachFocus('active', 'collect_reward', 'battle:skill', {
        battleStatus: 'active',
      }),
    ).toBe(true);
  });

  it('stays absent after skip or completion', () => {
    expect(createFirstHuntCoach('skipped', 'start_hunt')).toBeUndefined();
    expect(createFirstHuntCoach('complete', 'complete')).toBeUndefined();
  });
});
