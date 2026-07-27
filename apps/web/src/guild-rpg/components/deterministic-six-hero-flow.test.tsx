import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { BattleScreen } from './BattleScreen';
import { GuildScreen } from './GuildScreen';
import { RewardScreen } from './RewardScreen';

const dispatch = () => undefined;

describe('deterministic six-hero interface', () => {
  it('starts with one dominant teaching hunt and defers the configuration checklist', () => {
    const fresh = createGuildRpgState();
    const freshMarkup = renderToStaticMarkup(<GuildScreen state={fresh} dispatch={dispatch} />);

    expect(freshMarkup).toContain('data-first-session="true"');
    expect(freshMarkup.match(/開始第一場教學戰/g) ?? []).toHaveLength(1);
    expect(freshMarkup).toContain('1. 鎖定敵人');
    expect(freshMarkup).toContain('2. 選擇技能');
    expect(freshMarkup).toContain('3. 完成六棒接力');
    expect(freshMarkup).toContain('<details');
    expect(freshMarkup.indexOf('開始第一場教學戰')).toBeLessThan(freshMarkup.indexOf('<details'));
    expect(freshMarkup).toContain('data-secondary-hunts="true"');

    const trainingState = {
      ...fresh,
      page: 'equipment' as const,
      tutorialStep: 'equip_loot' as const,
    };
    const trainingMarkup = renderToStaticMarkup(
      <GuildScreen state={trainingState} dispatch={dispatch} />,
    );
    expect(trainingMarkup).toContain('aria-label="公會訓練清單"');
    expect(trainingMarkup).toContain('data-training-active="equip_loot"');
    expect(trainingMarkup).toContain('1 / 6');
  });

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
    expect(markup).toContain('1 選角色');
    expect(markup).toContain('2 選技能格');
    expect(markup).toContain('3 裝備技能');
    expect(markup).toContain('可選技能');
    expect(markup).toContain('data-progressive-skill-library="true"');
    expect(markup).toContain('data-skill-library="visible"');
    expect(markup).not.toContain('Build');
  });

  it('keeps the selected hero and next action explicit on party and equipment pages', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'SET_TUTORIAL',
      tutorial: 'skipped',
    });
    state = guildRpgReducer(state, { type: 'NAVIGATE', page: 'party' });
    const partyMarkup = renderToStaticMarkup(<GuildScreen state={state} dispatch={dispatch} />);
    expect(partyMarkup).toContain('data-party-selected-hero="brann"');
    expect(partyMarkup).toContain('目前操作：布蘭');
    expect(partyMarkup).toContain('配置布蘭技能');
    expect(partyMarkup).toContain('更換布蘭裝備');

    state = guildRpgReducer(state, { type: 'NAVIGATE', page: 'equipment' });
    const equipmentMarkup = renderToStaticMarkup(<GuildScreen state={state} dispatch={dispatch} />);
    expect(equipmentMarkup).toContain('data-equipment-next-action="true"');
    expect(equipmentMarkup.match(/data-equipment-slot=/g) ?? []).toHaveLength(3);
    expect(equipmentMarkup).toContain('1 選角色');
    expect(equipmentMarkup).toContain('2 看三個欄位');
    expect(equipmentMarkup).toContain('3 比較並裝備');
  });

  it('shows four discoverable zones while keeping each mission choice compact', () => {
    const state = guildRpgReducer(createGuildRpgState(), {
      type: 'SET_TUTORIAL',
      tutorial: 'skipped',
    });
    const markup = renderToStaticMarkup(<GuildScreen state={state} dispatch={dispatch} />);

    expect(markup.match(/data-zone-tab=/g) ?? []).toHaveLength(4);
    expect(markup).toContain('data-zone-missions="greyfang_frontier"');
    expect(markup.match(/data-hunt-card=/g) ?? []).toHaveLength(3);
    expect(markup).toContain('本區 3 個任務');
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

  it('pins the newly fused skill inside the immediately equipable skill list', () => {
    const fresh = createGuildRpgState();
    const lastSkill = fresh.profile.skillInventory.at(-1)!;
    const state = {
      ...fresh,
      page: 'skills' as const,
      tutorialStep: 'equip_fused' as const,
      lastFusedSkillId: lastSkill.id,
    };
    const markup = renderToStaticMarkup(<GuildScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('data-guide-id="skill:equip-fused"');
  });

  it('renders a tactical battlefield and resolves each tap before the next hero acts', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const targetId = state.battle!.units.find(({ side }) => side === 'enemies')!.id;
    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId });
    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);

    expect(markup.match(/data-order-hero=/g) ?? []).toHaveLength(6);
    expect(markup.match(/data-battle-skill=/g) ?? []).toHaveLength(6);
    expect(markup).toContain('data-combat-battlefield="true"');
    expect(markup).toContain('data-pixi-combat-stage="true"');
    expect(markup).toContain('data-combat-canvas-host="true"');
    expect(markup.match(/data-hero-formation=/g) ?? []).toHaveLength(6);
    expect(markup.match(/data-enemy-formation=/g) ?? []).toHaveLength(3);
    expect(markup).toContain('戰鬥詳情');
    expect(markup).toContain('data-current-actor="brann"');
    expect(markup).toContain('data-next-actor="lyra"');
    expect(markup).toContain('目前出手：布蘭');

    const skillId = state.profile.party[0]!.skillIds[0]!;
    const resolved = guildRpgReducer(state, { type: 'USE_SKILL', skillId, targetId });
    const resolvedMarkup = renderToStaticMarkup(
      <BattleScreen state={resolved} dispatch={dispatch} />,
    );
    expect(resolved.battle?.events.some(({ kind }) => kind === 'skill_cast')).toBe(true);
    expect(resolved.battle?.roundOrder?.activeAdventurerId).toBe('lyra');
    expect(resolved.recentEvents[0]?.actorId).toBe('brann');
    expect(resolvedMarkup).toContain('data-combat-beat="cast"');
    expect(resolvedMarkup).toContain('data-relay-tier="1"');
    expect(resolvedMarkup).toMatch(/布蘭.*施放/);
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

  it('reveals every main drop visually and recommends an immediate build action', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    let turns = 0;
    while (state.screen === 'battle' && turns < 60) {
      if (state.battle?.status === 'victory') {
        state = guildRpgReducer(state, { type: 'COLLECT_VICTORY' });
        break;
      }
      const target = state.battle!.units.find(
        ({ side, currentHp }) => side === 'enemies' && currentHp > 0,
      )!;
      const actorId = state.battle!.roundOrder!.activeAdventurerId;
      const actor = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
      state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: target.id });
      state = guildRpgReducer(state, {
        type: 'USE_SKILL',
        skillId: actor.skillIds[turns % actor.skillIds.length]!,
        targetId: target.id,
      });
      turns += 1;
    }
    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);

    expect(markup.match(/data-loot-reveal=/g) ?? []).toHaveLength(6);
    expect(markup).toContain('data-loot-recommendation="true"');
    expect(markup).toContain('這次最值得先試');
    expect(markup).toContain('為什麼有用');
    expect(markup).toContain('先穿上推薦裝備');
  });

  it('uses a scoped mobile 2-row × 3-column command grid and preserves a meaningful battlefield', () => {
    const css = readFileSync(new URL('../guild-rpg.css', import.meta.url), 'utf8');
    expect(css).toMatch(
      /@media \(max-width: 620px\)[\s\S]*?\.gr-battle-skills\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(css).toMatch(
      /@media \(max-width: 620px\)[\s\S]*?\.gr-battle-skills button\s*\{[^}]*min-height:\s*56px/,
    );
    expect(css).toMatch(
      /@media \(max-width: 620px\)[\s\S]*?\.gr-combat-battlefield\s*\{[^}]*min-height:\s*360px/,
    );
    expect(css).not.toContain('.gr-coach { position: fixed');
  });
});
