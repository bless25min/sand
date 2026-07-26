import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { BattleScreen } from './BattleScreen';
import { GuildScreen } from './GuildScreen';

const dispatch = () => undefined;

describe('deterministic six-hero interface', () => {
  it('keeps four permanent pages and makes the selected hero plus six skills explicit', () => {
    let state = createGuildRpgState();
    state = guildRpgReducer(state, { type: 'NAVIGATE', page: 'party' });
    state = guildRpgReducer(state, { type: 'SELECT_HERO', adventurerId: 'brann' });
    state = guildRpgReducer(state, { type: 'NAVIGATE', page: 'skills' });
    const markup = renderToStaticMarkup(<GuildScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('任務');
    expect(markup).toContain('隊伍');
    expect(markup).toContain('技能');
    expect(markup).toContain('裝備');
    expect(markup).toContain('目前角色：布蘭');
    expect(markup.match(/data-skill-slot=/g) ?? []).toHaveLength(6);
    expect(markup).toContain('可選技能');
    expect(markup).not.toContain('Build');
  });

  it('equips one skill then automatically advances to the next hero', () => {
    let state = createGuildRpgState();
    state = guildRpgReducer(state, { type: 'NAVIGATE', page: 'party' });
    state = guildRpgReducer(state, { type: 'SELECT_HERO', adventurerId: 'brann' });
    state = guildRpgReducer(state, { type: 'NAVIGATE', page: 'skills' });
    const lyraSkill = state.profile.party[1]!.skillIds[0]!;
    state = guildRpgReducer(state, { type: 'SELECT_SKILL_SLOT', slotIndex: 0 });
    state = guildRpgReducer(state, { type: 'EQUIP_SKILL', skillId: lyraSkill });

    expect(state.profile.party[0]?.skillIds[0]).toBe(lyraSkill);
    expect(state.selectedHeroId).toBe('lyra');
    expect(state.message).toContain('下一位：萊拉');
  });

  it('renders six combat skills and resolves each tap before the next hero acts', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const targetId = state.battle!.units.find(({ side }) => side === 'enemies')!.id;
    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId });
    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);

    expect(markup.match(/data-order-hero=/g) ?? []).toHaveLength(6);
    expect(markup.match(/data-battle-skill=/g) ?? []).toHaveLength(6);
    expect(markup).toContain('目前出手：布蘭');

    const skillId = state.profile.party[0]!.skillIds[0]!;
    const resolved = guildRpgReducer(state, { type: 'USE_SKILL', skillId, targetId });
    expect(resolved.battle?.events.some(({ kind }) => kind === 'skill_cast')).toBe(true);
    expect(resolved.battle?.roundOrder?.activeAdventurerId).toBe('lyra');
    expect(resolved.recentEvents[0]?.actorId).toBe('brann');
  });

  it('lets an unacted portrait become next and resets temporary order next round', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'CHOOSE_NEXT_HERO', adventurerId: 'seph' });
    expect(state.battle?.roundOrder?.activeAdventurerId).toBe('seph');
    expect(state.battle?.roundOrder?.currentOrder[0]).toBe('seph');
  });

  it('uses responsive 2 × 3 controls with 48px targets and no blocking coach overlay', () => {
    const css = readFileSync(new URL('../guild-rpg.css', import.meta.url), 'utf8');
    expect(css).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(css).toMatch(/min-height:\s*48px/);
    expect(css).toContain('@media (min-width: 760px)');
    expect(css).not.toContain('.gr-coach { position: fixed');
  });
});
