import { describe, expect, it } from 'vitest';

import { chooseSkillIntent, chooseTargetIntent, confirmSkillIntent } from './skill-command-intent';

describe('skill command intent', () => {
  it('only arms the tapped skill even when it is tapped again', () => {
    expect(chooseSkillIntent('fire')).toEqual({ arm: 'fire' });
    expect(chooseSkillIntent('fire')).toEqual({ arm: 'fire' });
  });

  it('only changes the target while a skill is armed', () => {
    expect(chooseTargetIntent('guard')).toEqual({ select: 'guard' });
  });

  it('casts only through the explicit confirmation action', () => {
    expect(confirmSkillIntent('fire', 'guard')).toEqual({
      cast: { skillId: 'fire', targetId: 'guard' },
    });
    expect(confirmSkillIntent(undefined, 'guard')).toEqual({ blocked: 'skill' });
    expect(confirmSkillIntent('fire', undefined)).toEqual({ blocked: 'target' });
  });
});
