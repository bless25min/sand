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

  it('shows a finisher forecast instead of zero damage against a broken target', () => {
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
    const base = previewSkillOutcome({
      battle,
      actorId,
      skillId: skill.id,
      targetId: target.id,
      content: createSkillEngineContent(state.profile),
    });
    const preview = {
      ...base,
      executionWindow: true,
      finisherPower: 40,
      relayEchoes: 5,
      totalDamage: 0,
      overkill: 40,
      damageSegments: 0,
      chaseSegments: 0,
      nextRelay: undefined,
    };

    const markup = renderToStaticMarkup(
      <SkillOutcomePreviewPanel
        actor={actor}
        target={{ ...target, currentHp: 0 }}
        skill={skill}
        preview={preview}
        units={battle.units}
      />,
    );

    expect(markup).toContain('處刑預演');
    expect(markup).toContain('回收5次');
    expect(markup).toContain('處刑40');
    expect(markup).toContain('OVERKILL +40');
    expect(markup).not.toContain('0段');
    expect(markup).not.toContain('基本命中');
  });

  it('shows an escalating recovery state when enemies break before the sixth relay', () => {
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
    const base = previewSkillOutcome({
      battle,
      actorId,
      skillId: skill.id,
      targetId: target.id,
      content: createSkillEngineContent(state.profile),
    });

    const markup = renderToStaticMarkup(
      <SkillOutcomePreviewPanel
        actor={actor}
        target={{ ...target, currentHp: 0 }}
        skill={skill}
        preview={{
          ...base,
          executionWindow: true,
          finisherPower: 0,
          relayEchoes: 4,
          totalDamage: 0,
          overkill: 26,
          damageSegments: 0,
          chaseSegments: 0,
          nextRelay: undefined,
        }}
        units={battle.units}
      />,
    );

    expect(markup).toContain('餘震回收');
    expect(markup).toContain('回收4次');
    expect(markup).toContain('OVERKILL +26');
    expect(markup).toContain('第六棒蓄勢');
    expect(markup).not.toContain('處刑0');
  });
});
