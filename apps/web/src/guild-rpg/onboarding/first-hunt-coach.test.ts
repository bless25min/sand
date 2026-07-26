import { describe, expect, it } from 'vitest';

import { createFirstHuntCoach, TUTORIAL_STEPS } from './first-hunt-coach';

describe('complete RPG onboarding coach', () => {
  it('teaches every real page and battle action instead of advancing from one fake button', () => {
    expect(TUTORIAL_STEPS).toEqual([
      'inspect_party',
      'select_hero',
      'inspect_skills',
      'equip_skill',
      'inspect_equipment',
      'start_hunt',
      'select_target',
      'use_skill',
      'reorder',
      'collect_reward',
      'equip_loot',
      'forge_loot',
      'fuse_skill',
      'equip_fused',
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

  it('names the selected hero and all six skill choices at the decision point', () => {
    expect(createFirstHuntCoach('active', 'select_hero')).toMatchObject({
      title: '選一名角色',
      focusId: 'hero:first',
    });
    expect(createFirstHuntCoach('active', 'equip_skill', { heroName: '布蘭' })).toMatchObject({
      title: '替布蘭選擇技能',
      focusId: 'skill:equip',
    });
    expect(createFirstHuntCoach('active', 'equip_skill', { heroName: '布蘭' })?.message).toContain(
      '六格',
    );
  });

  it('stays absent after skip or completion', () => {
    expect(createFirstHuntCoach('skipped', 'inspect_party')).toBeUndefined();
    expect(createFirstHuntCoach('complete', 'complete')).toBeUndefined();
  });
});
