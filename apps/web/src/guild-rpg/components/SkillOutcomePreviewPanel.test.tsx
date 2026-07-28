import { previewSkillOutcome } from '@expedition/simulation-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { guildRpgReducer } from '../state/game-reducer';
import { SkillOutcomePreviewPanel } from './SkillOutcomePreviewPanel';

describe('SkillOutcomePreviewPanel', () => {
  it('shows a readable trigger-to-effect rail before optional calculations', () => {
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

    expect(markup).toContain('data-preview-total=');
    expect(markup).toContain('data-combo-step=');
    expect(markup).toContain('開戰');
    expect(markup).toContain('已成立');
    expect(markup).toContain('追傷6');
    expect(markup).toContain('2段');
    expect(markup).toContain('1追擊');
    expect(markup).toContain('本次：');
    expect(markup).toContain(`總傷${preview.totalDamage}`);
    expect(markup).toContain('接棒：萊拉');
    expect(markup).not.toContain('×2');
    expect(markup).toContain(`data-preview-unit="${target.id}"`);
    expect(markup).toContain(`${target.currentHp} →`);
    expect(markup).not.toContain('data-causal-step=');
    expect(markup).not.toContain('疊層');
    expect(markup).toContain('<details');
    expect(markup).toContain('結果');
    expect(markup).toContain('計算');
  });
});
