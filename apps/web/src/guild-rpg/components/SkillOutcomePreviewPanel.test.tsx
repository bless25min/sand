import { previewSkillOutcome } from '@expedition/simulation-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { createSkillEngineContent } from '../state/create-skill-engine-content';
import { guildRpgReducer } from '../state/game-reducer';
import { SkillOutcomePreviewPanel } from './SkillOutcomePreviewPanel';

describe('SkillOutcomePreviewPanel', () => {
  it('shows one compact base-condition-result preview with next relay and one commit action', () => {
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
        skills={state.profile.skillInventory}
        units={battle.units}
        preview={preview}
        onConfirm={() => undefined}
      />,
    );

    expect(markup).toContain('data-action-sentence="true"');
    expect(markup).toContain('data-confirm-skill="true"');
    expect(markup).toContain(`對${target.name}施放`);
    expect(markup).toContain('data-preview-endpoints="true"');
    expect(markup).toContain(`data-preview-unit="${target.id}"`);
    expect(markup).toContain(`${target.currentHp} →`);
    expect(markup).toContain('class="gr-causal-preview"');
    expect(markup).toContain('data-causal-stage="base"');
    expect(markup).toContain('data-causal-stage="condition"');
    expect(markup).toContain('data-causal-stage="added"');
    expect(markup).toContain('data-condition-state="ready"');
    expect(markup).toContain('data-next-relay=');
    expect(markup).toContain('data-relay-skill=');
    expect(markup).not.toMatch(/<details|已亮|出招亮|起手|事件/);
  });

  it('shows the real round finisher total without presenting it as repeated damage', () => {
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
      nextRelays: [],
    };

    const markup = renderToStaticMarkup(
      <SkillOutcomePreviewPanel
        actor={actor}
        target={{ ...target, currentHp: 0 }}
        skill={skill}
        skills={state.profile.skillInventory}
        units={battle.units}
        preview={preview}
        onConfirm={() => undefined}
      />,
    );

    expect(markup).toContain('終結預演');
    expect(markup).toContain('本輪40');
    expect(markup).toContain('OVERKILL +40');
    expect(markup).not.toContain('回收5次');
    expect(markup).not.toContain('基本命中');
  });

  it('shows overkill as already existing overflow when no stored finisher exists', () => {
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
        skills={state.profile.skillInventory}
        units={battle.units}
        preview={{
          ...base,
          executionWindow: true,
          finisherPower: 0,
          relayEchoes: 4,
          totalDamage: 0,
          overkill: 26,
          damageSegments: 0,
          chaseSegments: 0,
          nextRelays: [],
        }}
        onConfirm={() => undefined}
      />,
    );

    expect(markup).toContain('破勢預演');
    expect(markup).toContain('OVERKILL +26');
    expect(markup).toContain('本招不新增假傷害');
    expect(markup).not.toContain('處刑0');
    expect(markup).not.toContain('回收4次');
  });
});
