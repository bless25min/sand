import { describe, expect, it } from 'vitest';

import { chooseSkillIntent, chooseTargetIntent } from './skill-command-intent';

describe('skill command intent', () => {
  it('arms a skill first and casts it on the current target when tapped again', () => {
    expect(chooseSkillIntent(undefined, 'fire', 'wolf')).toEqual({ arm: 'fire' });
    expect(chooseSkillIntent('fire', 'fire', 'wolf')).toEqual({
      cast: { skillId: 'fire', targetId: 'wolf' },
    });
  });

  it('switches the armed skill without casting', () => {
    expect(chooseSkillIntent('fire', 'water', 'wolf')).toEqual({ arm: 'water' });
  });

  it('casts an armed skill on the tapped target and otherwise only selects it', () => {
    expect(chooseTargetIntent('fire', 'guard')).toEqual({
      cast: { skillId: 'fire', targetId: 'guard' },
    });
    expect(chooseTargetIntent(undefined, 'guard')).toEqual({ select: 'guard' });
  });

  it('keeps an armed skill waiting when there is no current target', () => {
    expect(chooseSkillIntent('fire', 'fire', undefined)).toEqual({ arm: 'fire' });
  });
});
