import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { BattlefieldTacticalLayer } from './BattlefieldTacticalLayer';

describe('BattlefieldTacticalLayer', () => {
  it('renders deterministic formations from existing battle facts', () => {
    const started = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const units = started.battle!.units.map((unit) =>
      unit.id === 'wolf_alpha' ? { ...unit, currentHp: 0 } : unit,
    );
    const props = {
      units,
      selectedTargetId: 'wolf_scout',
      impact: { kind: 'overkill' as const, targetId: 'wolf_alpha' },
      motif: 'storm' as const,
      mode: 'playback' as const,
    };

    const markup = renderToStaticMarkup(<BattlefieldTacticalLayer {...props} />);
    const repeatedMarkup = renderToStaticMarkup(<BattlefieldTacticalLayer {...props} />);

    expect(markup).toBe(repeatedMarkup);
    expect(markup.match(/data-tactical-formation=/g) ?? []).toHaveLength(6);
    expect(markup.match(/data-tactical-soldier=/g) ?? []).toHaveLength(54);
    expect(markup).toContain('data-selected="true" data-unit-id="wolf_scout"');
    expect(markup).toContain('data-impacted="true"');
    expect(markup).toContain('data-defeated="true"');
    expect(markup).toContain('data-tactical-route="ricochet"');
  });
});
