import { previewSkillOutcome, type SkillOutcomePreview } from '@expedition/simulation-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { guildRpgReducer } from '../state/game-reducer';
import { SixSkillControls } from './SixSkillControls';

const setup = () => {
  const state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  const battle = state.battle!;
  const actorId = battle.roundOrder!.activeAdventurerId!;
  const targetId = battle.selectedTargetId!;
  const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
  const content = createSkillEngineContent(state.profile);
  const previews = new Map<string, SkillOutcomePreview>(
    member.skillIds.map((skillId) => [
      skillId,
      previewSkillOutcome({ battle, actorId, targetId, skillId, content }),
    ]),
  );
  return { state, member, previews };
};

describe('SixSkillControls', () => {
  it('keeps each unselected skill to a name and at most three outcome facts', () => {
    const { state, previews } = setup();
    const markup = renderToStaticMarkup(
      <SixSkillControls state={state} previews={previews} onChooseSkill={() => undefined} />,
    );

    expect(markup).toContain('data-skill-mode="choose"');
    expect(markup.match(/data-battle-skill=/g) ?? []).toHaveLength(6);
    expect(markup).toContain('data-skill-fact="damage"');
    expect(markup).not.toMatch(/data-combo-node|已亮|出招亮|缺燃燒|目標燃燒|上一棒火/);
  });

  it('turns the six skills into compact switch tabs while one skill is focused', () => {
    const { state, member, previews } = setup();
    const markup = renderToStaticMarkup(
      <SixSkillControls
        state={state}
        armedSkillId={member.skillIds[0]}
        previews={previews}
        onChooseSkill={() => undefined}
      />,
    );

    expect(markup).toContain('data-skill-mode="focus"');
    expect(markup.match(/data-skill-switch=/g) ?? []).toHaveLength(6);
    expect(markup).not.toContain('class="gr-skill-outcome"');
  });
});
