import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { BattleFocusHud } from './BattleFocusHud';

describe('BattleFocusHud', () => {
  it('names a zero-hp target as broken and ready for execution', () => {
    const started = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const battle = {
      ...started.battle!,
      units: started.battle!.units.map((unit) =>
        unit.side === 'enemies' ? { ...unit, currentHp: 0 } : unit,
      ),
    };

    const markup = renderToStaticMarkup(
      <BattleFocusHud
        battle={battle}
        actorId={battle.roundOrder!.activeAdventurerId}
        executionWindow
      />,
    );

    expect(markup).toContain('破勢');
    expect(markup).toContain('等待處刑');
    expect(markup).not.toContain('HP 0/');
  });
});
