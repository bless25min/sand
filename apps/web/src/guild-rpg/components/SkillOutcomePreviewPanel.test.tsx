import { previewSkillOutcome } from '@expedition/simulation-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { guildRpgReducer } from '../state/game-reducer';
import { SkillOutcomePreviewPanel } from './SkillOutcomePreviewPanel';

describe('SkillOutcomePreviewPanel', () => {
  it('explains an armed skill as one compact causal chain before optional numbers', () => {
    const state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const battle = state.battle!;
    const actorId = battle.roundOrder!.activeAdventurerId!;
    const target = battle.units.find(({ side }) => side === 'enemies')!;
    const actor = battle.units.find(({ id }) => id === actorId)!;
    const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
    const skill = state.profile.skillInventory.find(({ id }) => id === member.skillIds[0])!;
    const preview = previewSkillOutcome({
      battle,
      actorId,
      skillId: skill.id,
      targetId: target.id,
      content: createSkillEngineContent(state.profile),
    });

    const markup = renderToStaticMarkup(
      <SkillOutcomePreviewPanel
        actor={actor}
        target={target}
        skill={skill}
        preview={preview}
        units={battle.units}
      />,
    );

    expect(markup.match(/data-causal-step=/g) ?? []).toHaveLength(4);
    expect(markup).toContain('data-causal-step="element"');
    expect(markup).toContain('data-causal-step="specialization"');
    expect(markup).toContain('data-causal-step="trigger"');
    expect(markup).toContain('data-causal-step="result"');
    expect(markup).toContain('data-trigger-ready=');
    expect(markup).toContain('<details');
    expect(markup.indexOf('data-causal-step="result"')).toBeLessThan(
      markup.indexOf('class="gr-preview-formula"'),
    );
  });
});
