import { previewSkillOutcome } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { guildRpgReducer } from '../state/game-reducer';
import { createSkillActionPresentation } from './skill-action-presentation';

const setup = (skillIndex: number) => {
  const state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  const battle = state.battle!;
  const actorId = battle.roundOrder!.activeAdventurerId!;
  const targetId = battle.selectedTargetId!;
  const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
  const skill = state.profile.skillInventory.find(({ id }) => id === member.skillIds[skillIndex])!;
  const preview = previewSkillOutcome({
    battle,
    actorId,
    targetId,
    skillId: skill.id,
    content: createSkillEngineContent(state.profile),
  });
  return { skill, preview };
};

describe('skill action presentation', () => {
  it('turns a ready combo into one closed player-language result', () => {
    const { skill, preview } = setup(0);
    const chaseDamage = preview.comboSteps.reduce((sum, step) => sum + step.chaseDamage, 0);
    const result = createSkillActionPresentation(skill, preview);

    expect(result).toMatchObject({
      name: '引火',
      damageLabel: `傷${preview.totalDamage}`,
      hitLabel: `${preview.damageSegments}擊`,
      baseLabel: `先傷${preview.totalDamage - chaseDamage}·燃+1`,
      conditionLabel: '開戰時',
      conditionState: 'ready',
      addedLabel: expect.stringMatching(/^追加/),
      ready: true,
    });
    expect(result.nextRelay?.actorId).toBeTruthy();
    expect(result.nextRelay?.skillId).toBeTruthy();
    expect(result.sentence).toContain(`造成${preview.totalDamage - chaseDamage}傷`);
    expect(result.sentence).toContain(`再造成${chaseDamage}傷`);
    expect(result.sentence).toMatch(/附加\d+燃燒/);
    expect(result.sentence).not.toMatch(/已亮|出招亮|起手|結果|事件|總\d/);
  });

  it('states one missing condition without exposing engine readiness language', () => {
    const { skill, preview } = setup(1);
    const result = createSkillActionPresentation(skill, preview);

    expect(result.ready).toBe(false);
    expect(result).toMatchObject({
      baseLabel: expect.stringMatching(/^先傷/),
      conditionLabel: '敵人燃燒時',
      conditionState: 'not-ready',
      addedLabel: expect.stringMatching(/^可/),
    });
    expect(result.blockingReason).toBe('需要敵人燃燒');
    expect(result.sentence).not.toMatch(/缺燃燒|not-ready|已亮|出招亮/);
  });
});
